const express = require("express");
const router = express.Router();
const { findAll, save, findById, deleteById, update, updateProfilePicture } = require("../controller/user_controller");
const userValidation = require("../validation/user_validation");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "user-images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })

router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.post("/", userValidation, save);
router.get("/:id", authenticateToken, authorizeRole("user", "admin"), findById);
router.delete("/:id", authenticateToken, authorizeRole("user"), deleteById);
router.put("/:id", authenticateToken, authorizeRole("user"), update);
router.put("/:id/profile-picture", authenticateToken, authorizeRole("user"), upload.single("profilePicture"), updateProfilePicture);

module.exports = router;