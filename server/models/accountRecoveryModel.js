export function createAccountRecoveryModel(db) {
  const replaceActiveForUser = db.transaction((userId, tokenHash, expiresAt) => {
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(userId)
    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(userId, tokenHash, expiresAt)
    db.prepare("DELETE FROM password_reset_tokens WHERE used = 1 OR expires_at <= datetime('now')").run()
  })

  const consumeAndUpdatePassword = db.transaction((tokenHash, passwordHash) => {
    const record = db.prepare(
      `SELECT * FROM password_reset_tokens
       WHERE token = ?
         AND used = 0
         AND expires_at > datetime('now')`
    ).get(tokenHash)

    if (!record) return null

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, record.user_id)
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id)
    return record
  })

  return {
    replaceActiveForUser(userId, tokenHash, expiresAt) {
      replaceActiveForUser(userId, tokenHash, expiresAt)
    },
    consumeAndUpdatePassword(tokenHash, passwordHash) {
      return consumeAndUpdatePassword(tokenHash, passwordHash)
    },
  }
}
