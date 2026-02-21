require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('Starting schema update...');
        await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending'");
        await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
        await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'");
        await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS daily_limit NUMERIC(15,2) DEFAULT 10000.00");
        await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0");
        await pool.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id)");
        console.log('✅ Schema update successful');

        const res = await pool.query("SELECT asterisk FROM bank_user LIMIT 1"); // Error: asterisk doesn't exist, using *
        const check = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bank_user' AND column_name = 'status'");
        if (check.rows.length > 0) {
            console.log('✅ Verification: "status" column exists.');
        } else {
            console.log('❌ Verification: "status" column MISSING.');
        }
    } catch (err) {
        console.error('❌ Schema update failed:', err.message);
    } finally {
        await pool.end();
    }
}

run();
