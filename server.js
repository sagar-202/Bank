require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const pool = require("./config/db");
const initDb = require("./config/initDb");
const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Global rate limiter (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", healthRouter);
app.use("/api", authRouter);

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

start();

