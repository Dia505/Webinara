const User = require("../model/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const findAll = async (req, res) => {
    try {
        const users = await User.find();

        const BASE_URL = "http://localhost:3000";

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
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const BASE_URL = "http://localhost:3000";

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
        const deletedUser = await User.findByIdAndDelete(req.params.id);

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

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password;
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.status(200).json(user);
    } catch (e) {
        res.status(500).json(e);
    }
};

const updateProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const user = await User.findById(req.params.id);
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

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "Event explorer not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            protocol: "smtp",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        await transporter.sendMail({
            from: '"Webinara Support" <webinara2025@gmail.com>',
            to: user.email,
            subject: "Reset Your Password",
            html: `
                <h1>Reset your password</h1>
                <p>Use the following OTP to reset your password:</p>
                <h2>${otp}</h2>
                <p>If you did not request this, please ignore this email.</p>
            `
        });

        res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword, otp: null, otpExpiresAt: null },
            { new: true }
        );

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
    resetPassword
}