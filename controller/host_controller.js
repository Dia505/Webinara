const Host = require("../model/host");
const BASE_URL = process.env.BASE_URL;
const validator = require('validator');

const findAll = async (req, res) => {
    try {
        const hosts = await Host.find();

        const updatedHosts = hosts.map(host => {
            const profilePicture = host.profilePicture
                ? `${BASE_URL}/host-images/${host.profilePicture}`
                : `${BASE_URL}/host-images/default_profile_img.png`;

            return {
                ...host._doc,
                profilePicture,
            };
        });

        res.status(200).json(updatedHosts);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch hosts", details: e });
    }
};

const save = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedData = {
            fullName: validator.escape(req.body.fullName || ''),
            bio: validator.escape(req.body.bio || ''),
            email: validator.normalizeEmail(req.body.email || ''),
            expertise: req.body.expertise || [],
            socialMediaLinks: req.body.socialMediaLinks || []
        };

        const { fullName, bio, email, expertise, socialMediaLinks } = sanitizedData;

        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Sanitize expertise array
        const sanitizedExpertise = expertise.map(e => validator.trim(validator.escape(e)));

        const host = new Host({
            fullName,
            bio,
            email,
            expertise: sanitizedExpertise,
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
        // Validate ObjectId format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Host not found" });
        }

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
        // Sanitize input data
        const sanitizedData = {
            fullName: validator.escape(req.body.fullName || ''),
            bio: validator.escape(req.body.bio || ''),
            email: req.body.email ? validator.normalizeEmail(req.body.email) : undefined,
            expertise: req.body.expertise ? req.body.expertise.map(e => validator.trim(validator.escape(e))) : undefined,
            socialMediaLinks: req.body.socialMediaLinks || undefined
        };

        // Remove undefined values
        Object.keys(sanitizedData).forEach(key => {
            if (sanitizedData[key] === undefined) {
                delete sanitizedData[key];
            }
        });

        const host = await Host.findByIdAndUpdate(req.params.id, sanitizedData, { new: true });
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