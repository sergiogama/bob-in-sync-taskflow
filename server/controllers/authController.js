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
    forgotPassword(req, res) {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email is required.' });
      res.status(202).json({
        message: 'Password resets are managed internally. Contact your manager for assistance.',
      });
    },
    resetPassword(req, res, next) {
      const { token, password } = req.body || {};
      if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      try {
        authService.resetPassword(token, password);
        res.json({ message: 'Password has been reset successfully.' });
      } catch (err) {
        next(err);
      }
    },
  };
}
