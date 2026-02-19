const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { register, login, logout } = require("../controllers/authController");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: "Too many login attempts. Try again later." });
    },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

module.exports = router;
