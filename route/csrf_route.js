const express = require("express");
const csrf = require("csurf");
const crypto = require("crypto");
const router = express.Router();

// Configure CSRF protection
const csrfProtection = csrf({
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

router.get('/', csrfProtection, (req, res) => {
  // Generate CSRF token using the same algorithm as validation
  const csrfToken = crypto
    .createHmac('sha256', req.session.csrfSecret)
    .update(req.sessionID || '')
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  res.json({ csrfToken });
});

module.exports = router;
