import { useState, useEffect } from "react";
import { fetchAccountTransactions } from "../api/api";

export default function AccountDetailsView({ account, onBack }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getTransactions = async () => {
            try {
                const data = await fetchAccountTransactions(account.id);
                setTransactions(data);
            } catch (err) {
                console.error("Failed to fetch account transactions:", err);
            } finally {
                setLoading(false);
            }
        };
        getTransactions();
    }, [account.id]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={onBack}
                className="flex items-center text-sm font-bold text-gray-400 hover:text-[#0B3D91] transition-colors group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                BACK TO ACCOUNTS
            </button>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#0B3D91] text-white rounded">
                                {account.account_type}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">
                                ACTIVE
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                            {account.account_number}
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-3xl font-black text-[#0B3D91]">
                            {formatCurrency(account.balance)}
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center">
                        Last 5 Transactions
                        <span className="ml-4 flex-1 h-px bg-gray-100"></span>
                    </h3>

                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="w-6 h-6 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-4">
                            {transactions.map((t) => {
                                const isDebit = t.type === 'withdraw' || (t.type === 'transfer' && t.amount > 0);
                                return (
                                    <div key={t.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 capitalize">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDebit ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    {isDebit ? <path d="m19 12-7 7-7-7M12 5v14" /> : <path d="m5 12 7-7 7 7M12 19V5" />}
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{t.type}</p>
                                                <p className="text-[10px] font-medium text-gray-400">
                                                    {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-black ${isDebit ? 'text-red-700' : 'text-green-700'}`}>
                                            {isDebit ? '-' : '+'} {formatCurrency(Math.abs(t.amount))}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-xs text-gray-400 font-medium italic">
                            No recent transactions found for this account.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
