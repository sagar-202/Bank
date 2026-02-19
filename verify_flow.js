const pool = require("./config/db");

async function verifyFlow() {
    const email = "verify_flow@test.com";
    const password = "password123";
    const baseUrl = "http://localhost:5000/api";

    console.log("1. REGISTERING User...");
    try {
        await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Flow Tester', email, password })
        });
        console.log("   Registration request sent (might already exist).");
    } catch (e) { console.log("   Registration error (ignoring):", e.message); }

    console.log("\n2. LOGGING IN...");
    let loginRes;
    try {
        loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    } catch (e) {
        console.error("   Login request failed:", e.message);
        return;
    }

    if (!loginRes.ok) {
        console.log("   Login failed!", await loginRes.text());
        return;
    }

    const cookie = loginRes.headers.get('set-cookie');
    if (cookie) {
        console.log("✅ Token generated!");
        console.log("✅ Cookie Received:", cookie.split(';')[0] + "...");
    } else {
        console.log("❌ No cookie received!");
    }

    // Extract token part for manual request
    const tokenPart = cookie ? cookie.split(';')[0] : "";

    console.log("\n3. CHECKING DATABASE...");
    try {
        const dbRes = await pool.query(`
            SELECT u.email, j.token_hash, j.expires_at 
            FROM bank_user_jwt j
            JOIN bank_user u ON j.user_id = u.id
            WHERE u.email = $1
            ORDER BY j.created_at DESC LIMIT 1
        `, [email]);

        if (dbRes.rows.length > 0) {
            const row = dbRes.rows[0];
            console.log("✅ Token found in Table 'bank_user_jwt'");
            console.log("   User:", row.email);
            console.log("   Hash:", row.token_hash.substring(0, 20) + "...");
            console.log("   Expires:", row.expires_at);
        } else {
            console.log("❌ Token NOT found in DB!");
        }
    } catch (e) {
        console.error("   DB Error:", e.message);
    }

    console.log("\n4. ACCESSING PROTECTED ROUTE (Check Balance)...");
    try {
        const balanceRes = await fetch(`${baseUrl}/check-balance`, {
            headers: {
                'Cookie': tokenPart
            }
        });

        if (balanceRes.ok) {
            const data = await balanceRes.json();
            console.log("✅ Request Verified & Balance returned:", data);
        } else {
            console.log("❌ Validation Failed:", balanceRes.status, await balanceRes.text());
        }
    } catch (e) {
        console.error("   Request Error:", e.message);
    }

    pool.end();
}

verifyFlow();
