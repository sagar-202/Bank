import { useNavigate } from "react-router-dom";
import { logout } from "../api/api";

export default function Header({ userName }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 fixed top-0 right-0 left-[220px] z-10">
            <div className="flex items-center">
                <h1 className="text-xl font-bold text-[#0B3D91] tracking-tight">VibeBank</h1>
            </div>

            <div className="flex items-center space-x-6">
                <div className="text-sm font-medium text-gray-700">
                    <span className="text-gray-400 mr-2">Welcome,</span>
                    {userName || "User"}
                </div>

                <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 text-sm font-semibold text-[#0B3D91] border border-[#0B3D91] rounded hover:bg-[#0B3D91] hover:text-white transition-colors duration-200"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
