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

app.use("/api/user", userRouter);
app.use("/api/auth", adminRouter);

app.use("/user-images", express.static(path.join(__dirname, "user-images")));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

module.exports = { app };