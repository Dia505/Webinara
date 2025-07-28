const crypto = require('crypto');

const csrfValidation = (req, res, next) => {
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

module.exports = csrfValidation;