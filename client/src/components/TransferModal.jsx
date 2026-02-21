import { useState } from "react";
import { transfer } from "../api/api";

export default function TransferModal({ isOpen, onClose, onSuccess }) {
    const [toEmail, setToEmail] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const numAmount = Number(amount);
        if (!toEmail) {
            setError("Please enter recipient email");
            setLoading(false);
            return;
        }
        if (!amount || numAmount <= 0) {
            setError("Please enter a valid amount");
            setLoading(false);
            return;
        }

        try {
            await transfer(toEmail, numAmount);
            onSuccess();
            setAmount("");
            setToEmail("");
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Transfer Funds</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Recipient Email</label>
                        <input
                            type="email"
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-black outline-none focus:ring-2 focus:ring-black transition-all"
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Amount (INR)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-black text-2xl font-bold outline-none focus:ring-2 focus:ring-black transition-all"
                            placeholder="0.00"
                            min="1"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : "Transfer Now"}
                    </button>

                    {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
                </form>
            </div>
        </div>
    );
}
