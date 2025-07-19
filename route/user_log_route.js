const express = require("express");
const router = express.Router();
const { findAll } = require("../controller/user_log_controller");
const { authenticateToken } = require("../security/auth")
const { authorizeRole } = require("../security/auth");

router.get("/", authenticateToken, authorizeRole("admin"), findAll);

module.exports = router;