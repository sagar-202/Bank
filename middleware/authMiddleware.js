const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId };
        next();
    } catch (err) {
        res.clearCookie("access_token", { httpOnly: true, sameSite: "Strict" });
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
