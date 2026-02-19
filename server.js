require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const pool = require("./config/db");
const initDb = require("./config/initDb");
const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", healthRouter);
app.use("/api", authRouter);
app.use("/api", userRouter);

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

