const pool = require("../config/db");

// GET /api/check-balance
const checkBalance = async (req, res) => {
    const { userId } = req.user;

    try {
        const result = await pool.query(
            "SELECT balance FROM bank_user WHERE id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ balance: result.rows[0].balance });
    } catch (err) {
        console.error("Check balance error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { checkBalance };
