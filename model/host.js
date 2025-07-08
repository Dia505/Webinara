const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    expertise: {
        type: [String],
        required: true
    },
    socialMediaLinks: {
        type: [String],
        default: []
    },
    profilePicture: {
        type: String,
        required: false,
        default: "default_profile_img.png"
    }
})

const Host = mongoose.model("Host", hostSchema)

module.exports = Host;