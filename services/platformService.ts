
// Type definition for the window object extension
declare global {
  interface Window {
    electronAPI?: {
      secureSave: (key: string, value: string) => Promise<boolean>;
      secureLoad: (key: string) => Promise<string | null>;
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<boolean>;
      resetApp: () => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateReady: (callback: () => void) => void;
      onWebhookPayload: (callback: (event: any, data: {channel: string, payload: any, timestamp: number}) => void) => void;
      backupData: (data: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      restoreData: () => Promise<{ success: boolean; data?: string; error?: string }>;
      logMessage: (level: string, message: string, data?: any) => void;
      getLogPath: () => Promise<string>;
      platform: string;
    };
  }
}

export const isDesktop = (): boolean => {
  return !!window.electronAPI;
};

export const PlatformService = {
  /**
   * Securely saves a value. 
   * On Desktop: Uses OS Keychain via Electron safeStorage.
   * On Web: Uses localStorage (Base64 encoded only, not truly secure).
   */
  secureSave: async (key: string, value: string): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.secureSave(key, value);
    } else {
      // Web Fallback
      localStorage.setItem(`web_secure_${key}`, btoa(value));
    }
  },

  secureLoad: async (key: string): Promise<string | null> => {
    if (window.electronAPI) {
      return await window.electronAPI.secureLoad(key);
    } else {
      // Web Fallback
      const val = localStorage.getItem(`web_secure_${key}`);
      return val ? atob(val) : null;
    }
  },

  getAppConfig: async (key: string, defaultValue: any): Promise<any> => {
    if (window.electronAPI) {
      const val = await window.electronAPI.getConfig(key);
      return val !== undefined ? val : defaultValue;
    }
    // Web Fallback: Handle booleans correctly
    const val = localStorage.getItem(`config_${key}`);
    if (val === null) return defaultValue;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  },

  setAppConfig: async (key: string, value: any): Promise<void> => {
    if (window.electronAPI) {
      await window.electronAPI.setConfig(key, value);
    } else {
      localStorage.setItem(`config_${key}`, String(value));
    }
  },

  getVersion: async (): Promise<string> => {
    if (window.electronAPI) {
      return await window.electronAPI.getAppVersion();
    }
    return "1.0.0 (Web)";
  },

  installUpdate: async () => {
    if (window.electronAPI) {
      await window.electronAPI.installUpdate();
    }
  },

  /**
   * Creates an encrypted backup.
   * Desktop: Dialog Save + AES.
   * Web: JSON Download.
   */
  backupData: async (data: string): Promise<{ success: boolean; path?: string; error?: string }> => {
    if (window.electronAPI) {
      return await window.electronAPI.backupData(data);
    } else {
      try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GlobalReach_Backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
  },

  /**
   * Restores data.
   * Desktop: Dialog Open + AES Decrypt.
   * Web: File Input Upload + JSON Parse.
   */
  restoreData: async (): Promise<{ success: boolean; data?: string; error?: string }> => {
    if (window.electronAPI) {
      return await window.electronAPI.restoreData();
    } else {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (!file) {
            resolve({ success: false, error: "No file selected" });
            return;
          }
          const reader = new FileReader();
          reader.onload = (evt) => {
            resolve({ success: true, data: evt.target?.result as string });
          };
          reader.readAsText(file);
        };
        input.click();
      });
    }
  },

  /**
   * Resets the application configuration, triggering the Setup Wizard on next load.
   */
  resetConfiguration: async (): Promise<void> => {
    if (window.electronAPI) {
        await window.electronAPI.resetApp();
    } else {
        localStorage.removeItem('config_setupComplete');
        localStorage.removeItem('config_webhookToken');
        localStorage.removeItem('config_tunnelUrl');
        localStorage.removeItem('web_secure_user_provided_api_key');
        localStorage.removeItem('web_secure_globalreach_platforms');
        localStorage.removeItem('web_secure_globalreach_user_session');
    }
    // Reload to trigger the wizard
    window.location.reload();
  }
};