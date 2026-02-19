const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcrypt");

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.access_token;

    // 1. Check if token exists
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        // 2 & 3. Verify JWT signature
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_dev_secret");

        // 4 & 5. Query DB for user's active sessions
        const result = await pool.query(
            "SELECT token_hash, expires_at FROM bank_user_jwt WHERE user_id = $1",
            [decoded.userId]
        );

        let validSession = false;
        const now = new Date();

        // 6. Compare with stored hashes
        for (const row of result.rows) {
            // Check expiry first to avoid unnecessary bcrypt
            if (new Date(row.expires_at) > now) {
                const isMatch = await bcrypt.compare(token, row.token_hash);
                if (isMatch) {
                    validSession = true;
                    break;
                }
            }
        }

        // 7. If no valid session found
        if (!validSession) {
            res.clearCookie("access_token", { httpOnly: true, sameSite: "Strict" });
            return res.status(401).json({ error: "Session revoked or expired" });
        }

        // 8. Attach user and proceed
        req.user = { userId: decoded.userId };
        next();

    } catch (err) {
        // Invalid signature or other errors
        res.clearCookie("access_token", { httpOnly: true, sameSite: "Strict" });
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
