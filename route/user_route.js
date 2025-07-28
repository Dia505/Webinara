const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateProfilePicture, findMe } = require("../controller/user_controller");
const userValidation = require("../validation/user_validation");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const userLogger = require("../middleware/user_logger.js");
const csrf = require('csurf');
const crypto = require('crypto');

// Custom CSRF validation
const validateCSRF = (req, res, next) => {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;

    if (!csrfToken) {
        return res.status(403).json({
            message: 'CSRF token missing',
            error: 'CSRF token is required'
        });
    }

    if (!req.session.csrfSecret) {
        return res.status(403).json({
            message: 'CSRF secret not found in session',
            error: 'Session invalid'
        });
    }

    // Validate the CSRF token
    const expectedToken = crypto
        .createHmac('sha256', req.session.csrfSecret)
        .update(req.sessionID || '')
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    if (csrfToken !== expectedToken) {
        console.log('CSRF Validation Failed:');
        console.log('Expected:', expectedToken);
        console.log('Received:', csrfToken);
        return res.status(403).json({
            message: 'Invalid CSRF token',
            error: 'CSRF token validation failed'
        });
    }

    console.log('CSRF Validation Passed');
    next();
};

// Debug middleware to log CSRF token validation
const debugCSRF = (req, res, next) => {
    console.log('=== CSRF Debug ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    console.log('CSRF Token in header:', req.headers['x-csrf-token']);
    console.log('CSRF Token in body:', req.body._csrf);
    console.log('==================');
    next();
};

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "user-images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })

router.get("/me", authenticateToken, findMe);
router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", userValidation, save);
router.get("/:id", authenticateToken, authorizeRole("user", "admin"), userLogger, findById);
router.delete("/:id", authenticateToken, authorizeRole("user"), validateCSRF, userLogger, deleteById);
router.put("/:id", authenticateToken, authorizeRole("user"), debugCSRF, validateCSRF, userLogger, update);
router.put("/:id/profile-picture", authenticateToken, authorizeRole("user"), upload.single("profilePicture"), debugCSRF, validateCSRF, userLogger, updateProfilePicture);

module.exports = router;