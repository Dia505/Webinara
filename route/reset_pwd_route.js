const express = require("express")
const router = express.Router();
const { sendOtp, verifyOtp, resetPassword } = require("../controller/user_controller");
const userLogger = require("../middleware/user_logger.js");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.put("/reset-password", userLogger, resetPassword);

module.exports = router;