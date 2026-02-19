import { useNavigate } from "react-router-dom";
import { logout } from "../api/api";

export default function Home() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await logout(); } catch { }
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12 flex flex-col items-center font-sans text-gray-900">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">KodBank</h1>
                        <p className="text-sm text-gray-500 font-medium">Dashboard</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Actions */}
                <div className="grid gap-4">
                    <button
                        onClick={() => navigate("/check-balance")}
                        className="w-full bg-black text-white font-semibold py-4 rounded-xl hover:bg-gray-900 active:scale-[0.98] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Check Balance
                    </button>

                    <button
                        onClick={() => navigate("/transfer")}
                        className="w-full bg-white text-black border-2 border-gray-100 font-semibold py-4 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Transfer Money
                    </button>
                </div>

            </div>

            <p className="mt-8 text-xs text-center text-gray-400">
                Secure 256-bit Encrypted Connection
            </p>
        </div>
    );
}
