const express = require("express")
const router = express.Router();
const { sendOtp, verifyOtp, resetPassword } = require("../controller/user_controller");
const userLogger = require("../middleware/user_logger.js");
const { rateLimiter } = require("../middleware/rate_limiter.js");

router.post("/send-otp", rateLimiter(5, 600000, (req) => req.body.email), sendOtp);
router.post("/verify-otp", verifyOtp);
router.put("/reset-password", userLogger, resetPassword);

module.exports = router;