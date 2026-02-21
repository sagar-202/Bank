import { useState, useEffect } from "react";
import { fetchProfile, changePassword } from "../api/api";

export default function Security() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await fetchProfile();
                setProfile(data);
            } catch (err) {
                setError("Failed to load security metrics");
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setUpdating(true);
        setError("");
        setSuccess("");

        try {
            await changePassword(formData.oldPassword, formData.newPassword);
            setSuccess("Password updated successfully");
            setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setSuccess(""), 5000);
        } catch (err) {
            setError(err.message || "Failed to update password");
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

    const isFrozen = profile?.status === 'frozen';

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4">
            <div className="mb-10">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Security & Governance</h1>
                <p className="text-gray-500 font-medium">Protect your corporate assets and manage access</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Security Metrics */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Account Integrity</h3>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Account Status</label>
                                <div className={`flex items-center space-x-2 px-4 py-3 rounded-xl border ${isFrozen ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${isFrozen ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        {profile?.status?.toUpperCase() || 'ACTIVE'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Daily Transfer Limit</label>
                                <p className="text-2xl font-black text-gray-800 tracking-tighter">
                                    ₹{new Intl.NumberFormat('en-IN').format(profile?.daily_limit || 10000)}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 italic">Corporate Default</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Failed Login Attempts</label>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-2xl font-black tracking-tighter ${profile?.failed_login_attempts > 0 ? 'text-red-600' : 'text-gray-800'
                                        }`}>
                                        {profile?.failed_login_attempts || 0}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase italic mt-1.5">(Last 24h)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0B3D91] border border-blue-800 rounded-2xl p-8 text-white shadow-lg shadow-blue-900/10">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-blue-800 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Compliance Shield</h4>
                        </div>
                        <p className="text-[11px] leading-relaxed font-medium text-blue-100 italic">
                            Your account is protected by mandatory corporate encryption and identity verification headers.
                        </p>
                    </div>
                </div>

                {/* Password Management */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
                        <div className="mb-10">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">Security Credentials</h3>
                            <p className="text-sm text-gray-500 font-medium">Rotate your access credentials regularly for enhanced security.</p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-8">
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

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Corporate Password</label>
                                    <input
                                        type="password"
                                        value={formData.oldPassword}
                                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                                        className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">New Password</label>
                                        <input
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800 focus:ring-1 focus:ring-[#0B3D91] transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-gray-900 text-white px-10 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {updating ? "SECURELY UPDATING..." : "UPDATE CREDENTIALS"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
