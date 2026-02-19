const BASE_URL = import.meta.env.PROD ? "" : "http://localhost:5000";

const options = (method, body) => ({
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
});

const handle401 = (status) => {
    if (status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/";
        return true;
    }
    return false;
};

export const register = async (name, email, password) => {
    const res = await fetch(`${BASE_URL}/api/register`, options("POST", { name, email, password }));
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
};

export const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/login`, options("POST", { email, password }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
};

export const logout = async () => {
    const res = await fetch(`${BASE_URL}/api/logout`, options("POST"));
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Logout failed");
    return data;
};

export const checkBalance = async () => {
    const res = await fetch(`${BASE_URL}/api/check-balance`, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch balance");
    return data;
};

export const addBalance = async (amount) => {
    const res = await fetch(`${BASE_URL}/api/add-balance`, options("POST", { amount }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to add balance");
    return data;
};
