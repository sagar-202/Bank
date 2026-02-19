const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const SALT_ROUNDS = 10;

// POST /api/register
const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "name, email and password are required" });
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        await pool.query(
            `INSERT INTO bank_user (name, email, password_hash, balance)
       VALUES ($1, $2, $3, 10000.00)`,
            [name, email, password_hash]
        );

        return res.status(201).json({ message: "User created" });
    } catch (err) {
        // PostgreSQL unique violation error code
        if (err.code === "23505") {
            return res.status(409).json({ message: "Email already registered" });
        }
        console.error("Register error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM bank_user WHERE email = $1",
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Strict",
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error("Login error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/logout
const logout = (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
    });
    return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login, logout };
