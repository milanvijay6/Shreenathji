
import { test, expect, _electron as electron } from '@playwright/test';
import path from 'path';

test.describe('Electron App E2E', () => {
  let electronApp: any;

  test.beforeAll(async () => {
    // Launch Electron app
    // Using process.cwd() to resolve path safely without relying on __dirname which might be missing in module scope
    electronApp = await electron.launch({
      args: [path.join(process.cwd(), 'electron/main.js')]
    });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('Application launches and displays login screen', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    
    const title = await window.title();
    expect(title).toBe('GlobalReach Automator');

    const loginHeader = await window.textContent('h1');
    expect(loginHeader).toContain('GlobalReach Login');
  });

  test('Can login and reach dashboard', async () => {
    const window = await electronApp.firstWindow();
    
    // Fill name
    await window.fill('input[placeholder="Enter your name"]', 'Test Agent');
    
    // Click Sign In
    await window.click('button:has-text("Sign In")');
    
    // Wait for dashboard transition (simulated delay in LoginScreen)
    await window.waitForTimeout(1000);
    
    // Check for dashboard header
    const dashboardHeader = await window.isVisible('text=Run Campaign');
    expect(dashboardHeader).toBeTruthy();
  });
});
