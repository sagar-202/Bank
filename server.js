require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─── Register ─────────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO bank_user (name, email, password_hash, balance) VALUES ($1, $2, $3, 0.00)",
      [name, email, password_hash]
    );
    res.status(201).json({ message: "User created" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM bank_user WHERE email = $1", [email]);
    const user = result.rows[0];

    // Cleanup expired tokens
    await pool.query("DELETE FROM bank_user_jwt WHERE expires_at < NOW()");

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Store hashed token in DB
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    await pool.query(
      "INSERT INTO bank_user_jwt (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt]
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
app.post("/api/logout", async (req, res) => {
  const token = req.cookies.access_token;

  // Always clear cookie
  res.clearCookie("access_token", { httpOnly: true, sameSite: "Strict" });

  if (!token) return res.json({ message: "Logged out successfully" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find matching token in DB
    const result = await pool.query("SELECT id, token_hash FROM bank_user_jwt WHERE user_id = $1", [decoded.userId]);

    for (const row of result.rows) {
      const isMatch = await bcrypt.compare(token, row.token_hash);
      if (isMatch) {
        await pool.query("DELETE FROM bank_user_jwt WHERE id = $1", [row.id]);
        break;
      }
    }
  } catch (err) {
    // Ignore verification errors on logout
  }

  res.json({ message: "Logged out successfully" });
});

// ─── Check Balance ────────────────────────────────────────────────────────────
app.get("/api/check-balance", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT balance FROM bank_user WHERE id = $1", [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Add Balance ──────────────────────────────────────────────────────────────
app.post("/api/add-balance", authMiddleware, async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const result = await pool.query(
      "UPDATE bank_user SET balance = balance + $1 WHERE id = $2 RETURNING balance",
      [amount, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Balance updated successfully", balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_user_jwt (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES bank_user(id) ON DELETE CASCADE,
        token_hash    TEXT NOT NULL,
        expires_at    TIMESTAMP NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tables ready");
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:${PORT}`);
});
