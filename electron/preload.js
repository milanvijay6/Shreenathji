const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Secure Storage
  secureSave: (key, value) => ipcRenderer.invoke('secure-save', key, value),
  secureLoad: (key) => ipcRenderer.invoke('secure-load', key),
  
  // Config
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  resetApp: () => ipcRenderer.invoke('reset-app'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Updates
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateReady: (callback) => ipcRenderer.on('update-ready', callback),
  
  // Webhooks
  onWebhookPayload: (callback) => ipcRenderer.on('webhook-payload', callback),
  
  // Backup & Restore
  backupData: (data) => ipcRenderer.invoke('create-backup', data),
  restoreData: () => ipcRenderer.invoke('restore-backup'),

  // Logging
  logMessage: (level, message, data) => ipcRenderer.send('log-message', level, message, data),
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  
  // Environment
  platform: process.platform
});