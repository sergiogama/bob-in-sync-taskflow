export function createAuthController(authService) {
  return {
    login(req, res) {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
      const session = authService.login(email, password);
      if (!session) return res.status(401).json({ error: 'Invalid email or password.' });
      res.json(session);
    },
    me(req, res) { res.json({ user: req.user }); },
    logout(req, res) { authService.logout(req.token); res.status(204).end(); },
  };
}
