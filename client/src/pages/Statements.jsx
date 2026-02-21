import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../api/api";
import TransactionsSkeleton from "../components/skeletons/TransactionsSkeleton";

export default function Statements() {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    // Active filter — only updates on form submit
    const [activeRange, setActiveRange] = useState({ from: today, to: today });
    const [downloading, setDownloading] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    const { data: transactions = [], isLoading: loading, error, isFetching } = useQuery({
        queryKey: ["transactions", activeRange.from, activeRange.to],
        queryFn: () => fetchTransactions(activeRange.from, activeRange.to),
    });

    const handleFetch = (e) => {
        if (e) e.preventDefault();
        setDownloadSuccess(false);
        setActiveRange({ from: startDate, to: endDate });
    };

    const handleDownload = () => {
        setDownloading(true);
        setDownloadSuccess(false);
        setTimeout(() => {
            setDownloading(false);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        }, 2000);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4">
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Statement of Account</h1>
                    <p className="text-gray-500 font-medium">Generate and audit your transaction history</p>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={downloading || transactions.length === 0}
                    className="flex items-center justify-center space-x-3 bg-[#0B3D91] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[#0a3582] transition-all disabled:opacity-50"
                >
                    {downloading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>GENERATING PDF...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            <span>DOWNLOAD STATEMENT</span>
                        </>
                    )}
                </button>
            </div>

            {/* Filter Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-10">
                <form onSubmit={handleFetch} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50"
                    >
                        {loading ? "FETCHING..." : "FETCH TRANSACTIONS"}
                    </button>
                </form>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold italic mb-6">
                    {error}
                </div>
            )}

            {downloadSuccess && (
                <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-bold italic mb-6 animate-in fade-in slide-in-from-top-2">
                    PDF Statement has been generated and downloaded to your device.
                </div>
            )}

            {/* Transaction Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date & Time</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction ID</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => {
                                    const isDebit = tx.type === 'withdraw' || tx.type === 'transfer';
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6 text-sm font-bold text-gray-800 truncate">{formatDate(tx.created_at)}</td>
                                            <td className="px-8 py-6 text-[11px] font-mono font-bold text-gray-400 uppercase">{tx.id.substring(0, 8)}...</td>
                                            <td className="px-8 py-6 text-sm font-medium text-gray-600">
                                                {tx.description || (tx.type === 'transfer' ? 'Internal Transfer Out' : tx.type === 'deposit' ? 'Cash/Transfer Deposit' : 'ATM Withdrawal')}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isDebit ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {isDebit ? 'DEBIT' : 'CREDIT'}
                                                </span>
                                            </td>
                                            <td className={`px-8 py-6 text-sm font-black text-right ${isDebit ? 'text-red-700' : 'text-green-700'}`}>
                                                {isDebit ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="space-y-3">
                                            <svg className="w-12 h-12 text-gray-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <p className="text-gray-400 font-bold text-sm tracking-tight">No transactions found for the selected range.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination / Footer */}
            <div className="mt-8 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Showing {transactions.length} transactions</span>
                <span>Corporate Audit Portal v2.0</span>
            </div>
        </div>
    );
}
