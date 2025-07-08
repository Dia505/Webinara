const Host = require("../model/host");

const findAll = async (req, res) => {
    try {
        const host = await Host.find();
        res.status(200).json(host);
    }
    catch (e) {
        res.json(e)
    }
}

const save = async (req, res) => {
    try {
        const { fullName, bio, email, expertise, socialMediaLinks = [] } = req.body;

        const existing = await Host.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Host with this email already exists" });
        }

        const host = new Host({
            fullName,
            bio,
            email,
            expertise: expertise.map(e => e.trim()),
            socialMediaLinks,
            profilePicture: req.file?.originalname || "default_profile_img.png"
        });

        await host.save();

        res.status(201).json({
            message: "Host created successfully",
            host
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "An error occurred while creating the host"
        });
    }
};

const findById = async (req, res) => {
    try {
        const host = await Host.findById(req.host.id);

        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        const BASE_URL = "http://localhost:3000";

        const profilePicture = host.profilePicture
            ? `${BASE_URL}/host-images/${host.profilePicture}`
            : `${BASE_URL}/host-images/default_profile_img.png`;

        res.status(200).json({ ...host._doc, profilePicture: profilePicture });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e });
    }
};

const deleteById = async (req, res) => {
    try {
        const deletedHost = await Host.findByIdAndDelete(req.params.id);

        if (!deletedHost) {
            return res.status(404).json({ message: "Host not found" });
        }

        res.status(200).json({ message: "Host deleted successfully" });
    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ message: "An error occurred while deleting the host", error: e.message });
    }
};

const update = async (req, res) => {
    try {
        const host = await Host.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(201).json(host);
    }
    catch (e) {
        res.json(e)
    }
}

const updateProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const host = await Host.findById(req.params.id);
        if (!host) {
            return res.status(404).json({ message: "Host not found" });
        }

        host.profilePicture = req.file.filename;
        await host.save();

        res.status(200).json(host);
    } catch (e) {
        res.status(500).json(e);
    }
};

module.exports = {
    findAll,
    save,
    findById,
    deleteById,
    update,
    updateProfilePicture
}