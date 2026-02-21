require("dotenv").config();
const pool = require("./config/db");

async function setup() {
    try {
        console.log("Enabling uuid-ossp extension...");
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        console.log("✅ Extension enabled.");

        console.log("Creating transactions table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id INTEGER NOT NULL REFERENCES bank_user(id),
                type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
                amount NUMERIC(15,2) NOT NULL,
                related_user_id INTEGER REFERENCES bank_user(id),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("✅ Transactions table ready.");
    } catch (err) {
        console.error("❌ Setup error:", err.message);
    } finally {
        await pool.end();
    }
}

setup();
