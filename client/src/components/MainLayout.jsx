import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { fetchProfile } from "../api/api";

export default function MainLayout({ children }) {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const getProfile = async () => {
            try {
                const data = await fetchProfile();
                setProfile(data);
            } catch (err) {
                console.error("Failed to fetch profile for layout:", err);
            }
        };
        getProfile();
    }, []);

    return (
        <div className="flex bg-white min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header userName={profile?.name} />
                <main className="mt-16 ml-[220px] p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
