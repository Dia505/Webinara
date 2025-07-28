const User = require("../model/user");
const Admin = require("../model/admin");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const BASE_URL = process.env.BASE_URL;

const findAll = async (req, res) => {
    try {
        const users = await User.find();

        const updatedUsers = users.map(user => {
            const profilePicture = user.profilePicture
                ? `${BASE_URL}/user-images/${user.profilePicture}`
                : `${BASE_URL}/user-images/default_profile_img.png`;

            return {
                ...user._doc,
                profilePicture,
            };
        });

        res.status(200).json(updatedUsers);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch users", details: e });
    }
};

const save = async (req, res) => {
    try {
        const { fullName, mobileNumber, address, city, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            mobileNumber,
            address,
            city,
            email,
            password: hashedPassword,
            passwordHistory: [hashedPassword],
            passwordChangedAt: Date.now(),
            profilePicture: req.file?.originalname || "default_profile_img.png"
        });

        await user.save();

        const { password: pw, ...userData } = user.toObject();

        res.status(201).json({
            message: "User created successfully",
            user: userData
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: "An error occurred while creating the user" });
    }
};

const findById = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const profilePicture = user.profilePicture
            ? `${BASE_URL}/user-images/${user.profilePicture}`
            : `${BASE_URL}/user-images/default_profile_img.png`;

        res.status(200).json({ ...user._doc, profilePicture: profilePicture });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e });
    }
};

const deleteById = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.session.userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ message: "An error occurred while deleting the user", error: e.message });
    }
};

const update = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (updateData.password) {
            const newPassword = updateData.password;

            // Check if new password matches any previous password
            for (const oldHashed of user.passwordHistory) {
                const isSame = await bcrypt.compare(newPassword, oldHashed);
                if (isSame) {
                    return res.status(400).json({ message: "This password was used recently. Try a different one." });
                }
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;

            // Update passwordHistory (keep last 5)
            let history = user.passwordHistory || [];
            history.push(hashedPassword);
            if (history.length > 5) history = history.slice(history.length - 5);

            updateData.passwordHistory = history;
            updateData.passwordChangedAt = new Date();
        } else {
            delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(req.session.userId, updateData, { new: true });

        res.status(200).json(updatedUser);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Failed to update user" });
    }
};

const updateProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.profilePicture = req.file.filename;
        await user.save();

        res.status(200).json(user);
    } catch (e) {
        res.status(500).json(e);
    }
};

const findAccountByEmail = async (email) => {
    const user = await User.findOne({ email });
    if (user) return { account: user, role: 'user' };

    const admin = await Admin.findOne({ email });
    if (admin) return { account: admin, role: 'admin' };

    return { account: null };
};

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const { account, role } = await findAccountByEmail(email);
        if (!account) return res.status(404).json({ message: "Account not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        account.otp = otp;
        account.otpExpiresAt = otpExpiresAt;
        await account.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"Webinara Support" <webinara2025@gmail.com>',
            to: account.email,
            subject: "Reset Your Password",
            html: `
                <h1>Reset your password</h1>
                <p>Use the following OTP to reset your password:</p>
                <h2>${otp}</h2>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore.</p>
            `
        });

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const { account } = await findAccountByEmail(email);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (account.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

        if (account.otpExpiresAt < Date.now()) return res.status(400).json({ message: "OTP has expired" });

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;

        const { account, role } = await findAccountByEmail(email);
        if (!account) return res.status(404).json({ message: "Account not found" });

        if (account.otp !== otp || account.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Check if password was used before
        if (account.passwordHistory?.some(prev => bcrypt.compareSync(newPassword, prev))) {
            return res.status(400).json({ message: "You cannot reuse a previous password" });
        }

        // Update password and history
        account.password = hashedPassword;
        account.otp = null;
        account.otpExpiresAt = null;

        // Initialize passwordHistory if missing
        if (!account.passwordHistory) account.passwordHistory = [];

        // Add current password to history (before changing it)
        account.passwordHistory.unshift(hashedPassword);

        // Limit history to last 5 passwords
        account.passwordHistory = account.passwordHistory.slice(0, 5);

        account.passwordChangedAt = new Date();

        await account.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const findMe = async (req, res) => {
    try {
        let user;
        if (req.session.role === "admin") {
            user = await Admin.findById(req.session.userId).select("-password");
        } else {
            user = await User.findById(req.session.userId).select("-password");
        }
        if (!user) return res.status(404).json({ message: "User not found" });

        const profilePicture = user.profilePicture
            ? `${BASE_URL}/user-images/${user.profilePicture}`
            : `${BASE_URL}/user-images/default_profile_img.png`;

        res.status(200).json({ user: { ...user._doc, profilePicture } });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    findAll,
    save,
    findById,
    deleteById,
    update,
    updateProfilePicture,
    sendOtp,
    verifyOtp,
    resetPassword,
    findMe
}