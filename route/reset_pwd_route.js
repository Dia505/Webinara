const express = require("express")
const router = express.Router();
const { sendOtp, verifyOtp, resetPassword } = require("../controller/user_controller");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.put("/reset-password", resetPassword);

module.exports = router;