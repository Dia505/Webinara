const UserLog = require("../model/user_log");

const userLogger = async (req, res, next) => {
  try {
    if (req.session?.userId) {
      const userId = req.session.userId.toString();
      const method = req.method;
      const url = req.originalUrl;
      const timestamp = new Date().toISOString();

      await UserLog.create({
        userId,
        method,
        url,
        timestamp,
      });
    }
  } catch (err) {
    console.error("Logging failed:", err);
  }

  next();
};

module.exports = userLogger;
