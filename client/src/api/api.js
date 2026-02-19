const BASE_URL = "http://localhost:5000";

const defaultOptions = {
    credentials: "include",
    headers: {
        "Content-Type": "application/json",
    },
};

const handle401 = (status) => {
    if (status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/";
        return true;
    }
    return false;
};

// POST /api/login
export const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/login`, {
        ...defaultOptions,
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    if (handle401(res.status)) return;

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

    return data;
};

// GET /api/check-balance
export const checkBalance = async () => {
    const res = await fetch(`${BASE_URL}/api/check-balance`, {
        ...defaultOptions,
        method: "GET",
    });

    if (handle401(res.status)) return;

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch balance");

    return data;
};

// POST /api/logout
export const logout = async () => {
    const res = await fetch(`${BASE_URL}/api/logout`, {
        ...defaultOptions,
        method: "POST",
    });

    if (handle401(res.status)) return;

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Logout failed");

    return data;
};
