const joi = require("joi");

const userSchema = joi.object({
    fullName: joi.string().required(),
    mobileNumber: joi.string().pattern(/^9[678]\d{8}$/).required(),
    address: joi.string().required(),
    city: joi.string().required(),
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

function userValidation(req, res, next) {
    const {fullName, mobileNumber, address, city, email, password} = req.body;
    const {error} = userSchema.validate({fullName, mobileNumber, address, city, email, password})

    if(error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next()
}

module.exports = userValidation;

