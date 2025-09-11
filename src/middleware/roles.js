export function requireAdmin(req, res, next) {
    const role = req.user?.role;
    if (!['admin','super-admin'].includes(role)) {
        return res.status(403).json({ message: 'Admin only' });
    }
    next();
}
