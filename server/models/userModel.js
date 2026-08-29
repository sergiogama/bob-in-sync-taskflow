export function createUserModel(db) {
  const publicFields = 'id, name, email, role, active, created_at';
  return {
    findByEmail(email) {
      return db.prepare('SELECT * FROM users WHERE lower(email) = lower(?) AND active = 1').get(email);
    },
    findById(id) {
      return db.prepare(`SELECT ${publicFields} FROM users WHERE id = ?`).get(id);
    },
    list() {
      return db.prepare(`SELECT ${publicFields} FROM users ORDER BY name`).all();
    },
  };
}
