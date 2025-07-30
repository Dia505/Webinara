// Simple in-memory rate limiter for critical operations
const rateLimiter = (maxAttempts = 5, windowMs = 60000) => {
    const attempts = new Map();

    return (req, res, next) => {
        const key = `${req.ip}-${req.originalUrl}`;
        const now = Date.now();
        const userAttempts = attempts.get(key) || [];

        // Remove old attempts outside the window
        const recentAttempts = userAttempts.filter(time => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                message: "Too many attempts. Please wait before trying again.",
                error: "RATE_LIMIT_EXCEEDED",
                retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
            });
        }

        // Add current attempt
        recentAttempts.push(now);
        attempts.set(key, recentAttempts);

        next();
    };
};

module.exports = { rateLimiter }; 