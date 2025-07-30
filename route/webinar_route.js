const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateWebinarPhoto, searchWebinar, filterWebinar, getHomeWebinars, checkBookingFull, findUpcomingWebinarsByType } = require("../controller/webinar_controller.js");
const webinarValidation = require("../validation/webinar_validation.js");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const csrfValidation = require("../validation/csrf_validation.js");
const uploadErrorHandler = require("../middleware/upload_error_handler.js");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "webinar-images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    // Check file extension first (more secure)
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
        return cb(new Error('Only JPEG, JPG and PNG files are allowed!'), false);
    }

    // Also check file mimetype as additional validation
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG and PNG files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.get("/home-webinars", getHomeWebinars);
router.get("/search", searchWebinar);
router.get("/filter", filterWebinar);
router.get("/webinar-category", findUpcomingWebinarsByType);
router.post("/", authenticateToken, authorizeRole("admin"), upload.single("webinarPhoto"), uploadErrorHandler, csrfValidation, webinarValidation, save);
router.get("/:id", findById);
router.delete("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, deleteById);
router.put("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, update);
router.put("/:id/webinar-image", authenticateToken, authorizeRole("admin"), upload.single("webinarPhoto"), uploadErrorHandler, csrfValidation, updateWebinarPhoto);
router.get("/check-full-booking/:id", checkBookingFull);

module.exports = router;