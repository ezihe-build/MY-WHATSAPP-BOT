/**
 * EZIHE SUPER BOT - Logger Utility
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

class Logger {
  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'bot.log');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  writeToFile(formattedMessage) {
    try {
      fs.appendFileSync(this.logFile, formattedMessage + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err.message);
    }
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] > currentLevel) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    this.writeToFile(formattedMessage);

    const colorMap = {
      ERROR: chalk.red,
      WARN: chalk.yellow,
      INFO: chalk.cyan,
      DEBUG: chalk.gray,
    };

    const color = colorMap[level] || chalk.white;
    console.log(color(`[${level}] ${message}`));
  }

  error(message, meta) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta) {
    this.log('WARN', message, meta);
  }

  info(message, meta) {
    this.log('INFO', message, meta);
  }

  debug(message, meta) {
    this.log('DEBUG', message, meta);
  }
}

module.exports = new Logger();
