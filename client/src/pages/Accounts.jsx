import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAccounts } from "../api/api";
import OpenAccountModal from "../components/OpenAccountModal";
import AccountDetailsView from "../components/AccountDetailsView";
import AccountsSkeleton from "../components/skeletons/AccountsSkeleton";

export default function Accounts() {
    const queryClient = useQueryClient();
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isOpenAccountModalOpen, setIsOpenAccountModalOpen] = useState(false);

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ["accounts"],
        queryFn: fetchAccounts,
    });

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    if (isLoading) {
        return <AccountsSkeleton />;
    }

    if (selectedAccount) {
        return (
            <AccountDetailsView
                account={selectedAccount}
                onBack={() => {
                    setSelectedAccount(null);
                    queryClient.invalidateQueries({ queryKey: ["accounts"] });
                }}
            />
        );
    }

    return (
        <div className="space-y-10 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Accounts</h2>
                    <p className="text-gray-500 text-sm">Manage and view your corporate portfolios.</p>
                </div>
                <button
                    onClick={() => setIsOpenAccountModalOpen(true)}
                    className="bg-[#0B3D91] text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center shadow-lg shadow-blue-900/10 hover:bg-[#0a3582] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    OPEN NEW ACCOUNT
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => (
                    <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className="bg-white border border-gray-200 rounded-xl p-8 hover:border-[#0B3D91] hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 text-left group"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-[#0B3D91]"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 rounded text-gray-500 group-hover:bg-[#0B3D91] group-hover:text-white transition-colors">
                                {acc.account_type}
                            </span>
                        </div>

                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                        <p className="font-mono text-gray-800 mb-6 font-bold tracking-tight">{acc.account_number}</p>

                        <div className="mt-auto">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Balance</p>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(acc.balance)}</p>
                        </div>

                        <div className="mt-6 flex items-center text-[10px] font-black text-[#0B3D91] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                    </button>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                        <p className="font-bold uppercase tracking-widest text-sm">No accounts found</p>
                        <p className="mt-2 text-xs">Open your first account to get started.</p>
                    </div>
                )}
            </div>

            <OpenAccountModal
                isOpen={isOpenAccountModalOpen}
                onClose={() => setIsOpenAccountModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
            />
        </div>
    );
}
