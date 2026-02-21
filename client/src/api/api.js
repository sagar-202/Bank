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

export const withdraw = async (amount) => {
    const res = await fetch(`${BASE_URL}/api/withdraw`, options("POST", { amount }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to withdraw");
    return data;
};

export const fetchTransactions = async (startDate, endDate) => {
    let url = `${BASE_URL}/api/transactions`;
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const res = await fetch(url, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch transactions");
    return data;
};

export const transfer = async (toEmail, amount) => {
    const res = await fetch(`${BASE_URL}/api/transfer`, options("POST", { toEmail, amount }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to transfer");
    return data;
};

export const fetchAccounts = async () => {
    const res = await fetch(`${BASE_URL}/api/accounts`, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch accounts");
    return data;
};

export const createAccount = async (account_type) => {
    const res = await fetch(`${BASE_URL}/api/accounts`, options("POST", { account_type }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to create account");
    return data;
};

export const internalTransfer = async (fromAccountId, toAccountId, amount) => {
    const res = await fetch(`${BASE_URL}/api/transfer/internal`, options("POST", { fromAccountId, toAccountId, amount }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to perform internal transfer");
    return data;
};

export const fetchBeneficiaries = async () => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch beneficiaries");
    return data;
};

export const addBeneficiary = async (beneficiary_account_number, nickname) => {
    const res = await fetch(`${BASE_URL}/api/beneficiaries`, options("POST", { beneficiary_account_number, nickname }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to add beneficiary");
    return data;
};

export const externalTransfer = async (fromAccountId, beneficiaryId, amount, otp) => {
    const res = await fetch(`${BASE_URL}/api/transfer/external`, options("POST", { fromAccountId, beneficiaryId, amount, otp }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to perform external transfer");
    return data;
};

export const fetchProfile = async () => {
    const res = await fetch(`${BASE_URL}/api/profile`, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
    return data;
};

export const updateProfile = async (name, phone) => {
    const res = await fetch(`${BASE_URL}/api/profile`, options("PUT", { name, phone }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to update profile");
    return data;
};

export const fetchAccountTransactions = async (accountId) => {
    const res = await fetch(`${BASE_URL}/api/accounts/${accountId}/transactions`, options("GET"));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to fetch account transactions");
    return data;
};
export const changePassword = async (oldPassword, newPassword) => {
    const res = await fetch(`${BASE_URL}/api/change-password`, options("POST", { oldPassword, newPassword }));
    const data = await res.json();
    if (handle401(res.status)) return;
    if (!res.ok) throw new Error(data.error || "Failed to change password");
    return data;
};
