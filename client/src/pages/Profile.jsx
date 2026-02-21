import React, { useState, useEffect } from 'react';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setFormData({ name: data.name, phone: data.phone || '' });
            } else {
                setError(data.error || 'Failed to fetch profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data.profile);
                setSuccess('Profile updated successfully!');
            } else {
                setError(data.error || 'Update failed');
            }
        } catch (err) {
            setError('Update failed. Please try again.');
        }
    };

    if (loading) return <div className="p-6">Loading profile...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 font-display">User Profile</h1>
                <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${profile?.kyc_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${profile?.kyc_status === 'verified' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    KYC: {profile?.kyc_status?.toUpperCase() || 'PENDING'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Security Summary */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4">
                                {profile?.name?.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
                            <p className="text-slate-500 text-sm mb-4">{profile?.email}</p>
                            <div className="w-full h-px bg-slate-100 my-4"></div>
                            <div className="w-full text-left space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Security Level</span>
                                    <span className="font-semibold text-green-600">High</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">2FA Status</span>
                                    <span className="font-semibold text-slate-700">Enabled</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Profile Information Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
                            <p className="text-slate-500 text-sm">Update your personal details and contact information.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-6">
                            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
                            {success && <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">{success}</div>}

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="+1 (555) 000-0000"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile?.email}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Email address cannot be changed for security reasons.</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
