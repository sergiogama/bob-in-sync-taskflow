import bcrypt from 'bcryptjs';

const users = [
  ['Maria Santos', 'maria.santos@taskflow.local', 'Analyst'],
  ['Daniel Costa', 'daniel.costa@taskflow.local', 'Developer'],
  ['Priya Nair', 'priya.nair@taskflow.local', 'Developer'],
  ['Robert Chen', 'robert.chen@taskflow.local', 'Manager'],
  ['Elena Rossi', 'elena.rossi@taskflow.local', 'Analyst'],
];

const tickets = [
  ['Invoice import failing for EMEA batch', 'The nightly EMEA invoice file stops on records containing a comma in the supplier name.', 'IN_PROGRESS', 2, 1],
  ['User unable to reset password', 'Password reset email is not received by users in the Finance distribution group.', 'OPEN', null, 5],
  ['Customer report export error', 'Quarterly customer activity report returns an error when exported to CSV.', 'IN_PROGRESS', 3, 1],
  ['Authentication timeout in service portal', 'Several users are redirected to sign-in after five minutes of activity.', 'OPEN', 2, 5],
  ['Incorrect value displayed on dashboard', 'Operations dashboard shows the previous day total for completed orders.', 'RESOLVED', 3, 1],
  ['Update tax code reference data', 'Add the approved FY2026 tax codes to the billing application reference table.', 'CLOSED', 2, 1],
  ['Purchase order attachment not opening', 'PDF attachments uploaded before July cannot be opened from the purchase order screen.', 'OPEN', null, 5],
  ['Employee directory search misses results', 'Searching with a hyphenated surname does not return matching employees.', 'RESOLVED', 3, 5],
  ['Scheduled report delivered twice', 'The weekly inventory summary is being emailed twice to warehouse managers.', 'IN_PROGRESS', 2, 1],
  ['Vendor address changes not saved', 'Address updates appear successful but revert after the vendor page is refreshed.', 'OPEN', 3, 5],
  ['Legacy browser banner still displayed', 'The retirement banner remains visible after users move to a supported browser.', 'CLOSED', 2, 1],
  ['Missing audit entries for profile updates', 'Audit history does not record department changes made by HR administrators.', 'RESOLVED', 3, 5],
];

const comments = [
  [1, 2, 'Reproduced with supplier names containing quoted commas. Preparing a parser fix.'],
  [1, 1, 'Sample input file has been attached to the internal support record.'],
  [3, 3, 'The failure occurs after approximately 20,000 rows.'],
  [5, 1, 'Confirmed the corrected total with Operations.'],
  [5, 3, 'Cache refresh was moved to run after the aggregation job.'],
  [8, 5, 'Verified against three hyphenated surnames in the test environment.'],
  [9, 2, 'Found two active scheduler entries for the same distribution list.'],
  [12, 3, 'Logging has been added and deployed to the test environment.'],
];

export function seedDatabase(db) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (existing > 0) return false;

  const passwordHash = bcrypt.hashSync('taskflow123', 10);
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const insertTicket = db.prepare(`
    INSERT INTO tickets (title, description, status, owner_id, created_by_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);
  const insertComment = db.prepare(`
    INSERT INTO comments (ticket_id, author_id, content, created_at)
    VALUES (?, ?, ?, datetime('now', ?))
  `);

  db.transaction(() => {
    users.forEach((user) => insertUser.run(user[0], user[1], passwordHash, user[2]));
    tickets.forEach((ticket, index) => {
      const offset = `-${12 - index} days`;
      insertTicket.run(...ticket, offset, offset);
    });
    comments.forEach((comment, index) => insertComment.run(...comment, `-${8 - index} days`));
  })();
  return true;
}
