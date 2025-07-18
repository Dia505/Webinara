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

    const token = jwt.sign(
        { id: cred._id, role: cred.role },
        SECRET_KEY,
        { expiresIn: "1h" }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
    });

    //Token set in a secure HttpOnly cookie
    //No need to expose token in response body to prevent XSS risk
    res.json({
        role: cred.role,
        _id: cred._id,
    });
};

const logout = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/"
    });
    res.json({ message: "Logged out" });
};

const update = async (req, res) => {
    try {
        const updateData = { ...req.body };
        const admin = await Admin.findById(req.params.id);

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

        const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        }).select('-password -passwordHistory');

        res.status(200).json(updatedAdmin);
    } catch (e) {
        console.error("Failed to update admin:", e);
        res.status(500).json({ message: "Failed to update admin" });
    }
};

module.exports = { login, register, logout, update };