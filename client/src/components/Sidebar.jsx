import { Link, useLocation } from "react-router-dom";

const navItems = [
    {
        name: "Dashboard",
        path: "/dashboard",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
        )
    },
    {
        name: "Accounts",
        path: "/accounts",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
        )
    },
    {
        name: "Transfers",
        path: "/transfers",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4" /><path d="M20 7H9a4 4 0 0 0 0 8h3" /><path d="m8 21-4-4 4-4" /><path d="M4 17h11a4 4 0 0 0 0-8h-3" /></svg>
        )
    },
    {
        name: "Statements",
        path: "/statements",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
        )
    },
    {
        name: "Profile",
        path: "/profile",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        )
    },
    {
        name: "Security",
        path: "/security",
        svg: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
        )
    },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="w-[220px] h-screen bg-[#0B3D91] text-white fixed left-0 top-0 overflow-y-auto z-20">
            <div className="p-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
                    Corporate Banking
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded text-sm transition-colors duration-200 ${isActive
                                        ? "bg-[#154ba3] text-white font-semibold"
                                        : "text-blue-100 hover:bg-[#0a3582] hover:text-white"
                                    }`}
                            >
                                <span className={isActive ? "stroke-[2.5px]" : "stroke-[2px]"}>
                                    {item.svg}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
