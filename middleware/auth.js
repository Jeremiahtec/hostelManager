const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Access denied. Please login." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adds user data (id, role) to the request object
        next();
    } catch (ex) {
        res.status(400).json({ error: "Invalid token." });
    }
};