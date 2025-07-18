const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        required: false,
        default: "default_profile_img.png"
    },
    role: {
        type: String,
        default: "user"
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
    }
})

const User = mongoose.model("User", userSchema)

module.exports = User;