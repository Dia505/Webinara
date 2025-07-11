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
    role : {
        type: String,
        default: "admin"
    }
});

const Admin = mongoose.model("admin", adminSchema);

module.exports = Admin;