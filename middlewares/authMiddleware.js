import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            first_name: decoded.first_name, 
            last_name: decoded.last_name,   
            role: decoded.role
        };
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};


export default authMiddleware;
