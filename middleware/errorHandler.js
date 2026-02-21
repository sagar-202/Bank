const errorHandler = (err, req, res, next) => {
    console.error("Global Error Handler:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || "Internal server error",
    });
};

module.exports = errorHandler;
