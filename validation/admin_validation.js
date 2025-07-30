const joi = require("joi");

const adminSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string()
        .min(8)
        .max(16)
        .pattern(new RegExp('(?=.*[a-z])'))
        .pattern(new RegExp('(?=.*[A-Z])'))
        .pattern(new RegExp('(?=.*[0-9])'))
        .pattern(new RegExp('(?=.*[!@#$%^&*])'))
        .required()
});

function adminValidation(req, res, next) {
    const { email, password } = req.body;
    const { error } = adminSchema.validate({ email, password })

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next()
}

module.exports = adminValidation;

