import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkBalance, logout } from "../api/api";

function Dashboard() {
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCheckBalance = async () => {
        setError("");
        setLoading(true);
        try {
            const data = await checkBalance();
            if (data) setBalance(data.balance);
        } catch (err) {
            setError(err.message || "Failed to fetch balance.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // Logout best-effort — redirect regardless
        } finally {
            navigate("/");
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>

            {balance !== null && (
                <p>Balance: ₹{parseFloat(balance).toFixed(2)}</p>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}

            <button onClick={handleCheckBalance} disabled={loading}>
                {loading ? "Loading..." : "Check Balance"}
            </button>

            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;
