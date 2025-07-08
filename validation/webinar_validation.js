const joi = require("joi");

const webinarSchema = joi.object({
    title: joi.string().required(),
    subtitle: joi.string().max(300).required(),
    category: joi.string().required(),
    level: joi.string().required(),
    language: joi.string().required(),
    date: joi.date().min('now').required(),
    startTime: joi.string().required(),
    endTime: joi.string(),
    totalSeats: joi.number(),
    hostId: joi.string().length(24).hex().required(),
});

function webinarValidation(req, res, next) {
    const { error, value } = webinarSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ message: "Validation failed", details: error.details });
    }

    req.body = value; 
    next();
}

module.exports = webinarValidation;