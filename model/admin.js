const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "admin"
    },
    otp: {
        type: String,
        required: false
    },
    otpExpiresAt: {
        type: Date,
        required: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    passwordHistory: {
        type: [String], 
        default: [],
    },
    passwordChangedAt: {
        type: Date,
        default: Date.now,
    },
});

const Admin = mongoose.model("admin", adminSchema);

module.exports = Admin;