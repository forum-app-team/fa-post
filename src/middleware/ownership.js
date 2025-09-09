export function requireOwner(getOwnerId) {
    return (req, res, next) => {
        const ownerId = getOwnerId(req);
        if (!req.user || req.user.sub !== ownerId) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
}
