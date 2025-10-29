const { genTimes } = require('./utils/utils.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('genTimes function:', genTimes);

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

      // Create time_slots table
      this.db.run(`CREATE TABLE IF NOT EXISTS time_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create reservations table
      this.db.run(`CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        court_id INTEGER NOT NULL,
        time_slot TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'reserved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY(court_id) REFERENCES courts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
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

    // Insert time slots
    const date = new Date();
    const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    const timeSlots = [genTimes(495, 1425, 30), genTimes(780, 1080, 30), genTimes(600, 1020, 30), genTimes(780, 1080, 30), genTimes(600, 1020, 30), genTimes(600, 1020, 30), genTimes(840, 1380, 30)];
    timeSlots[day].forEach(time => {
      this.db.run(
        `INSERT OR IGNORE INTO time_slots (time) VALUES (?)`,
        [time],
        (err) => {
          if (err) console.error('Error inserting time slot:', err);
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