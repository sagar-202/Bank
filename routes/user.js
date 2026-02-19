const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { checkBalance } = require("../controllers/userController");

router.get("/check-balance", authMiddleware, checkBalance);

module.exports = router;
