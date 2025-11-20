
import { Importer } from '../types';

const STORAGE_KEY = 'globalreach_data_encrypted';

// Simple mock encryption/decryption to demonstrate secure storage intent
// In a production app, this would use Web Crypto API or server-side encryption
const encrypt = (data: string): string => {
  try {
    // Mock encryption: Base64 encode
    return btoa(encodeURIComponent(data));
  } catch (e) {
    console.error("Encryption failed", e);
    return data;
  }
};

const decrypt = (data: string): string => {
  try {
    // Mock decryption
    return decodeURIComponent(atob(data));
  } catch (e) {
    console.error("Decryption failed", e);
    return "[]";
  }
};

export const StorageService = {
  saveImporters: (importers: Importer[]) => {
    try {
      const json = JSON.stringify(importers);
      const encrypted = encrypt(json);
      localStorage.setItem(STORAGE_KEY, encrypted);
      console.log(`[Storage] Saved ${importers.length} records encrypted.`);
    } catch (e) {
      console.error("Failed to save importers", e);
    }
  },

  loadImporters: (): Importer[] | null => {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    
    try {
      const json = decrypt(encrypted);
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to load importers", e);
      return null;
    }
  },

  clearStorage: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
