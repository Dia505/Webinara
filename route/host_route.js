const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateProfilePicture } = require("../controller/host_controller.js");
const hostValidation = require("../validation/host_validation.js");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");
const csrfValidation = require("../validation/csrf_validation.js");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "host-images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })

router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", authenticateToken, authorizeRole("admin"), upload.single("profilePicture"), csrfValidation, hostValidation, save);
router.get("/:id", authenticateToken, authorizeRole("user", "admin"), findById);
router.delete("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, deleteById);
router.put("/:id", authenticateToken, authorizeRole("admin"), csrfValidation, update);
router.put("/:id/profile-picture", authenticateToken, authorizeRole("admin"), upload.single("profilePicture"), csrfValidation, updateProfilePicture);

module.exports = router;