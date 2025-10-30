const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database('./badminton.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    this.db.serialize(() => {
      // Create users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create courts table
      this.db.run(`CREATE TABLE IF NOT EXISTS courts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Drop existing reservations table to ensure clean schema
      this.db.run(`DROP TABLE IF EXISTS reservations`);
      
      // Remove time_slots table as we no longer need it for queue system
      this.db.run(`DROP TABLE IF EXISTS time_slots`);

      // Create reservations table (queue system)
      this.db.run(`CREATE TABLE reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        court_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        queue_position INTEGER NOT NULL,
        status TEXT DEFAULT 'reserved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (court_id) REFERENCES courts(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(court_id, queue_position)
      )`);

      // Create court_sessions table
      this.db.run(`CREATE TABLE IF NOT EXISTS court_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        court_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        status TEXT DEFAULT 'active',
        FOREIGN KEY(court_id) REFERENCES courts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Create groups table
      this.db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create group_members table
      this.db.run(`CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(group_id) REFERENCES groups(id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(group_id, user_id)
      )`);

      // Seed initial data
      this.seedData();
    });
  }

  seedData() {
    // Insert courts
    const courts = [
      { id: 1, name: 'Court 1' },
      { id: 2, name: 'Court 2' },
      { id: 3, name: 'Court 3' }
    ];

    courts.forEach(court => {
      this.db.run(
        `INSERT OR IGNORE INTO courts (id, name) VALUES (?, ?)`,
        [court.id, court.name],
        (err) => {
          if (err) console.error('Error inserting court:', err);
        }
      );
    });

    console.log('Database seeded with initial data');
  }

  // Utility methods for database operations
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = Database;