require("dotenv").config();

const express = require("express");
const app = express();
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const MongoStore = require('connect-mongo');

require('./scheduled_jobs/webinar_auto_deletion');

connectDb();

const allowedOrigins = [
  "https://192.168.18.11:5173",
  "https://localhost:5173",
  "https://10.1.6.202:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
}));

const options = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.crt"),
};

app.use(express.json());
app.use(cookieParser());

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    secure: true, // set to true if using HTTPS
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
  },
}));

const userRouter = require("./route/user_route");
const adminRouter = require("./route/auth_route");
const hostRouter = require("./route/host_route");
const webinarRouter = require("./route/webinar_route");
const bookingRouter = require("./route/booking_route");
const resetPasswordRouter = require("./route/reset_pwd_route");
const userLogRouter = require("./route/user_log_route");
const csrfRouter = require("./route/csrf_route");

app.use("/api/user", userRouter);
app.use("/api/auth", adminRouter);
app.use("/api/host", hostRouter);
app.use("/api/webinar", webinarRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/reset", resetPasswordRouter);
app.use("/api/user-log", userLogRouter);
app.use("/api/csrf-token", csrfRouter);

app.use("/user-images", express.static(path.join(__dirname, "user-images")));
app.use("/host-images", express.static(path.join(__dirname, "host-images")));
app.use("/webinar-images", express.static(path.join(__dirname, "webinar-images")));

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'Invalid CSRF token',
      error: 'CSRF token validation failed'
    });
  }
  next(err);
});

const PORT = 443;
https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTPS Server running at https://localhost:${PORT}`);
});

module.exports = { app };