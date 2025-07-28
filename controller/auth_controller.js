const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const Admin = require("../model/admin");
const User = require("../model/user");
const Session = require("../model/session");

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
        return res.status(403).send({ message: "Incorrect email address" });
    }

    const now = new Date();

    // Check if account is locked
    if (cred.lockUntil && cred.lockUntil > now) {
        const unlocksIn = Math.ceil((cred.lockUntil - now) / 60000);
        return res
            .status(403)
            .json({
                message: `Account is locked. Try again in ${unlocksIn} minute(s).`
            });
    }

    const isPasswordCorrect = await bcrypt.compare(password, cred.password);

    if (!isPasswordCorrect) {
        cred.failedLoginAttempts = (cred.failedLoginAttempts || 0) + 1;

        if (cred.failedLoginAttempts >= 3) {
            cred.lockUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins
            cred.failedLoginAttempts = 0; // reset after locking
        }

        await cred.save();
        return res.status(403).json({ message: "Incorrect password" });
    }

    // Successful login: reset failedLoginAttempts and lockUntil
    cred.failedLoginAttempts = 0;
    cred.lockUntil = null;
    await cred.save();

    // Store user info in session
    req.session.userId = cred._id;
    req.session.role = cred.role;

    // Check if password is too old (e.g. older than 90 days)
    const MAX_PASSWORD_AGE_DAYS = 90;
    const msInDay = 1000 * 60 * 60 * 24;

    let forcePasswordReset = false;

    if (cred.passwordChangedAt) {
        const daysSinceChange = Math.floor(
            (Date.now() - new Date(cred.passwordChangedAt)) / msInDay
        );

        if (daysSinceChange >= MAX_PASSWORD_AGE_DAYS) {
            return res.status(403).json({
                message: "Password expired. Please change your password.",
                forcePasswordReset: true,
            });
        }
    }

    // Send OTP after successful login of admin
    if (cred.role === "admin") {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        cred.otp = otp;
        cred.otpExpiresAt = otpExpiresAt;
        await cred.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        try {
            await transporter.sendMail({
                from: '"Webinara Support" <webinara2025@gmail.com>',
                to: cred.email,
                subject: "Login Detected",
                html: `
            <h1>Verify Your Admin Login</h1>
            <p>We've received a login attempt for your admin account.</p>
            <p>Please confirm your identity using the OTP below:</p>
            <h2>${otp}</h2>
            <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        `
            });
        } catch (err) {
            console.error("Failed to send OTP email:", err);
        }
    }

    //Token set in a secure HttpOnly cookie
    //No need to expose token in response body to prevent XSS risk
    res.json({
        role: cred.role,
        _id: cred._id,
        forcePasswordReset,
    });
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            // Remove the session with this token from DB
            await Session.findOneAndDelete({ token });
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
        });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error during logout" });
    }
};

const update = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const admin = await Admin.findById(req.session.userId);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Handle password update
        if (updateData.password) {
            const newPassword = updateData.password;

            for (const oldHashed of admin.passwordHistory || []) {
                const isSame = await bcrypt.compare(newPassword, oldHashed);
                if (isSame) {
                    return res.status(400).json({ message: "This password was used recently. Try a different one." });
                }
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;

            let history = admin.passwordHistory || [];
            history.push(hashedPassword);
            if (history.length > 5) history = history.slice(-5);

            updateData.passwordHistory = history;
            updateData.passwordChangedAt = new Date();
        } else {
            delete updateData.password;
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(req.session.userId, updateData, {
            new: true,
        }).select('-password -passwordHistory');

        res.status(200).json(updatedAdmin);
    } catch (e) {
        console.error("Failed to update admin:", e);
        res.status(500).json({ message: "Failed to update admin" });
    }
};

module.exports = { login, register, logout, update };