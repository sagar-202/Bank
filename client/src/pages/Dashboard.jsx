import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchTransactions,
    fetchAccounts
} from "../api/api";
import DepositModal from "../components/DepositModal";
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton";

export default function Dashboard() {
    const queryClient = useQueryClient();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositSuccessMsg, setDepositSuccessMsg] = useState("");

    const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useQuery({
        queryKey: ["accounts"],
        queryFn: fetchAccounts,
    });

    const { data: transactions = [], isLoading: transLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: () => fetchTransactions(),
    });

    const handleDepositSuccess = () => {
        setDepositSuccessMsg("Funds deposited successfully!");
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setTimeout(() => setDepositSuccessMsg(""), 5000);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    if (accountsLoading || transLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header / Page Title */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Financial Overview</h2>
                    <p className="text-gray-500 text-sm">Welcome back to your corporate dashboard.</p>
                </div>
                <button
                    onClick={() => setIsDepositModalOpen(true)}
                    className="bg-[#0B3D91] text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg hover:bg-[#082d6b] transition-all flex items-center space-x-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    <span>Deposit Funds</span>
                </button>
            </div>

            {/* ALERTS */}
            {accountsError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm font-medium">
                    {accountsError.message}
                </div>
            )}
            {depositSuccessMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    {depositSuccessMsg}
                </div>
            )}

            {/* Summary Card */}
            <section className="bg-[#0B3D91] text-white rounded-xl p-8 shadow-lg flex justify-between items-end">
                <div>
                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">Total Combined Balance</p>
                    <h1 className="text-5xl font-black tracking-tight">
                        {formatCurrency(totalBalance)}
                    </h1>
                    <div className="mt-6 flex items-center space-x-4">
                        <div className="bg-white/10 px-3 py-1 rounded text-xs font-semibold">
                            {accounts.length} ACTIVE ACCOUNTS
                        </div>
                        <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded text-xs font-semibold">
                            KYC VERIFIED
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
            </section>

            {/* Accounts Overview Grid */}
            <section className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <span className="w-1.5 h-6 bg-[#0B3D91] rounded-full mr-3"></span>
                    My Accounts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600 uppercase">
                                    {acc.account_type}
                                </span>
                                <div className="text-[#0B3D91]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
                                </div>
                            </div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Account Number</p>
                            <p className="font-mono text-sm text-gray-800 mb-4">{acc.account_number}</p>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Available Balance</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(acc.balance)}</p>
                        </div>
                    ))}
                    {accounts.length === 0 && (
                        <div className="col-span-full py-12 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                            <p>No accounts linked to this profile.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Activity Table */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <button className="text-[#0B3D91] text-sm font-bold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                <th className="px-6 py-4">Transaction Details</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {transactions.length > 0 ? (
                                transactions.slice(0, 10).map((t) => {
                                    const isDebit = t.type === 'withdraw' || t.type === 'transfer';
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDebit ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                        {isDebit ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{t.description || t.type.charAt(0).toUpperCase() + t.type.slice(1)}</p>
                                                        <p className="text-[10px] font-medium text-gray-400">Ref: {t.reference_id?.slice(0, 8).toUpperCase() || t.id.slice(0, 8).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold text-sm ${isDebit ? 'text-[#991b1b]' : 'text-green-700'}`}>
                                                {isDebit ? '-' : '+'} {formatCurrency(Math.abs(t.amount))}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-800 border border-green-200">
                                                    SUCCESS
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-medium text-gray-500">
                                                {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400 italic">
                                        No recent transactions recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <DepositModal
                accounts={accounts}
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                onSuccess={handleDepositSuccess}
            />
        </div>
    );
}
