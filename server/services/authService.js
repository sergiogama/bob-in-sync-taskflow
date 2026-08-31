import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export function createAuthService(userModel, accountRecoveryModel) {
  const sessions = new Map();
  const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
  return {
    login(email, password) {
      const user = userModel.findByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;
      const token = crypto.randomBytes(32).toString('hex');
      const publicUser = userModel.findById(user.id);
      sessions.set(token, publicUser);
      return { token, user: publicUser };
    },
    getUser(token) {
      return sessions.get(token) || null;
    },
    logout(token) {
      sessions.delete(token);
    },
    issuePasswordReset(userId) {
      const user = userModel.findById(userId);
      if (!user || !user.active) {
        throw Object.assign(new Error('Active user not found.'), { status: 404 });
      }
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      accountRecoveryModel.replaceActiveForUser(user.id, hashToken(token), expiresAt);
      return { token };
    },
    resetPassword(token, newPassword) {
      const passwordHash = bcrypt.hashSync(newPassword, 10);
      const record = accountRecoveryModel.consumeAndUpdatePassword(hashToken(token), passwordHash);
      if (!record) throw Object.assign(new Error('Invalid or expired reset token.'), { status: 400 });
      for (const [sessionToken, user] of sessions) {
        if (user.id === record.user_id) sessions.delete(sessionToken);
      }
    },
  };
}
