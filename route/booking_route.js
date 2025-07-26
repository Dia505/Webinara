const express = require("express");
const router = express.Router();
const { findAll, save, findByWebinarId, findUpcomingBookings, findPastBookings, checkIfBooked } = require("../controller/booking_controller");
const { authenticateToken } = require("../security/auth")
const { authorizeRole } = require("../security/auth");
const userLogger = require("../middleware/user_logger.js");
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", authenticateToken, authorizeRole("user"), csrfProtection, userLogger, save);
router.get("/upcoming", authenticateToken, authorizeRole("user"), userLogger, findUpcomingBookings);
router.get("/past", authenticateToken, authorizeRole("user"), userLogger, findPastBookings);
router.get("/webinar/:webinarId", authenticateToken, authorizeRole("admin"), findByWebinarId);
router.get("/check-booking/:webinarId", authenticateToken, authorizeRole("user"), checkIfBooked);

module.exports = router;