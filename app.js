require("dotenv").config();

const express = require("express");
const app = express();
const connectDb = require("./config/db");
const cors = require("cors");
const path = require("path");

connectDb();

app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));
app.use(express.json());

const userRouter = require("./route/user_route");
const adminRouter = require("./route/auth_route");
const hostRouter = require("./route/host_route");
const webinarRouter = require("./route/webinar_route");
const bookingRouter = require("./route/booking_route");

app.use("/api/user", userRouter);
app.use("/api/auth", adminRouter);
app.use("/api/host", hostRouter);
app.use("/api/webinar", webinarRouter);
app.use("/api/booking", bookingRouter);

app.use("/user-images", express.static(path.join(__dirname, "user-images")));
app.use("/host-images", express.static(path.join(__dirname, "host-images")));
app.use("/webinar-images", express.static(path.join(__dirname, "webinar-images")));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

module.exports = { app };