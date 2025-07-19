const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", required: true
    },
    createdAt: {
        type: Date, default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("session", sessionSchema);

module.exports = Session;
