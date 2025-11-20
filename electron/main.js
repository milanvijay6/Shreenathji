const { app, BrowserWindow, ipcMain, safeStorage, shell, dialog } = require('electron');
const path = require('path');
const express = require('express');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('./logger'); // Import Logger

const store = new Store();
let mainWindow;
let server;
let serverInstance;

// --- LOCAL BACKEND SERVER CONFIGURATION ---
const DEFAULT_PORT = 4000;
const DEFAULT_WEBHOOK_TOKEN = 'globalreach_secret_token';
const BACKUP_ENCRYPTION_KEY = crypto.scryptSync('globalreach_backup_secret', 'salt', 32); // Fixed key for portability

// Global Error Handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception in Main Process', { message: error.message, stack: error.stack });
});

function startServer(port) {
  if (serverInstance) {
    serverInstance.close();
  }

  const appServer = express();
  
  // Middleware for parsing JSON and URL-encoded data
  appServer.use(express.json());
  appServer.use(express.urlencoded({ extended: true }));
  
  // Logging middleware
  appServer.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });

  // Serve static files from the React build directory
  appServer.use(express.static(path.join(__dirname, '../build')));

  // --- WEBHOOK ROUTES ---

  const getVerifyToken = () => store.get('webhookToken', DEFAULT_WEBHOOK_TOKEN);

  // 1. WhatsApp Verification Handshake
  appServer.get('/webhooks/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === getVerifyToken()) {
        logger.info('WhatsApp Webhook Verified');
        res.status(200).send(challenge);
      } else {
        logger.warn('WhatsApp Webhook Verification Failed', { token });
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // 2. WhatsApp Incoming Messages
  appServer.post('/webhooks/whatsapp', (req, res) => {
    // In production, verify X-Hub-Signature-256 header here using app secret
    logger.info('WhatsApp Payload Received');

    if (req.body.object) {
      if (mainWindow) {
        mainWindow.webContents.send('webhook-payload', { 
            channel: 'WhatsApp', 
            payload: req.body,
            timestamp: Date.now()
        });
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // 3. WeChat Verification Handshake
  appServer.get('/webhooks/wechat', (req, res) => {
    const signature = req.query.signature;
    const timestamp = req.query.timestamp;
    const nonce = req.query.nonce;
    const echostr = req.query.echostr;
    const token = getVerifyToken();

    if (!signature || !timestamp || !nonce) {
      return res.sendStatus(400);
    }

    // Sort token, timestamp, nonce lexicographically
    const tmpStr = [token, timestamp, nonce].sort().join('');
    // SHA1 hash
    const sha1 = crypto.createHash('sha1').update(tmpStr).digest('hex');

    if (sha1 === signature) {
      logger.info('WeChat Webhook Verified');
      res.send(echostr);
    } else {
      logger.warn('WeChat Verification Failed');
      res.sendStatus(403);
    }
  });

  // 4. WeChat Incoming Messages
  appServer.post('/webhooks/wechat', (req, res) => {
    logger.info('WeChat Payload Received');

    if (mainWindow) {
      mainWindow.webContents.send('webhook-payload', { 
          channel: 'WeChat', 
          payload: req.body,
          timestamp: Date.now()
      });
    }
    res.sendStatus(200);
  });

  // --- FALLBACK ROUTE ---
  appServer.get('*', (req, res) => {
    if (req.path.startsWith('/webhooks/')) {
        return res.sendStatus(404);
    }
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });

  return new Promise((resolve, reject) => {
    serverInstance = appServer.listen(port, () => {
      logger.info(`Local backend running on port ${port}`);
      resolve(port);
    }).on('error', (err) => {
      logger.error('Server start error', err);
      reject(err);
    });
  });
}

// --- WINDOW CREATION ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: "GlobalReach Automator"
  });

  const savedPort = store.get('serverPort', DEFAULT_PORT);
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    startServer(savedPort)
      .then(() => {
        mainWindow.loadURL(`http://localhost:${savedPort}`);
      })
      .catch((err) => {
        logger.error("Failed to start server on preferred port", err);
        startServer(0).then((p) => mainWindow.loadURL(`http://localhost:${p}`));
      });
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  logger.info('Application Starting...');
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  logger.info('Application Closing');
  if (process.platform !== 'darwin') app.quit();
  if (serverInstance) serverInstance.close();
});

// --- IPC HANDLERS (SECURE BRIDGE) ---

ipcMain.handle('secure-save', async (event, key, value) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value);
    store.set(`secure.${key}`, encrypted.toString('latin1'));
    return true;
  } else {
    store.set(`insecure.${key}`, value);
    return false;
  }
});

ipcMain.handle('secure-load', async (event, key) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = store.get(`secure.${key}`);
    if (!encrypted) return null;
    try {
      const buffer = Buffer.from(encrypted, 'latin1');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      logger.error("Decryption failed", e);
      return null;
    }
  } else {
    return store.get(`insecure.${key}`) || null;
  }
});

ipcMain.handle('get-config', (event, key) => store.get(key));
ipcMain.handle('set-config', (event, key, value) => {
  store.set(key, value);
  return true;
});
ipcMain.handle('reset-app', () => {
  store.clear();
  return true;
});

ipcMain.handle('get-app-version', () => app.getVersion());

// Logging Bridge
ipcMain.on('log-message', (event, level, message, data) => {
  if (logger[level]) {
    logger[level](`[Renderer] ${message}`, data);
  }
});

ipcMain.handle('get-log-path', () => logger.getLogPath());

// Updates
autoUpdater.on('update-available', () => mainWindow?.webContents.send('update-available'));
autoUpdater.on('update-downloaded', () => mainWindow?.webContents.send('update-ready'));
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());

// Backup & Restore
ipcMain.handle('create-backup', async (event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Encrypted Backup',
    defaultPath: `GlobalReach_Backup_${Date.now()}.grbk`,
    filters: [{ name: 'GlobalReach Backup', extensions: ['grbk'] }]
  });

  if (canceled || !filePath) return { success: false };

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', BACKUP_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const payload = JSON.stringify({ iv: iv.toString('hex'), data: encrypted });
    fs.writeFileSync(filePath, payload);
    logger.info('Backup created successfully', { path: filePath });
    return { success: true, path: filePath };
  } catch (e) {
    logger.error('Backup failed', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('restore-backup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Load Encrypted Backup',
    filters: [{ name: 'GlobalReach Backup', extensions: ['grbk'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return { success: false };

  try {
    const raw = fs.readFileSync(filePaths[0], 'utf8');
    const payload = JSON.parse(raw);
    
    if (!payload.iv || !payload.data) throw new Error("Invalid backup file format");

    const iv = Buffer.from(payload.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', BACKUP_ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(payload.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    logger.info('Backup restored successfully');
    return { success: true, data: decrypted };
  } catch (e) {
    logger.error('Restore failed', e);
    return { success: false, error: e.message };
  }
});