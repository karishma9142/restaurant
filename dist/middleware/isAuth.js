import jwt from 'jsonwebtoken';
export const IsAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                msg: "not autherise please login"
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                msg: "token missing"
            });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SEC);
        if (!decoded || !decoded.user) {
            res.status(401).json({
                msg: "invalid token"
            });
            return;
        }
        req.user = decoded.user;
        next();
    }
    catch (error) {
        res.status(500).json({
            msg: "please login - jwt error"
        });
    }
};
