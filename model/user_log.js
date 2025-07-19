const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, required: true },
    url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const UserLog = mongoose.model("userLog", userLogSchema);

module.exports = UserLog;

