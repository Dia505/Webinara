const mongoose = require("mongoose");

const webinarSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: false
    },
    totalSeats: {
        type: Number,
        default: null
    },
    bookedSeats: {
        type: Number,
        default: 0
    },
    webinarPhoto: {
        type: String,
        required: false
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Host",
        required: true
    }
});

const Webinar = mongoose.model("Webinar", webinarSchema);

module.exports = Webinar;