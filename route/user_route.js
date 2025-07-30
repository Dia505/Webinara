const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateProfilePicture, findMe } = require("../controller/user_controller");
const userValidation = require("../validation/user_validation");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const userLogger = require("../middleware/user_logger.js");
const csrfValidation = require("../validation/csrf_validation.js");
const uploadErrorHandler = require("../middleware/upload_error_handler.js");
const { validateFileContent } = require("../middleware/file_content_validation.js");

const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "user-images")
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

router.get("/me", authenticateToken, findMe);
router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", userValidation, save);
router.get("/:id", authenticateToken, authorizeRole("user", "admin"), userLogger, findById);
router.delete("/:id", authenticateToken, authorizeRole("user"), csrfValidation, userLogger, deleteById);
router.put("/:id", authenticateToken, authorizeRole("user"), csrfValidation, userLogger, update);
router.put("/:id/profile-picture", authenticateToken, authorizeRole("user"), upload.single("profilePicture"), uploadErrorHandler, validateFileContent, csrfValidation, userLogger, updateProfilePicture);

module.exports = router;