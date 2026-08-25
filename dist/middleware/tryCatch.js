const TryCatch = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({
                msg: err.message
            });
        }
    };
};
export default TryCatch;
