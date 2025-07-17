const Webinar = require("../model/webinar");

const findAll = async (req, res) => {
    try {
        const webinars = await Webinar.find().populate("hostId");

        const BASE_URL = "https://localhost:443";

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
        const webinarData = {
            ...(req.body.value || req.body),
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
        const webinar = await Webinar.findById(req.params.id).populate("hostId");

        if (!webinar) {
            return res.status(404).json({ message: "Webinar not found" });
        }

        const BASE_URL = "https://localhost:443";
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
        const webinar = await Webinar.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

    const keywords = query.trim().toLowerCase().split(/\s+/);
    const orFilters = [];

    keywords.forEach(word => {
        orFilters.push(
            { title: { $regex: word, $options: "i" } },
            { category: { $regex: word, $options: "i" } },
            { level: { $regex: word, $options: "i" } }
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

        // Further filter webinars where host name matches the query
        const filtered = webinars.filter(w =>
            w.hostId?.fullName?.toLowerCase().includes(query.toLowerCase())
        );

        const finalResults = [...new Set([...webinars, ...filtered])];

        const BASE_URL = "https://localhost:443";

        const processedWebinars = finalResults.map(w => {
            const obj = w.toObject(); 
            obj.webinarPhoto = obj.webinarPhoto
                ? `${BASE_URL}/webinar-images/${obj.webinarPhoto}`
                : null;
            return obj;
        });

        res.status(200).json(processedWebinars);
    } catch (e) {
        console.error("Search failed:", e);
        res.status(500).json({ message: "Search failed", error: e.message });
    }
};

const filterWebinar = async (req, res) => {
    try {
        const { category, level, language, dateRange } = req.query;

        const filter = {};

        if (category) filter.category = category;
        if (level) filter.level = level;
        if (language) filter.language = language;

        const now = new Date();

        // Handle relative date filters using just the `date` field
        if (dateRange === "today") {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            filter.date = { $gte: startOfDay, $lte: endOfDay };
        }

        else if (dateRange === "this-week") {
            const day = now.getDay(); // Sunday = 0
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - day);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            filter.date = { $gte: startOfWeek, $lte: endOfWeek };
        }

        else if (dateRange === "next-7-days") {
            const sevenDaysLater = new Date(now);
            sevenDaysLater.setDate(now.getDate() + 7);
            filter.date = { $gte: now, $lte: sevenDaysLater };
        }

        else if (dateRange === "this-month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            filter.date = { $gte: startOfMonth, $lte: endOfMonth };
        }

        else {
            // default to upcoming only
            filter.date = { $gte: new Date() };
        }

        const webinars = await Webinar.find(filter).sort({ date: 1 });

        const BASE_URL = "https://localhost:443";

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

        const BASE_URL = "https://localhost:443";

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
        const BASE_URL = "https://localhost:443";

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