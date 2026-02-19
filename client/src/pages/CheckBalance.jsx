import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkBalance } from "../api/api";

export default function CheckBalance() {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const data = await checkBalance();
                if (data) setBalance(data.balance);
            } catch (err) {
                if (err.message.includes("401") || err.message.toLowerCase().includes("authenticated")) {
                    navigate("/");
                } else {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, [navigate]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-500">
                <p className="animate-pulse">Retrieving balance...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 flex flex-col items-center font-sans text-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">

                <div className="text-center mb-8">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Your Available Balance</p>
                    {balance !== null ? (
                        <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight animate-fade-in-up">
                            <span className="text-3xl text-gray-400 font-normal mr-1">₹</span>
                            {formatCurrency(balance)}
                        </h2>
                    ) : (
                        <p className="text-red-500 text-sm">{error || "Failed to load"}</p>
                    )}
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => navigate("/home")}
                        className="w-full bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>

            </div>
        </div>
    );
}
