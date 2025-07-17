const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const Admin = require("../model/admin");
const User = require("../model/user");

const register = async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const cred = new Admin({ email, password: hashedPassword });
    await cred.save();
    res.status(201).json(cred);
};

const login = async (req, res) => {
    const { email, password } = req.body;

    let cred = await Admin.findOne({ email });
    if (!cred) {
        cred = await User.findOne({ email });
    }

    if (!cred) {
        return res.status(403).send("Incorrect email address");
    }
    if (!(await bcrypt.compare(password, cred.password))) {
        return res.status(403).send("Incorrect password");
    }

    const token = jwt.sign(
        { id: cred._id, role: cred.role },
        SECRET_KEY,
        { expiresIn: "1h" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,         // Required for HTTPS
        sameSite: "strict",   // Prevent CSRF
        maxAge: 60 * 60 * 1000, // 1 hour
    });

    //Token set in a secure HttpOnly cookie
    //No need to expose token in response body to prevent XSS risk
    res.json({
        role: cred.role,
        _id: cred._id,
    });
};

const logout  = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/"
    });
    res.json({ message: "Logged out" });
};

module.exports = { login, register, logout };