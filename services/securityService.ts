import { AuthSession, PlatformConnection, User } from "../types";
import { PlatformService } from "./platformService";

// Simple Token Bucket simulation for client-side rate limiting
const RATE_LIMIT_WINDOW_MS = 60000; 
const MAX_REQUESTS_PER_WINDOW = 15;
let requestTimestamps: number[] = [];

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return false;
  requestTimestamps.push(now);
  return true;
};

export const logSecurityEvent = (eventType: string, userId: string, details: string) => {
  console.log(`[SECURITY AUDIT] ${new Date().toISOString()} | User: ${userId} | Event: ${eventType} | ${details}`);
};

// --- SESSION PERSISTENCE & MANAGEMENT ---

const STORAGE_KEY_USER = 'globalreach_user_session';
const STORAGE_KEY_PLATFORMS = 'globalreach_platforms';

export const saveUserSession = async (user: User) => {
  try {
    const sessionData = JSON.stringify({
      user,
      token: `mock-jwt-${Date.now()}`,
      expiry: Date.now() + (7 * 24 * 60 * 60 * 1000)
    });
    
    // Use Secure Save if available (Electron), else LocalStorage
    await PlatformService.secureSave(STORAGE_KEY_USER, sessionData);
  } catch (e) {
    console.error("Failed to save session", e);
  }
};

export const loadUserSession = async (): Promise<User | null> => {
  try {
    const stored = await PlatformService.secureLoad(STORAGE_KEY_USER);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    if (parsed.expiry < Date.now()) {
      return null;
    }
    return parsed.user;
  } catch (e) {
    return null;
  }
};

export const clearUserSession = () => {
  // Just overwriting with empty string for simplicity across platforms
  PlatformService.secureSave(STORAGE_KEY_USER, "");
};

export const savePlatformConnections = (connections: PlatformConnection[]) => {
  // Connections might contain tokens, so secure save is better
  PlatformService.secureSave(STORAGE_KEY_PLATFORMS, JSON.stringify(connections));
};

export const loadPlatformConnections = async (): Promise<PlatformConnection[]> => {
  try {
    const stored = await PlatformService.secureLoad(STORAGE_KEY_PLATFORMS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const refreshPlatformTokens = async (connections: PlatformConnection[]): Promise<PlatformConnection[]> => {
  // In production, this would handle OAuth token rotation for Google/Microsoft/Meta APIs.
  // For this demo, we simulate a heartbeat check.
  const now = Date.now();
  return connections.map(conn => ({
    ...conn,
    lastTested: now,
    healthStatus: 'healthy'
  }));
};

export const getActiveSessions = (): AuthSession[] => {
  return [
    {
      id: 'sess-current',
      userId: 'current',
      device: 'Desktop App (Current)',
      ip: '192.168.1.105',
      lastActive: Date.now(),
      isCurrent: true
    },
    {
      id: 'sess-mobile-1',
      userId: 'current',
      device: 'iPhone 13 Pro',
      ip: '203.12.55.12',
      lastActive: Date.now() - (45 * 60 * 1000),
      isCurrent: false
    }
  ];
};