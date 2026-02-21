import { useState } from "react";
import { depositFunds } from "../api/api";

export default function DepositModal({ accounts, isOpen, onClose, onSuccess }) {
    const [accountId, setAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountId || !amount) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await depositFunds(accountId, Number(amount));
            onSuccess();
            onClose();
            setAccountId("");
            setAmount("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-[#0B3D91] p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Deposit Funds</h2>
                        <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mt-1">Direct Credit Operation</p>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Select Target Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all outline-none appearance-none"
                                required
                            >
                                <option value="" disabled>Choose account...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_type.toUpperCase()} - {acc.account_number} (Bal: ₹{acc.balance})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Deposit Amount (INR)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="1"
                                step="0.01"
                                className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-bold italic">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0B3D91] text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#082d6b] transition-all disabled:opacity-50"
                        >
                            {loading ? "PROCESSING..." : "PROCESS DEPOSIT"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
