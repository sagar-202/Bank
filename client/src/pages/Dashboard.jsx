import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkBalance, addBalance, logout } from "../api/api";

export default function Dashboard() {
    const [balance, setBalance] = useState(null);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const fetchBalance = async () => {
        try {
            const data = await checkBalance();
            if (data) setBalance(data.balance);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    const handleDeposit = async (e) => {
        e.preventDefault();
        setError(""); setMessage("");
        setProcessing(true);

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid amount");
            setProcessing(false);
            return;
        }

        try {
            const data = await addBalance(Number(amount));
            if (data) {
                setMessage("Deposit successful");
                setAmount("");
                setBalance(data.balance);
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleLogout = async () => {
        try { await logout(); } catch { }
        navigate("/");
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
                <p className="animate-pulse">Loading wallet...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 flex flex-col items-center font-sans text-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">KodBank</h1>
                        <p className="text-sm text-gray-500 font-medium">Digital Wallet</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Balance Section */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">Available Balance</p>
                    {balance !== null ? (
                        <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight transition-all duration-300">
                            <span className="text-3xl text-gray-400 font-normal mr-1">₹</span>
                            {formatCurrency(balance)}
                        </h2>
                    ) : (
                        <p className="text-red-500 text-sm">Failed to load</p>
                    )}
                </div>

                {/* Deposit Section */}
                <div className="bg-gray-50 rounded-xl p-6 transition-all duration-300">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Quick Deposit
                    </h3>
                    <form onSubmit={handleDeposit} className="space-y-4">
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium group-focus-within:text-black transition-colors">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                min="1"
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-medium outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-300 shadow-sm"
                                required
                                disabled={processing}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-900 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : "Add Funds"}
                        </button>
                    </form>
                </div>

                {/* Messages */}
                {message && (
                    <div className="mt-4 text-center">
                        <p className="text-green-600 text-sm font-medium animate-fade-in flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {message}
                        </p>
                    </div>
                )}
                {error && (
                    <div className="mt-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg text-center animate-fade-in border border-red-100">
                        {error}
                    </div>
                )}
            </div>

            <p className="mt-8 text-xs text-center text-gray-400">
                Secure 256-bit Encrypted Connection
            </p>
        </div>
    );
}
