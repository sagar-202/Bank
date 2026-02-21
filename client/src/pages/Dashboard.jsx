import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkBalance, addBalance, fetchTransactions, logout } from "../api/api";
import WithdrawModal from "../components/WithdrawModal";
import TransferModal from "../components/TransferModal";

export default function Dashboard() {
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Modal states
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);

    // Quick deposit state
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [amount, setAmount] = useState("");

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [balanceData, transData] = await Promise.all([
                checkBalance(),
                fetchTransactions()
            ]);
            if (balanceData) setBalance(balanceData.balance);
            if (transData) setTransactions(transData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeposit = async (e) => {
        e.preventDefault();
        setError(""); setMessage("");
        setProcessing(true);

        try {
            const numAmount = Number(amount);
            if (!amount || numAmount <= 0) throw new Error("Please enter a valid amount");

            const data = await addBalance(numAmount);
            if (data) {
                setMessage("Deposit successful");
                setBalance(data.balance);
                const transData = await fetchTransactions();
                setTransactions(transData);
                setAmount("");
                setTimeout(() => { setMessage(""); setIsDepositOpen(false); }, 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white text-gray-500 font-sans">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm font-medium tracking-wide">SECURE BANKING INITIALIZING</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xl">K</div>
                    <span className="text-xl font-bold tracking-tight">KodBank</span>
                </div>
                <button
                    onClick={async () => { await logout(); navigate("/"); }}
                    className="text-sm font-semibold text-gray-500 hover:text-black transition-colors"
                >
                    Sign Out
                </button>
            </nav>

            <main className="max-w-4xl mx-auto mt-10 px-6 space-y-8">
                {/* Balance Card */}
                <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Available Balance</p>
                    <h2 className="text-4xl font-bold tracking-tight">
                        {balance !== null ? formatCurrency(balance) : "---"}
                    </h2>
                </section>

                {/* Quick Actions */}
                <section className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => { setIsDepositOpen(!isDepositOpen); setIsWithdrawOpen(false); setIsTransferOpen(false); }}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${isDepositOpen ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
                    >
                        <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        <span className="text-sm font-bold">Deposit</span>
                    </button>
                    <button
                        onClick={() => { setIsWithdrawOpen(true); setIsDepositOpen(false); setIsTransferOpen(false); }}
                        className="bg-white text-gray-700 border border-gray-200 p-4 rounded-2xl hover:border-gray-400 flex flex-col items-center justify-center transition-all"
                    >
                        <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        <span className="text-sm font-bold">Withdraw</span>
                    </button>
                    <button
                        onClick={() => { setIsTransferOpen(true); setIsDepositOpen(false); setIsWithdrawOpen(false); }}
                        className="bg-white text-gray-700 border border-gray-200 p-4 rounded-2xl hover:border-gray-400 flex flex-col items-center justify-center transition-all"
                    >
                        <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <span className="text-sm font-bold">Transfer</span>
                    </button>
                </section>

                {/* Inline Quick Deposit Form (kept simple) */}
                {isDepositOpen && (
                    <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Quick Deposit</h3>
                            <button onClick={() => setIsDepositOpen(false)} className="text-gray-400 hover:text-black">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-black text-2xl font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                                placeholder="0.00"
                                min="1"
                                required
                            />
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
                            >
                                {processing ? "Processing..." : "Add Funds"}
                            </button>
                            {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
                            {message && <p className="text-green-500 text-sm font-medium text-center">{message}</p>}
                        </form>
                    </section>
                )}

                {/* Modals */}
                <WithdrawModal
                    isOpen={isWithdrawOpen}
                    onClose={() => setIsWithdrawOpen(false)}
                    onSuccess={fetchData}
                />
                <TransferModal
                    isOpen={isTransferOpen}
                    onClose={() => setIsTransferOpen(false)}
                    onSuccess={fetchData}
                />

                {/* Transactions Table */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold">Recent Activity</h3>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.length > 0 ? (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold capitalize ${t.type === 'deposit' ? 'text-green-600' : t.type === 'withdraw' ? 'text-red-600' : 'text-blue-600'}`}>
                                                        {t.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-sm">
                                                    {t.type === 'deposit' ? '+' : '-'} {formatCurrency(Math.abs(t.amount))}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-right">
                                                    {new Date(t.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-10 text-center text-sm text-gray-400 italic">
                                                No recent transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
