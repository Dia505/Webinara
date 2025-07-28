const express = require("express")
const router = express.Router();
const adminValidation = require("../validation/admin_validation");
const { login, register, logout, update } = require("../controller/auth_controller")
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const userLogger = require("../middleware/user_logger.js");
const csrfValidation = require("../validation/csrf_validation.js");

router.post("/login", userLogger, login);
router.post("/register", authenticateToken, authorizeRole("admin"), csrfValidation, adminValidation, register);
router.post("/logout", userLogger, logout);
router.put("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, update);

module.exports = router;