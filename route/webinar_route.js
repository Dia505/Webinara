const express = require("express");
const router = express.Router();
const { findAll, save, findById, findByHostId, deleteById, update, updateWebinarPhoto, searchWebinar, filterWebinar, getHomeWebinars, checkBookingFull } = require("../controller/webinar_controller.js");
const webinarValidation = require("../validation/webinar_validation.js");
const { authenticateToken } = require("../security/auth.js")
const { authorizeRole } = require("../security/auth.js");

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "webinar-images")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })

router.get("/home-webinars", getHomeWebinars);
router.get("/", authenticateToken, authorizeRole("admin"), findAll);
router.get("/search", searchWebinar);
router.get("/filter", filterWebinar);
router.post("/", authenticateToken, authorizeRole("admin"), upload.single("webinarPhoto"), webinarValidation, save);
router.get("/:id", findById);
// router.get("/host/:hostId", authenticateToken, authorizeRole("user", "admin"), findByHostId);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteById);
router.put("/:id", authenticateToken, authorizeRole("admin"), update);
router.put("/:id/webinar-image", authenticateToken, authorizeRole("admin"), upload.single("webinarPhoto"), updateWebinarPhoto);
router.get("/check-full-booking/:id", checkBookingFull);

module.exports = router;