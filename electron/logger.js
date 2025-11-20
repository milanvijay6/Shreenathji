const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
  constructor() {
    // Determine log path (User Data folder)
    this.userDataPath = app.getPath('userData');
    this.logDir = path.join(this.userDataPath, 'logs');
    this.logFile = path.join(this.logDir, 'app.log');
    
    this.init();
  }

  init() {
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Rotate logs on startup
    this.rotateLogs();
  }

  rotateLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = path.join(this.logDir, `app-${timestamp}.log`);
        fs.renameSync(this.logFile, archiveFile);
        
        // Clean up old logs (keep last 5)
        const files = fs.readdirSync(this.logDir)
          .filter(f => f.startsWith('app-') && f.endsWith('.log'))
          .sort()
          .reverse(); // Newest first
          
        if (files.length > 5) {
          files.slice(5).forEach(f => {
            fs.unlinkSync(path.join(this.logDir, f));
          });
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}\n`;
  }

  write(level, message, data) {
    const logEntry = this.formatMessage(level, message, data);
    
    // Console output (for dev)
    console.log(logEntry.trim());

    // File output
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message, data) { this.write('INFO', message, data); }
  warn(message, data) { this.write('WARN', message, data); }
  error(message, data) { this.write('ERROR', message, data); }
  debug(message, data) { this.write('DEBUG', message, data); }

  getLogPath() {
    return this.logFile;
  }
}

module.exports = new Logger();
