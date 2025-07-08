const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

function authenticateToken(req, res, next) {
    const token = req.header("authorization")?.split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied: no token provided")
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY)
        req.user = verified;
        next()
    }
    catch (e) {
        console.error("JWT Verification Error:", e.message);
        res.status(400).send("Invalid token");
    }
}

function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user.role; 
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).send("Access denied: insufficient permissions");
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole }