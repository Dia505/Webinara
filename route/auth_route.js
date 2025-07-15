const express = require("express")
const router = express.Router();
const adminValidation = require("../validation/admin_validation");
const { login, register } = require("../controller/auth_controller")
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");

router.post("/login", login);
router.post("/register", authenticateToken, authorizeRole("admin"), adminValidation, register);

module.exports = router;