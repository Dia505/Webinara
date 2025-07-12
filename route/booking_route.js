const express = require("express");
const router = express.Router();
const { findAll, save, findUpcomingBookings, findPastBookings, checkIfBooked } = require("../controller/booking_controller");
const { authenticateToken } = require("../security/auth")
const { authorizeRole } = require("../security/auth");

router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", authenticateToken, authorizeRole("user"), save);
router.get("/upcoming", authenticateToken, authorizeRole("user"), findUpcomingBookings);
router.get("/past", authenticateToken, authorizeRole("user"), findPastBookings);
router.get("/check-booking/:webinarId", authenticateToken, authorizeRole("user"), checkIfBooked);

module.exports = router;