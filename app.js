require("dotenv").config();

const express = require("express");
const app = express();
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const cookieParser = require("cookie-parser");

connectDb();

const options = {
  key: fs.readFileSync("./certs/server.key"),
  cert: fs.readFileSync("./certs/server.crt"),
};

app.use(cors({
  origin: "https://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const userRouter = require("./route/user_route");
const adminRouter = require("./route/auth_route");
const hostRouter = require("./route/host_route");
const webinarRouter = require("./route/webinar_route");
const bookingRouter = require("./route/booking_route");
const resetPasswordRouter = require("./route/reset_pwd_route");
const userLogRouter = require("./route/user_log_route");

app.use("/api/user", userRouter);
app.use("/api/auth", adminRouter);
app.use("/api/host", hostRouter);
app.use("/api/webinar", webinarRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/reset", resetPasswordRouter);
app.use("/api/user-log", userLogRouter);

app.use("/user-images", express.static(path.join(__dirname, "user-images")));
app.use("/host-images", express.static(path.join(__dirname, "host-images")));
app.use("/webinar-images", express.static(path.join(__dirname, "webinar-images")));

const PORT = 443; 
https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ HTTPS Server running at https://localhost:${PORT}`);
});

module.exports = { app };