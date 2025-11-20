const { app, BrowserWindow, ipcMain, safeStorage, shell, dialog } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const winston = require('winston');
const { autoUpdater } = require('electron-updater');

// --- CONFIGURATION ---
const DEFAULT_PORT = 4000;
const CONFIG_FILE_NAME = 'config.json';
const BACKUP_ENCRYPTION_KEY = crypto.scryptSync('shreenathji_secret', 'salt', 32);

// --- LOGGER SETUP ---
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// --- SIMPLE CONFIG STORE ---
const configPath = path.join(app.getPath('userData'), CONFIG_FILE_NAME);

function getConfig(key, defaultValue) {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const json = JSON.parse(data);
      return json[key] !== undefined ? json[key] : defaultValue;
    }
  } catch (err) {
    logger.error('Error reading config', err);
  }
  return defaultValue;
}

function setConfig(key, value) {
  try {
    let json = {};
    if (fs.existsSync(configPath)) {
      json = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    json[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(json, null, 2));
    return true;
  } catch (err) {
    logger.error('Error writing config', err);
    return false;
  }
}

// --- EXPRESS SERVER ---
let serverInstance;

function startServer(startingPort) {
  const appServer = express();

  // Middleware
  appServer.use(express.json());
  appServer.use(express.urlencoded({ extended: true }));

  // Static Files
  // This points to 'electron/build'
  const buildPath = path.join(__dirname, 'build');
  
  // Check if build exists
  if (!fs.existsSync(buildPath)) {
    logger.error(`CRITICAL: Build directory not found at ${buildPath}. Run 'npm run build:react' first.`);
  } else {
    logger.info(`Serving static files from: ${buildPath}`);
  }

  appServer.use(express.static(buildPath));

  // Webhook Routes
  appServer.post('/webhooks/whatsapp', (req, res) => {
    logger.info('WhatsApp webhook received');
    // Forward to renderer if window exists
    if (mainWindow) {
      mainWindow.webContents.send('webhook-payload', { 
        channel: 'WhatsApp', 
        payload: req.body, 
        timestamp: Date.now() 
      });
    }
    res.sendStatus(200);
  });

  // Fallback for React Router
  appServer.get('*', (req, res) => {
    if (req.path.startsWith('/webhooks/')) return res.sendStatus(404);
    
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      const errorMsg = `Application not built. Expected index.html at: ${indexPath}`;
      logger.error(errorMsg);
      res.status(404).send(errorMsg);
    }
  });

  return new Promise((resolve, reject) => {
    const tryListen = (port) => {
      const server = appServer.listen(port, '127.0.0.1', () => {
        logger.info(`Local backend running on http://localhost:${port}`);
        setConfig('serverPort', port);
        resolve({ server, port });
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Port ${port} in use, trying ${port + 1}`);
          tryListen(port + 1);
        } else {
          reject(err);
        }
      });
    };
    tryListen(startingPort);
  });
}

// --- ELECTRON WINDOW ---
let mainWindow;

async function createWindow() {
  // 1. Start Express Server
  let port = DEFAULT_PORT;
  try {
    const result = await startServer(DEFAULT_PORT);
    serverInstance = result.server;
    port = result.port;
  } catch (err) {
    logger.error('Failed to start Express server', err);
    dialog.showErrorBox('Server Error', 'Failed to start local backend. Check logs.');
    return;
  }

  // 2. Create Window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  });

  // 3. Load from Local Express Server
  const url = `http://localhost:${port}`;
  logger.info(`Loading Electron window from: ${url}`);
  
  mainWindow.loadURL(url).catch(err => {
    logger.error('Failed to load URL', err);
    dialog.showErrorBox('Load Error', `Failed to load application at ${url}`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  
  autoUpdater.checkForUpdatesAndNotify().catch(err => logger.warn('Update check failed', err));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (serverInstance) serverInstance.close();
});

// --- IPC HANDLERS ---
ipcMain.handle('get-config', (event, key) => getConfig(key));
ipcMain.handle('set-config', (event, key, value) => setConfig(key, value));

ipcMain.handle('secure-save', async (event, key, value) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value);
    setConfig(`secure_${key}`, encrypted.toString('hex'));
    return true;
  }
  return false;
});

ipcMain.handle('secure-load', async (event, key) => {
  if (safeStorage.isEncryptionAvailable()) {
    const hex = getConfig(`secure_${key}`);
    if (!hex) return null;
    try {
      const buffer = Buffer.from(hex, 'hex');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      logger.error('Decryption failed', e);
    }
  }
  return null;
});

ipcMain.handle('reset-app', async () => {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Reset failed', error);
    return false;
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('create-backup', async (event, dataString) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Encrypted Backup',
    filters: [{ name: 'Backup', extensions: ['grbk'] }]
  });
  if (canceled || !filePath) return { success: false };

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', BACKUP_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const payload = JSON.stringify({ iv: iv.toString('hex'), data: encrypted });
    fs.writeFileSync(filePath, payload);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('restore-backup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Backup', extensions: ['grbk'] }],
    properties: ['openFile']
  });
  if (canceled || filePaths.length === 0) return { success: false };

  try {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    const json = JSON.parse(content);
    const iv = Buffer.from(json.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', BACKUP_ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(json.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return { success: true, data: decrypted };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-log-path', () => path.join(logDir, 'combined.log'));
ipcMain.on('log-message', (event, level, message, data) => {
  logger.log(level, message, data);
});