import { useState } from "react";
import { createAccount } from "../api/api";

export default function OpenAccountModal({ isOpen, onClose, onSuccess }) {
    const [accountType, setAccountType] = useState("savings");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await createAccount(accountType);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 tracking-tight">Open New Account</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAccountType("savings")}
                                className={`p-4 border rounded-xl flex flex-col items-center justify-center transition-all ${accountType === 'savings'
                                        ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]'
                                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
                                <span className="text-sm font-bold uppercase tracking-tight">Savings</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType("checking")}
                                className={`p-4 border rounded-xl flex flex-col items-center justify-center transition-all ${accountType === 'checking'
                                        ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]'
                                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                <span className="text-sm font-bold uppercase tracking-tight">Checking</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-medium">
                            By opening an account, you agree to VibeBank corporate terms and conditions. The account will be active immediately.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0B3D91] text-white font-bold py-4 rounded-xl hover:bg-[#0a3582] transition-colors disabled:opacity-50 shadow-md shadow-blue-900/10"
                    >
                        {loading ? "PROCESSING..." : "CONFIRM & OPEN ACCOUNT"}
                    </button>
                </form>
            </div>
        </div>
    );
}
