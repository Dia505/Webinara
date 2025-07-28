async function authenticateToken(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).send("Access denied: not logged in");
    }
    next();
}

function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.session.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).send("Access denied: insufficient permissions");
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole }