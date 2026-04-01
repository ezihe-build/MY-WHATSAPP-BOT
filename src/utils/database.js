/**
 * EZIHE SUPER BOT - Database Utility
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'data', 'ezihe_bot.db');
  }

  async initialize() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Failed to open database:', err);
          reject(err);
        } else {
          logger.info('Database connected');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        is_premium INTEGER DEFAULT 0,
        is_banned INTEGER DEFAULT 0,
        authenticated INTEGER DEFAULT 0,
        auth_time INTEGER,
        command_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        last_activity INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // Groups table
      `CREATE TABLE IF NOT EXISTS groups (
        group_id INTEGER PRIMARY KEY,
        title TEXT,
        type TEXT,
        is_allowed INTEGER DEFAULT 1,
        settings TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // Downloads table
      `CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        url TEXT,
        platform TEXT,
        file_path TEXT,
        file_size INTEGER,
        status TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`,

      // AI Generations table
      `CREATE TABLE IF NOT EXISTS ai_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        prompt TEXT,
        result_url TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER,
        platform TEXT,
        data TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER
      )`,

      // WhatsApp Sessions table
      `CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        phone_number TEXT,
        session_data TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`,

      // Admin Actions table
      `CREATE TABLE IF NOT EXISTS admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT,
        target_id INTEGER,
        reason TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Insert default settings
    await this.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      ['bot_locked', '0']
    );
    await this.run(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      ['maintenance_mode', '0']
    );

    logger.info('Database tables created');
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error:', err);
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
          logger.error('Database get error:', err);
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
          logger.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User methods
  async getUser(userId) {
    return await this.get('SELECT * FROM users WHERE user_id = ?', [userId]);
  }

  async createUser(userId, username, firstName, lastName) {
    await this.run(
      `INSERT OR IGNORE INTO users (user_id, username, first_name, last_name) 
       VALUES (?, ?, ?, ?)`,
      [userId, username, firstName, lastName]
    );
  }

  async updateUser(userId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await this.run(
      `UPDATE users SET ${fields}, last_activity = strftime('%s', 'now') WHERE user_id = ?`,
      [...values, userId]
    );
  }

  async authenticateUser(userId) {
    await this.run(
      `UPDATE users SET authenticated = 1, auth_time = strftime('%s', 'now') WHERE user_id = ?`,
      [userId]
    );
  }

  async incrementCommandCount(userId) {
    await this.run(
      `UPDATE users SET command_count = command_count + 1 WHERE user_id = ?`,
      [userId]
    );
  }

  // Group methods
  async getGroup(groupId) {
    return await this.get('SELECT * FROM groups WHERE group_id = ?', [groupId]);
  }

  async createGroup(groupId, title, type) {
    await this.run(
      `INSERT OR IGNORE INTO groups (group_id, title, type) VALUES (?, ?, ?)`,
      [groupId, title, type]
    );
  }

  // Download methods
  async logDownload(userId, url, platform, filePath, fileSize) {
    await this.run(
      `INSERT INTO downloads (user_id, url, platform, file_path, file_size, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, url, platform, filePath, fileSize, 'completed']
    );
    await this.run(
      `UPDATE users SET download_count = download_count + 1 WHERE user_id = ?`,
      [userId]
    );
  }

  // AI Generation methods
  async logAIGeneration(userId, type, prompt, resultUrl) {
    await this.run(
      `INSERT INTO ai_generations (user_id, type, prompt, result_url) 
       VALUES (?, ?, ?, ?)`,
      [userId, type, prompt, resultUrl]
    );
  }

  // Settings methods
  async getSetting(key) {
    const row = await this.get('SELECT value FROM settings WHERE key = ?', [key]);
    return row ? row.value : null;
  }

  async setSetting(key, value) {
    await this.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%s', 'now'))`,
      [key, value]
    );
  }

  // Stats methods
  async getStats() {
    const users = await this.get('SELECT COUNT(*) as count FROM users');
    const groups = await this.get('SELECT COUNT(*) as count FROM groups');
    const downloads = await this.get('SELECT COUNT(*) as count FROM downloads');
    const aiGen = await this.get('SELECT COUNT(*) as count FROM ai_generations');
    const premium = await this.get('SELECT COUNT(*) as count FROM users WHERE is_premium = 1');

    return {
      totalUsers: users?.count || 0,
      totalGroups: groups?.count || 0,
      totalDownloads: downloads?.count || 0,
      totalAIGenerations: aiGen?.count || 0,
      premiumUsers: premium?.count || 0,
    };
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new Database();
