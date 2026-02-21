import Sidebar from "./Sidebar";
import Header from "./Header";
import { fetchProfile } from "../api/api";
import { useQuery } from "@tanstack/react-query";

export default function MainLayout({ children }) {
    const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: fetchProfile,
    });

    return (
        <div className="flex bg-white min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                {profile?.status === 'frozen' && (
                    <div className="bg-red-600 text-white text-center py-2 text-xs font-black uppercase tracking-widest fixed top-0 w-full z-[100] animate-pulse">
                        ⚠️ ACCOUNT FROZEN: Please contact your corporate administrator immediately.
                    </div>
                )}
                <Header userName={profile?.name} />
                <main className={`ml-[220px] p-8 flex-1 ${profile?.status === 'frozen' ? 'mt-24' : 'mt-16'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
