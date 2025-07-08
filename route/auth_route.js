const express = require("express")
const router = express.Router();
const adminValidation = require("../validation/admin_validation");
const { login, register } = require("../controller/auth_controller")

router.post("/login", login);
router.post("/register", adminValidation, register);

module.exports = router;