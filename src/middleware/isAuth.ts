import { Request , Response , NextFunction } from "express";
import jwt , {JwtPayload} from 'jsonwebtoken';
import { IUser } from "../model/User.js";

export interface AuthenticatedRequest extends Request{
    user?: IUser | null
}

export const IsAuth = async(req:AuthenticatedRequest,res : Response,next:NextFunction):
Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                msg : "not autherise please login"
            });
            return;
        }
        const token = authHeader.split(" ")[1];

        if(!token){
            res.status(401).json({
                msg : "token missing"
            });
            return;
        }

        const decoded = jwt.verify(token , process.env.JWT_SEC as string)as JwtPayload;
        if(!decoded || !decoded.user){
            res.status(401).json({
                msg : "invalid token"
            });
            return;
        }

        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(500).json({
            msg : "please login - jwt error"
        })
    }
}