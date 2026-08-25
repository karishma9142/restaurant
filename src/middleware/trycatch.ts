import { Request, Response, NextFunction } from "express";

const TryCatch = (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (err: any) {
            console.error(err);

            return res.status(500).json({
                msg: err.message
            });
        }
    };
};

export default TryCatch;