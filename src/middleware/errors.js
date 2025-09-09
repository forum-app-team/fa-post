export function errorHandler(err, _req, res, _next) {
    console.error(err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Internal Server Error' });
}
