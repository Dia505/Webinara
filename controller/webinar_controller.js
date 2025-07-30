const Webinar = require("../model/webinar");
const BASE_URL = process.env.BASE_URL;
const validator = require('validator');

const findAll = async (req, res) => {
    try {
        const webinars = await Webinar.find().populate("hostId");


        const processedWebinars = webinars.map(w => {
            const plainWebinar = w.toObject(); // Convert Mongoose doc to plain JS object

            return {
                ...plainWebinar,
                webinarPhoto: plainWebinar.webinarPhoto
                    ? `${BASE_URL}/webinar-images/${plainWebinar.webinarPhoto}`
                    : null
            };
        });

        res.status(200).json(processedWebinars);
    }
    catch (e) {
        res.status(500).json({ message: "Error fetching webinars", error: e.message });
    }
};


const save = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedData = {
            title: validator.escape(req.body.title || ''),
            subtitle: validator.escape(req.body.subtitle || ''),
            category: validator.escape(req.body.category || ''),
            level: validator.escape(req.body.level || ''),
            language: validator.escape(req.body.language || ''),
            date: req.body.date || '',
            startTime: req.body.startTime || '',
            endTime: req.body.endTime || '',
            totalSeats: req.body.totalSeats || null,
            hostId: req.body.hostId || '',
            webinarPhoto: req.file ? req.file.filename : undefined,
        };

        const webinarData = {
            ...(sanitizedData.value || sanitizedData),
            webinarPhoto: req.file ? req.file.filename : undefined,
        };

        const webinar = new Webinar(webinarData);
        await webinar.save();

        res.status(201).json(webinar);
    } catch (e) {
        console.error("Error creating webinar:", e);
        res.status(500).json({ message: "Error creating webinar", error: e.message });
    }
};

const findById = async (req, res) => {
    try {
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const webinar = await Webinar.findById(req.params.id).populate("hostId");

        if (!webinar) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const webinarPhotoURL = webinar.webinarPhoto
            ? `${BASE_URL}/webinar-images/${webinar.webinarPhoto}`
            : null;

        const hostProfilePictureURL = webinar.hostId?.profilePicture
            ? `${BASE_URL}/host-images/${webinar.hostId.profilePicture}`
            : null;

        res.status(200).json({
            ...webinar._doc,
            webinarPhoto: webinarPhotoURL,
            hostId: {
                ...webinar.hostId._doc,
                profilePicture: hostProfilePictureURL
            }
        });
    } catch (e) {
        console.error("Error fetching webinar:", e);
        res.status(500).json({ message: "Server error", error: e.message });
    }
};

const deleteById = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const deletedWebinar = await Webinar.findByIdAndDelete(req.params.id);

        if (!deletedWebinar) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        res.status(200).json({ message: "Webinar deleted successfully" });
    } catch (e) {
        console.error("Delete Error:", e);
        res.status(500).json({ message: "An error occurred while deleting the webinar", error: e.message });
    }
};

const update = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        // Sanitize input data
        const sanitizedData = {
            title: req.body.title ? validator.escape(req.body.title) : undefined,
            subtitle: req.body.subtitle ? validator.escape(req.body.subtitle) : undefined,
            category: req.body.category ? validator.escape(req.body.category) : undefined,
            level: req.body.level ? validator.escape(req.body.level) : undefined,
            language: req.body.language ? validator.escape(req.body.language) : undefined,
            date: req.body.date || undefined,
            startTime: req.body.startTime || undefined,
            endTime: req.body.endTime || undefined,
            totalSeats: req.body.totalSeats || undefined,
            hostId: req.body.hostId || undefined
        };

        // Remove undefined values
        Object.keys(sanitizedData).forEach(key => {
            if (sanitizedData[key] === undefined) {
                delete sanitizedData[key];
            }
        });

        const webinar = await Webinar.findByIdAndUpdate(req.params.id, sanitizedData, { new: true });
        res.status(201).json(webinar);
    }
    catch (e) {
        res.json(e)
    }
}

const updateWebinarPhoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        // Validate ObjectId format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const webinar = await Webinar.findById(req.params.id);
        if (!webinar) {
            return res.status(404).json({ message: "webinar not found" });
        }

        webinar.webinarPhoto = req.file.filename;
        await webinar.save();

        res.status(200).json(webinar);
    } catch (e) {
        res.status(500).json(e);
    }
};

const searchWebinar = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: "Missing search query" });
    }

    // Sanitize and escape the query to prevent NoSQL injection
    const sanitizedQuery = validator.escape(query.trim());

    // Escape regex special characters to prevent injection
    const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const keywords = sanitizedQuery.toLowerCase().split(/\s+/);
    const orFilters = [];

    keywords.forEach(word => {
        const escapedWord = escapeRegex(word);
        orFilters.push(
            { title: { $regex: escapedWord, $options: "i" } },
            { category: { $regex: escapedWord, $options: "i" } },
            { level: { $regex: escapedWord, $options: "i" } }
            // Handle host.fullName below using populate + filter
        );
    });

    const searchFilter = {
        $or: orFilters,
        date: { $gte: new Date() }
    };

    try {
        const webinars = await Webinar.find(searchFilter)
            .populate("hostId", "fullName") // only get host's fullName
            .exec();

        // Further filter webinars where host name matches the query (also sanitized)
        const filtered = webinars.filter(w =>
            w.hostId?.fullName?.toLowerCase().includes(sanitizedQuery.toLowerCase())
        );

        const finalResults = [...new Set([...webinars, ...filtered])];

        const processedWebinars = finalResults.map(w => {
            const obj = w.toObject();
            obj.webinarPhoto = obj.webinarPhoto
                ? `${BASE_URL}/webinar-images/${obj.webinarPhoto}`
                : null;
            return obj;
        });

        res.status(200).json(processedWebinars);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Error searching webinars", error: error.message });
    }
};

const filterWebinar = async (req, res) => {
    try {
        const { category, level, language, dateRange } = req.query;

        // Check for MongoDB operators in query parameter keys (e.g., category[$ne], level[$regex])
        const queryKeys = Object.keys(req.query);
        for (const key of queryKeys) {
            if (key.includes('[') && key.includes(']')) {
                return res.status(400).json({
                    message: "Invalid filter parameter",
                    error: "Filter parameter names cannot contain special operators"
                });
            }
        }

        const filter = {};

        // Helper function to sanitize and validate filter parameters
        const sanitizeFilterParam = (value) => {
            if (!value) return null;

            // Check if value is an object (indicates MongoDB operator injection)
            if (typeof value === 'object' || Array.isArray(value)) {
                return null;
            }

            const sanitized = validator.escape(String(value).trim());
            return sanitized && sanitized.length > 0 ? sanitized : null;
        };

        // Sanitize filter parameters
        const sanitizedCategory = sanitizeFilterParam(category, 'category');
        const sanitizedLevel = sanitizeFilterParam(level, 'level');
        const sanitizedLanguage = sanitizeFilterParam(language, 'language');

        if (sanitizedCategory) filter.category = sanitizedCategory;
        if (sanitizedLevel) filter.level = sanitizedLevel;
        if (sanitizedLanguage) filter.language = sanitizedLanguage;

        const now = new Date();

        // Always ensure we only get upcoming webinars (past webinars should never show)
        let dateFilter = { $gte: now };

        // Handle relative date filters
        if (dateRange === "today") {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            dateFilter = { $gte: startOfDay, $lte: endOfDay };
        }
        else if (dateRange === "this-week") {
            const endOfWeek = new Date(now);
            const day = now.getDay(); // Sunday = 0
            endOfWeek.setDate(now.getDate() + (6 - day)); // End of current week
            endOfWeek.setHours(23, 59, 59, 999);
            dateFilter = { $gte: now, $lte: endOfWeek };
        }
        else if (dateRange === "next-7-days") {
            const sevenDaysLater = new Date(now);
            sevenDaysLater.setDate(now.getDate() + 7);
            dateFilter = { $gte: now, $lte: sevenDaysLater };
        }
        else if (dateRange === "this-month") {
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            dateFilter = { $gte: now, $lte: endOfMonth };
        }

        // Apply the date filter (always ensures upcoming webinars only)
        filter.date = dateFilter;

        const webinars = await Webinar.find(filter).sort({ date: 1 });

        const processedWebinars = webinars.map(w => {
            const obj = w.toObject();
            obj.webinarPhoto = obj.webinarPhoto
                ? `${BASE_URL}/webinar-images/${obj.webinarPhoto}`
                : null;
            return obj;
        });

        res.status(200).json(processedWebinars);
    } catch (err) {
        console.error("Error filtering webinars:", err);
        res.status(500).json({ message: "Error filtering webinars", error: err.message });
    }
};

const getHomeWebinars = async (req, res) => {
    try {
        const now = new Date();

        const webinars = await Webinar.aggregate([
            { $match: { date: { $gte: now } } },
            { $sample: { size: 6 } }
        ]);


        const processedWebinars = webinars.map(w => ({
            ...w,
            webinarPhoto: w.webinarPhoto
                ? `${BASE_URL}/webinar-images/${w.webinarPhoto}`
                : null
        }));

        res.status(200).json(processedWebinars);
    } catch (e) {
        res.status(500).json({ message: "Error fetching home webinars", error: e.message });
    }
};

const checkBookingFull = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const webinar = await Webinar.findById(req.params.id);

        if (!webinar) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        if (webinar.totalSeats === null) {
            return res.status(200).json({ full: false, message: "Unlimited seats" });
        }

        const isFull = webinar.bookedSeats >= webinar.totalSeats;

        return res.status(200).json({
            full: isFull,
            availableSeats: webinar.totalSeats - webinar.bookedSeats
        });

    } catch (error) {
        console.error("Error checking booking status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const findUpcomingWebinarsByType = async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            return res.status(400).json({ message: "Missing category query parameter" });
        }

        const now = new Date();

        const webinars = await Webinar.find({
            category: category,
            date: { $gte: now }
        }).populate("hostId");

        const processed = webinars.map(webinar => {
            const webinarPhotoURL = webinar.webinarPhoto
                ? `${BASE_URL}/webinar-images/${webinar.webinarPhoto}`
                : null;

            const profilePictureURL = webinar.hostId?.profilePicture
                ? `${BASE_URL}/host-images/${webinar.hostId.profilePicture}`
                : null;

            return {
                ...webinar._doc,
                webinarPhoto: webinarPhotoURL,
                hostId: {
                    ...webinar.hostId?._doc,
                    profilePicture: profilePictureURL
                }
            };
        });

        res.status(200).json(processed);
    } catch (e) {
        res.status(500).json({ message: "Error fetching upcoming webinars by type", error: e.message });
    }
};

module.exports = {
    findAll,
    save,
    findById,
    deleteById,
    update,
    updateWebinarPhoto,
    searchWebinar,
    filterWebinar,
    getHomeWebinars,
    checkBookingFull,
    findUpcomingWebinarsByType
}