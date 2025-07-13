const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    webinarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Webinar",
        required: true
    },
    webinarDetails: {
        webinarPhoto: String,
        title: String,
        level: String,
        language: String,
        date: Date,
        startTime: String,
        endTime: String,
        hostFullName: String
    }
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;