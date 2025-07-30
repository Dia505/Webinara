const crypto = require('crypto');

// Generate simple fingerprint for session
const generateFingerprint = (req) => {
    const components = [
        req.ip,
        req.get('User-Agent') || '',
        req.get('Accept-Language') || ''
    ];

    return crypto.createHash('sha256')
        .update(components.join('|'))
        .digest('hex');
};

const sessionProtection = (req, res, next) => {
    try {
        // Only protect authenticated sessions
        if (!req.session || !req.session.userId) {
            return next();
        }

        const currentFingerprint = generateFingerprint(req);

        // First time login - store fingerprint
        if (!req.session.fingerprint) {
            req.session.fingerprint = currentFingerprint;
            req.session.lastIP = req.ip;
            req.session.lastActivity = Date.now();
            return next();
        }

        // Check for suspicious activity
        let suspicious = false;
        const reasons = [];

        // Different IP address
        if (req.session.lastIP && req.session.lastIP !== req.ip) {
            suspicious = true;
            reasons.push('IP_CHANGE');
        }

        // Different fingerprint (browser/device change)
        if (req.session.fingerprint !== currentFingerprint) {
            suspicious = true;
            reasons.push('FINGERPRINT_MISMATCH');
        }

        // Session timeout (30 minutes)
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        if (req.session.lastActivity && (Date.now() - req.session.lastActivity) > sessionTimeout) {
            suspicious = true;
            reasons.push('SESSION_TIMEOUT');
        }

        if (suspicious) {
            console.log(`Session security violation for user ${req.session.userId}:`, reasons);

            // Invalidate session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                }
            });

            return res.status(401).json({
                message: 'Session security violation detected. Please log in again.',
                error: 'SESSION_VIOLATION',
                reasons: reasons
            });
        }

        // Update session tracking
        req.session.lastIP = req.ip;
        req.session.lastActivity = Date.now();

        next();

    } catch (error) {
        console.error('Session protection error:', error);
        // Don't block the request on middleware error
        next();
    }
};

// Enhanced session configuration
const enhancedSessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: require('connect-mongo').create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 30 * 60, // 30 minutes
        autoRemove: 'native'
    }),
    cookie: {
        httpOnly: true,
        secure: true, // Only send over HTTPS
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000, // 30 minutes
        path: '/'
    },
    name: 'webinara_session', // Don't use default 'connect.sid'
    rolling: true, // Extend session on activity
    unset: 'destroy' // Remove session from store when destroyed
};

module.exports = {
    sessionProtection,
    enhancedSessionConfig
}; 