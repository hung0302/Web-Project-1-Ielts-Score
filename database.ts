import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS writing (
    writing_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    writing_content TEXT NOT NULL,
    writing_time INTEGER NOT NULL,
    prompt_text TEXT,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
  );

  CREATE TABLE IF NOT EXISTS score (
    score_id TEXT PRIMARY KEY,
    writing_id TEXT NOT NULL,
    TA_score REAL,
    CC_score REAL,
    LR_score REAL,
    GRA_score REAL,
    Comment TEXT,
    FOREIGN KEY (writing_id) REFERENCES writing(writing_id)
  );
`);

try {
  db.exec('ALTER TABLE writing ADD COLUMN prompt_text TEXT;');
} catch (e) {
  // Column might already exist, ignore error
}

// Insert a dummy user if none exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get() as { count: number };
if (userCount.count === 0) {
  db.prepare('INSERT INTO user (user_id, username, password, email) VALUES (?, ?, ?, ?)').run(
    'user_123',
    'admin',
    'password123',
    'admin@example.com'
  );
}

export default db;
