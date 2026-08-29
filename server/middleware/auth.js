export function requireAuth(authService) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const user = authService.getUser(token);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    req.user = user;
    req.token = token;
    next();
  };
}
