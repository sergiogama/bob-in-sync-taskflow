import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export function createAuthService(userModel) {
  const sessions = new Map();
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
  };
}
