const pool = require("./db");

const initDb = async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_user (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100),
      email         VARCHAR(150) UNIQUE,
      password_hash TEXT,
      balance       NUMERIC(15,2),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    console.log("Tables initialized");
};

module.exports = initDb;
