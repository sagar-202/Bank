import { useState, useEffect } from "react";
import {
    fetchAccounts,
    fetchBeneficiaries,
    addBeneficiary,
    internalTransfer,
    externalTransfer
} from "../api/api";

export default function Transfer() {
    const [activeTab, setActiveTab] = useState("internal"); // internal, add_beneficiary, external
    const [step, setStep] = useState(1); // 1: Input, 2: Confirmation, 3: Success

    // Form States
    const [accounts, setAccounts] = useState([]);
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Transaction Data
    const [formData, setFormData] = useState({
        fromAccountId: "",
        toAccountId: "",
        beneficiaryId: "",
        amount: "",
        beneficiaryAccountNumber: "",
        nickname: "",
        otp: "123456" // Simulation
    });

    const fetchData = async () => {
        try {
            const [accData, beneData] = await Promise.all([
                fetchAccounts(),
                fetchBeneficiaries()
            ]);
            setAccounts(accData || []);
            setBeneficiaries(beneData || []);

            // Set default source account
            if (accData && accData.length > 0) {
                setFormData(prev => ({ ...prev, fromAccountId: accData[0].id }));
            }
        } catch (err) {
            setError("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setStep(1);
        setError("");
    };

    const handleNext = (e) => {
        e.preventDefault();
        setError("");

        if (activeTab === "internal") {
            if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
                return setError("All fields are required");
            }
            if (formData.fromAccountId === formData.toAccountId) {
                return setError("Source and destination accounts must be different");
            }
        } else if (activeTab === "external") {
            if (!formData.fromAccountId || !formData.beneficiaryId || !formData.amount) {
                return setError("All fields are required");
            }
        } else if (activeTab === "add_beneficiary") {
            if (!formData.beneficiaryAccountNumber || !formData.nickname) {
                return setError("All fields are required");
            }
        }

        if (activeTab === "add_beneficiary") {
            handleSubmit();
        } else {
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            if (activeTab === "internal") {
                await internalTransfer(formData.fromAccountId, formData.toAccountId, Number(formData.amount));
            } else if (activeTab === "external") {
                await externalTransfer(formData.fromAccountId, formData.beneficiaryId, Number(formData.amount), formData.otp);
            } else if (activeTab === "add_beneficiary") {
                await addBeneficiary(formData.beneficiaryAccountNumber, formData.nickname);
            }
            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(value);
    };

    const getAccountName = (id) => {
        const acc = accounts.find(a => a.id === id);
        return acc ? `${acc.account_type.toUpperCase()} (${acc.account_number})` : "";
    };

    const getBeneficiaryName = (id) => {
        const bene = beneficiaries.find(b => b.id === id);
        return bene ? `${bene.nickname} (${bene.beneficiary_account_number})` : "";
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Move Money</h1>
                <p className="text-gray-500 font-medium">Internal & External Corporate Transfers</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-10 w-fit">
                {[
                    { id: 'internal', label: 'Own Accounts' },
                    { id: 'external', label: 'External Transfer' },
                    { id: 'add_beneficiary', label: 'Add Beneficiary' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white text-[#0B3D91] shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {step === 1 && (
                    <form onSubmit={handleNext} className="p-10 space-y-8">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold italic">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {activeTab !== 'add_beneficiary' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source Account</label>
                                    <select
                                        value={formData.fromAccountId}
                                        onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                                        className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_type.toUpperCase()} — {acc.account_number} ({formatCurrency(acc.balance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'internal' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination Account</label>
                                    <select
                                        value={formData.toAccountId}
                                        onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                                        className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                    >
                                        <option value="">Select Destination</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_type.toUpperCase()} — {acc.account_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'external' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient / Beneficiary</label>
                                    <select
                                        value={formData.beneficiaryId}
                                        onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                                        className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                    >
                                        <option value="">Select Beneficiary</option>
                                        {beneficiaries.map(bene => (
                                            <option key={bene.id} value={bene.id}>
                                                {bene.nickname} — {bene.beneficiary_account_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'add_beneficiary' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Beneficiary Name / Nickname</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Suppliers Ltd"
                                            value={formData.nickname}
                                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="10-digit number"
                                            value={formData.beneficiaryAccountNumber}
                                            onChange={(e) => setFormData({ ...formData, beneficiaryAccountNumber: e.target.value })}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {activeTab !== 'add_beneficiary' && (
                            <div className="space-y-3 max-w-md">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transfer Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full border-gray-200 rounded-xl bg-gray-50 pl-10 p-4 text-2xl font-black text-gray-800 focus:ring-0 focus:border-[#0B3D91] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="bg-[#0B3D91] text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#0a3582] transition-colors"
                            >
                                CONTINUE TO REVIEW
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0B3D91] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">Verification</span>
                            <h2 className="text-2xl font-black text-gray-800 mt-6 tracking-tight">Please confirm the transaction details</h2>
                            <p className="text-gray-400 text-sm mt-1">Review your transfer information before final submission.</p>
                        </div>

                        <div className="max-w-md mx-auto bg-gray-50/50 rounded-2xl border border-gray-100 p-8 space-y-6">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100/50">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</span>
                                <span className="text-xs font-black text-[#0B3D91] uppercase">{activeTab.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100/50">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
                                <span className="text-xs font-black text-gray-800">{getAccountName(formData.fromAccountId)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100/50">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                                <span className="text-xs font-black text-gray-800">
                                    {activeTab === 'internal' ? getAccountName(formData.toAccountId) : getBeneficiaryName(formData.beneficiaryId)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-4 bg-[#0B3D91] text-white px-6 rounded-xl shadow-lg shadow-blue-900/10">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Final Amount</span>
                                <span className="text-xl font-black">{formatCurrency(formData.amount)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold italic">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col space-y-4 max-w-sm mx-auto pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-[#0B3D91] text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#0a3582] transition-colors disabled:opacity-50"
                            >
                                {submitting ? "PROCESSING..." : "CONFIRM & SUBMIT"}
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                disabled={submitting}
                                className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors"
                            >
                                Cancel & EDIT details
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-20 text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-2 border-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Transfer Successful</h2>
                            <p className="text-gray-400 font-medium mt-2">Your transaction has been processed and logged in the corporate audit.</p>
                        </div>

                        <div className="pt-8">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gray-900 text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Perform another transfer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Security Tip */}
            <div className="mt-10 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start space-x-4">
                <div className="p-2 bg-white rounded-lg border border-blue-100 text-[#0B3D91]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                </div>
                <div>
                    <h4 className="text-xs font-black text-[#0B3D91] uppercase tracking-widest mb-1">Corporate Security Notice</h4>
                    <p className="text-[11px] text-[#0B3D91]/70 font-medium leading-relaxed">
                        Always verify the account details and recipient information before confirming. All corporate transfers are real-time and subject to the daily limit of ₹50,000.00. Use of OTP simulation is active for testing.
                    </p>
                </div>
            </div>
        </div>
    );
}
