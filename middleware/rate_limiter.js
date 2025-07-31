const rateLimiter = (maxAttempts = 5, windowMs = 60000, keyGenerator) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = keyGenerator(req);
    if (!key) return res.status(400).json({ message: "Invalid request for rate limiting" });

    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    const recentAttempts = userAttempts.filter(t => now - t < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        message: "Too many attempts. Please wait before trying again.",
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};
