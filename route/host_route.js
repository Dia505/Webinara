const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateProfilePicture } = require("../controller/host_controller.js");
const hostValidation = require("../validation/host_validation.js");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const csrfValidation = require("../validation/csrf_validation.js");
const uploadErrorHandler = require("../middleware/upload_error_handler.js");

const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "host-images")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = uuidv4() + ext;
        cb(null, uniqueName);
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
router.post("/", authenticateToken, authorizeRole("admin"), upload.single("profilePicture"), uploadErrorHandler, csrfValidation, hostValidation, save);
router.get("/:id", authenticateToken, authorizeRole("user", "admin"), findById);
router.delete("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, deleteById);
router.put("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, update);
router.put("/:id/profile-picture", authenticateToken, authorizeRole("admin"), upload.single("profilePicture"), uploadErrorHandler, csrfValidation, updateProfilePicture);

module.exports = router;