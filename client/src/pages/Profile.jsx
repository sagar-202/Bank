import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile } from "../api/api";

export default function Profile() {
    const queryClient = useQueryClient();
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formData, setFormData] = useState({ name: "", phone: "" });

    const { data: profile, isLoading: loading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const data = await fetchProfile();
            // Seed form on first load
            setFormData(prev => prev.name ? prev : { name: data.name, phone: data.phone || "" });
            return data;
        },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError("");
        setSuccess("");

        try {
            const data = await updateProfile(formData.name, formData.phone);
            queryClient.setQueryData(["profile"], data.profile);
            setSuccess("Profile updated successfully");
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            setError(err.message || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isVerified = profile?.kyc_status === 'verified';

    return (
        <div className="max-w-4xl mx-auto pb-20 mt-10 px-4">
            <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Financial Profile</h1>
                    <p className="text-gray-500 font-medium">Manage your personal and contact identifiers</p>
                </div>

                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border shadow-sm w-fit ${isVerified ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        KYC: {profile?.kyc_status?.toUpperCase() || 'PENDING'}
                    </span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6 md:p-10 transition-all hover:border-gray-300">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Feedback Messages */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold italic animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-bold italic animate-in fade-in slide-in-from-top-2">
                            {success}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Name Field */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Legal Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your full name"
                                className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>

                        {/* Email Field (Readonly) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Corporate Email (Readonly)</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    readOnly
                                    className="w-full border-gray-100 rounded-xl bg-gray-50/50 p-4 text-sm font-bold text-gray-400 cursor-not-allowed border-dashed outline-none"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 XXXXXXXXXX"
                                className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] focus:bg-white transition-all outline-none"
                            />
                        </div>

                        {/* Security Info Card */}
                        <div className="flex items-start space-x-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-50">
                            <div className="mt-0.5 p-2 bg-white rounded-lg border border-blue-100 text-[#0B3D91] shadow-sm flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </div>
                            <p className="text-[11px] text-[#0B3D91]/80 font-medium leading-relaxed">
                                <strong>Data Sensitivity:</strong> Your corporate identifiers are immutable for audit compliance. Please contact support to initiate a formal verification for any changes to your primary email.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                        <button
                            type="submit"
                            disabled={updating}
                            className="bg-[#0B3D91] text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/10 hover:bg-[#0a3582] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {updating ? "UPDATING PORTFOLIO..." : "UPDATE PROFILE"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Access Audit */}
            <div className="mt-16 text-center">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                    Digital Footprint Activity Audit
                </p>
                <p className="text-[10px] text-gray-300 font-bold mt-1">
                    Last Modified: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}
