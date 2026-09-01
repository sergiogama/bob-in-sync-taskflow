export function createUserController(userModel, authService) {
  return {
    list(req, res) {
      res.json({ users: userModel.list() });
    },
    issuePasswordReset(req, res, next) {
      try {
        const result = authService.issuePasswordReset(Number(req.params.id));
        res.status(201).json({
          message: 'Password reset token generated.',
          reset_token: result.token,
          expires_in_minutes: 60,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
