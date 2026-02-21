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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateAccountNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const checkDailyLimit = async (userId, currentAmount) => {
  const DAILY_LIMIT = 50000;
  const result = await pool.query(
    "SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND type = 'transfer' AND created_at > NOW() - INTERVAL '24 hours'",
    [userId]
  );
  const totalSpent = parseFloat(result.rows[0].total || 0);
  if (totalSpent + currentAmount > DAILY_LIMIT) {
    throw new Error(`Daily transfer limit of ${DAILY_LIMIT} exceeded. Remaining: ${DAILY_LIMIT - totalSpent}`);
  }
};

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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const password_hash = await bcrypt.hash(password, 10);

    // 1. Create User
    const userRes = await client.query(
      "INSERT INTO bank_user (name, email, password_hash, balance) VALUES ($1, $2, $3, 0.00) RETURNING id",
      [name, email, password_hash]
    );
    const userId = userRes.rows[0].id;

    // 2. Create Default Savings Account
    const accountNumber = generateAccountNumber();
    await client.query(
      "INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES ($1, $2, $3, $4)",
      [userId, accountNumber, "savings", 0.00]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "User created and default account assigned",
      accountNumber
    });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  } finally {
    client.release();
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
app.post("/api/login", loginLimiter, validate(loginValidation), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM bank_user WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.is_frozen) {
      return res.status(403).json({ error: "Account is frozen due to too many failed login attempts. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      // Increment failed attempts
      await pool.query("UPDATE bank_user SET failed_attempts = failed_attempts + 1 WHERE id = $1", [user.id]);

      // Check if we should freeze now
      if (user.failed_attempts + 1 >= 5) {
        await pool.query("UPDATE bank_user SET is_frozen = true WHERE id = $1", [user.id]);
        return res.status(403).json({ error: "Multiple failed attempts. Your account has been frozen for security." });
      }

      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Success - reset attempts
    await pool.query("UPDATE bank_user SET failed_attempts = 0 WHERE id = $1", [user.id]);

    // Cleanup expired tokens
    await pool.query("DELETE FROM bank_user_jwt WHERE expires_at < NOW()");

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

// ─── Accounts Management ──────────────────────────────────────────────────────
app.get("/api/accounts", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT id, account_number, account_type, balance, status, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/accounts", authMiddleware, async (req, res, next) => {
  const { account_type } = req.body;
  const userId = req.user.userId;

  if (!["savings", "checking"].includes(account_type)) {
    return res.status(400).json({ error: "Invalid account type. Must be 'savings' or 'checking'" });
  }

  try {
    const accountNumber = generateAccountNumber();
    const result = await pool.query(
      "INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES ($1, $2, $3, 0.00) RETURNING *",
      [userId, accountNumber, account_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── Add Balance ──────────────────────────────────────────────────────────────
app.post("/api/add-balance", authMiddleware, validate(amountValidation), async (req, res, next) => {
  const { amount, accountId } = req.body;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Determine account (provided or default)
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const accRes = await client.query("SELECT id FROM accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [userId]);
      if (accRes.rows.length === 0) throw new Error("No accounts found for user");
      targetAccountId = accRes.rows[0].id;
    }

    // 2. Update user balance (legacy)
    await client.query("UPDATE bank_user SET balance = balance + $1 WHERE id = $2", [amount, userId]);

    // 3. Update account balance
    const result = await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3 RETURNING balance",
      [amount, targetAccountId, userId]
    );

    if (result.rows.length === 0) throw new Error("Account not found or unauthorized");

    // 4. Record transaction with account_id
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount) VALUES ($1, $2, 'deposit', $3)",
      [userId, targetAccountId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: "Balance updated successfully", balance: result.rows[0].balance });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
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
    // 1. Determine account (provided or default)
    const { accountId } = req.body;
    let targetAccountId = accountId;
    if (!targetAccountId) {
      const accRes = await client.query("SELECT id FROM accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [userId]);
      if (accRes.rows.length === 0) throw new Error("No accounts found for user");
      targetAccountId = accRes.rows[0].id;
    }

    await client.query("UPDATE bank_user SET balance = balance - $1 WHERE id = $2", [amount, userId]);

    const updateRes = await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3 RETURNING balance",
      [amount, targetAccountId, userId]
    );

    // Insert transaction record with account_id
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount) VALUES ($1, $2, 'withdraw', $3)",
      [userId, targetAccountId, amount]
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

    // 2. Check Daily Limit
    await checkDailyLimit(senderId, amount);

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
    // For legacy /api/transfer, we use the default accounts
    const senderAccRes = await client.query("SELECT id FROM accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [senderId]);
    const recipientAccRes = await client.query("SELECT id FROM accounts WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1", [recipientId]);

    if (senderAccRes.rows.length === 0 || recipientAccRes.rows.length === 0) {
      throw new Error("Sender or recipient has no accounts");
    }

    const senderAccountId = senderAccRes.rows[0].id;
    const recipientAccountId = recipientAccRes.rows[0].id;

    const updateSenderRes = await client.query(
      "UPDATE bank_user SET balance = balance - $1 WHERE id = $2 RETURNING balance",
      [amount, senderId]
    );
    await client.query("UPDATE bank_user SET balance = balance + $1 WHERE id = $2", [amount, recipientId]);

    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, senderAccountId]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, recipientAccountId]);

    // 5. Insert transaction records with account_id
    // Sender record
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount, related_user_id) VALUES ($1, $2, 'transfer', $3, $4)",
      [senderId, senderAccountId, amount, recipientId]
    );
    // Recipient record (records as deposit from sender)
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount, related_user_id) VALUES ($1, $2, 'deposit', $3, $4)",
      [recipientId, recipientAccountId, amount, senderId]
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

// ─── Internal Transfer ────────────────────────────────────────────────────────
app.post("/api/transfer/internal", authMiddleware, async (req, res, next) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  const userId = req.user.userId;

  if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid parameters. 'fromAccountId', 'toAccountId', and a positive 'amount' are required." });
  }

  if (fromAccountId === toAccountId) {
    return res.status(400).json({ error: "Source and destination accounts must be different" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Fetch and lock both accounts (order by ID to prevent deadlocks)
    const accountsToLock = [fromAccountId, toAccountId].sort();
    for (const accId of accountsToLock) {
      const lockRes = await client.query("SELECT id FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE", [accId, userId]);
      if (lockRes.rows.length === 0) {
        throw new Error("One or both accounts not found or unauthorized");
      }
    }

    // 2. Check Daily Limit
    await checkDailyLimit(userId, amount);

    // 3. Check balance of source account
    const fromRes = await client.query("SELECT balance FROM accounts WHERE id = $1", [fromAccountId]);
    const fromBalance = parseFloat(fromRes.rows[0].balance);

    if (fromBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds in source account" });
    }

    // 3. Update balances
    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromAccountId]);
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [amount, toAccountId]);

    // 4. Record transaction (audit log) with account_id
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount) VALUES ($1, $2, 'transfer', $3)",
      [userId, fromAccountId, amount]
    );
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount) VALUES ($1, $2, 'deposit', $3)",
      [userId, toAccountId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: "Internal transfer successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message === "One or both accounts not found or unauthorized") {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});

// ─── Beneficiaries ────────────────────────────────────────────────────────────
app.get("/api/beneficiaries", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT id, beneficiary_account_number, nickname, created_at FROM beneficiaries WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/beneficiaries", authMiddleware, async (req, res, next) => {
  const { beneficiary_account_number, nickname } = req.body;
  const userId = req.user.userId;

  if (!beneficiary_account_number || !nickname) {
    return res.status(400).json({ error: "beneficiary_account_number and nickname are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO beneficiaries (user_id, beneficiary_account_number, nickname) VALUES ($1, $2, $3) RETURNING *",
      [userId, beneficiary_account_number, nickname]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── External Transfer ────────────────────────────────────────────────────────
app.post("/api/transfer/external", authMiddleware, async (req, res, next) => {
  const { fromAccountId, beneficiaryId, amount } = req.body;
  const userId = req.user.userId;

  if (!fromAccountId || !beneficiaryId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid parameters. 'fromAccountId', 'beneficiaryId', and a positive 'amount' are required." });
  }

  // OTP Simulation
  const { otp } = req.body;
  if (otp !== "123456") {
    return res.status(403).json({ error: "Invalid OTP. Please enter the code sent to your mobile (Simulation: 123456)." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check Daily Limit
    await checkDailyLimit(userId, amount);

    // 1. Verify beneficiary belongs to user
    const beneficiaryRes = await client.query("SELECT id FROM beneficiaries WHERE id = $1 AND user_id = $2", [beneficiaryId, userId]);
    if (beneficiaryRes.rows.length === 0) {
      throw new Error("Beneficiary not found or unauthorized");
    }

    // 2. Lock and check source account
    const accRes = await client.query("SELECT balance FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE", [fromAccountId, userId]);
    if (accRes.rows.length === 0) {
      throw new Error("Source account not found or unauthorized");
    }

    const currentBalance = parseFloat(accRes.rows[0].balance);
    if (currentBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds in source account" });
    }

    // 3. Deduct from source account
    await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [amount, fromAccountId]);

    // 4. Record transaction with account_id
    await client.query(
      "INSERT INTO transactions (user_id, account_id, type, amount) VALUES ($1, $2, 'transfer', $3)",
      [userId, fromAccountId, amount]
    );

    await client.query("COMMIT");
    res.json({ message: "External transfer successful" });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.message === "Beneficiary not found or unauthorized" || err.message === "Source account not found or unauthorized") {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});

// ─── Profile ──────────────────────────────────────────────────────────────────
app.get("/api/profile", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT name, email, phone, kyc_status, status, daily_limit, failed_login_attempts FROM bank_user WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.put("/api/profile", authMiddleware, async (req, res, next) => {
  const { name, phone } = req.body;
  const userId = req.user.userId;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  try {
    const result = await pool.query(
      "UPDATE bank_user SET name = $1, phone = $2 WHERE id = $3 RETURNING name, email, phone, kyc_status",
      [name, phone, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Profile updated successfully", profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

app.post("/api/change-password", authMiddleware, async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old and new passwords are required." });
  }

  try {
    const userRes = await pool.query("SELECT password_hash FROM bank_user WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const isValid = await bcrypt.compare(oldPassword, userRes.rows[0].password_hash);
    if (!isValid) return res.status(401).json({ error: "Incorrect old password" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE bank_user SET password_hash = $1 WHERE id = $2", [newHash, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

// ─── Transaction History ──────────────────────────────────────────────────────
app.get("/api/transactions", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;
  const { startDate, endDate } = req.query;

  try {
    let query = `
      SELECT id, type, amount, related_user_id, account_id, created_at 
      FROM transactions 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (startDate && endDate) {
      query += ` AND created_at >= $2 AND created_at <= $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/accounts/:id/transactions", authMiddleware, async (req, res, next) => {
  const userId = req.user.userId;
  const accountId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT id, type, amount, related_user_id, created_at 
       FROM transactions 
       WHERE user_id = $1 AND account_id = $2
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId, accountId]
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
          kyc_status    VARCHAR(20) DEFAULT 'pending',
          phone         VARCHAR(20),
          status        VARCHAR(20) DEFAULT 'active',
          daily_limit   NUMERIC(15,2) DEFAULT 10000.00,
          failed_login_attempts INTEGER DEFAULT 0,
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
      await pool.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id        INTEGER NOT NULL REFERENCES bank_user(id),
          account_number VARCHAR(20) UNIQUE NOT NULL,
          account_type   VARCHAR(20) NOT NULL,
          balance        NUMERIC(15,2) DEFAULT 0.00,
          status         VARCHAR(20) DEFAULT 'active',
          created_at     TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id         INTEGER NOT NULL REFERENCES bank_user(id),
          account_id      UUID REFERENCES accounts(id),
          type            VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
          amount          NUMERIC(15,2) NOT NULL,
          related_user_id INTEGER REFERENCES bank_user(id),
          created_at      TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending'");
      await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
      await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'");
      await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS daily_limit NUMERIC(15,2) DEFAULT 10000.00");
      await pool.query("ALTER TABLE bank_user ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0");
      await pool.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id)");
      console.log("Tables ready");
    } catch (err) {
      console.error("Startup error:", err.message);
      process.exit(1);
    }
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
