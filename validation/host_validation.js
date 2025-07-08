const joi = require("joi");

const hostSchema = joi.object({
    fullName: joi.string().required(),
    bio: joi.string().required(),
    expertise: joi.array().items(joi.string().trim()).min(1).required(),
    socialMediaLinks: joi.array().items(joi.string().uri()).default([]),
});

function hostValidation(req, res, next) {
    const { fullName, bio, expertise, socialMediaLinks } = req.body;
    const { error } = hostSchema.validate({ fullName, bio, expertise, socialMediaLinks })

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next()
}

module.exports = hostValidation;

