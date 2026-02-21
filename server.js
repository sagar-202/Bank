require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const pool = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Helpers ─────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many login attempts, please try again after a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ error: errors.array()[0].msg });
  };
};

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const amountValidation = [
  body("amount")
    .isNumeric().withMessage("Amount must be a number")
    .custom((val) => Number(val) > 0).withMessage("Amount must be positive"),
];

const transferValidation = [
  body("toEmail").isEmail().withMessage("Invalid recipient email").normalizeEmail(),
  ...amountValidation,
];

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (origin.startsWith("http://localhost") || origin.includes("vercel.app")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─── Register ─────────────────────────────────────────────────────────────────
app.post("/api/register", validate(registerValidation), async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO bank_user (name, email, password_hash, balance) VALUES ($1, $2, $3, 0.00)",
      [name, email, password_hash]
    );
    res.status(201).json({ message: "User created" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
app.post("/api/login", loginLimiter, validate(loginValidation), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM bank_user WHERE email = $1", [email]);
    const user = result.rows[0];

    // Cleanup expired tokens
    await pool.query("DELETE FROM bank_user_jwt WHERE expires_at < NOW()");

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "default_dev_secret", { expiresIn: "15m" });

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
    next(err);
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
app.post("/api/logout", async (req, res, next) => {
  const token = req.cookies.access_token;

  // Always clear cookie
  res.clearCookie("access_token", { httpOnly: true, sameSite: "Strict" });

  if (!token) return res.json({ message: "Logged out successfully" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_dev_secret");

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
app.get("/api/check-balance", authMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT balance FROM bank_user WHERE id = $1", [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    next(err);
  }
});

// ─── Add Balance ──────────────────────────────────────────────────────────────
app.post("/api/add-balance", authMiddleware, validate(amountValidation), async (req, res, next) => {
  const { amount } = req.body;

  try {
    const result = await pool.query(
      "UPDATE bank_user SET balance = balance + $1 WHERE id = $2 RETURNING balance",
      [amount, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Balance updated successfully", balance: result.rows[0].balance });
  } catch (err) {
    next(err);
  }
});

// ─── Withdraw Balance ──────────────────────────────────────────────────────────
app.post("/api/withdraw", authMiddleware, validate(amountValidation), async (req, res, next) => {
  const { amount } = req.body;
  const userId = req.user.userId;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch user balance with lock
    const userRes = await client.query("SELECT balance FROM bank_user WHERE id = $1 FOR UPDATE", [userId]);
    if (userRes.rows.length === 0) {
      throw new Error("User not found");
    }

    const currentBalance = parseFloat(userRes.rows[0].balance);
    if (currentBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Deduct balance
    const updateRes = await client.query(
      "UPDATE bank_user SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, userId]
    );

    // Insert transaction record
    await client.query(
      "INSERT INTO transactions (user_id, type, amount) VALUES ($1, 'withdraw', $2)",
      [userId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: "Withdrawal successful", balance: updateRes.rows[0].balance });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }
    next(err);
  } finally {
    client.release();
  }
});

// ─── Transfer Funds ───────────────────────────────────────────────────────────
app.post("/api/transfer", authMiddleware, validate(transferValidation), async (req, res, next) => {
  const { toEmail, amount } = req.body;
  const senderId = req.user.userId;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Fetch and lock sender
    const senderRes = await client.query("SELECT balance, email FROM bank_user WHERE id = $1 FOR UPDATE", [senderId]);
    if (senderRes.rows.length === 0) throw new Error("Sender not found");

    if (senderRes.rows[0].email === toEmail) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot transfer to yourself" });
    }

    // 2. Fetch and lock recipient
    const recipientRes = await client.query("SELECT id FROM bank_user WHERE email = $1 FOR UPDATE", [toEmail]);
    if (recipientRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Recipient not found" });
    }
    const recipientId = recipientRes.rows[0].id;

    // 3. Check balance
    const senderBalance = parseFloat(senderRes.rows[0].balance);
    if (senderBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // 4. Update balances
    const updateSenderRes = await client.query(
      "UPDATE bank_user SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, senderId]
    );
    await client.query("UPDATE bank_user SET balance = balance + $1 WHERE id = $2", [amount, recipientId]);

    // 5. Insert transaction records
    // Sender record
    await client.query(
      "INSERT INTO transactions (user_id, type, amount, related_user_id) VALUES ($1, 'transfer', $2, $3)",
      [senderId, amount, recipientId]
    );
    // Recipient record (records as deposit from sender)
    await client.query(
      "INSERT INTO transactions (user_id, type, amount, related_user_id) VALUES ($1, 'deposit', $2, $3)",
      [recipientId, amount, senderId]
    );

    await client.query("COMMIT");
    res.json({ message: "Transfer successful", balance: updateSenderRes.rows[0].balance });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// ─── Transaction History ──────────────────────────────────────────────────────
app.get("/api/transactions", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, type, amount, related_user_id, created_at 
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
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
}

module.exports = app;
