const pool = require("./config/db");

async function verify() {
    try {
        console.log("Checking bank_user_jwt table...");
        const res = await pool.query(`
      SELECT u.email, j.token_hash, j.expires_at, j.created_at 
      FROM bank_user_jwt j
      JOIN bank_user u ON j.user_id = u.id
      WHERE u.email = 'verify@test.com'
      ORDER BY j.created_at DESC
      LIMIT 1
    `);

        if (res.rows.length > 0) {
            console.log("✅ Token found in DB:");
            console.log(res.rows[0]);
        } else {
            console.log("❌ No token found for verify@test.com");
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

verify();
