import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import log from 'electron-log/main';
import { getDb, closeDb } from './db/connection';
import { runMigrations } from './db/migrate';
import { seedRolesAndPermissions } from './db/seed';
import { seedDemoData } from './db/seed-demo';
import { registerAllHandlers } from './ipc';

log.initialize();
log.info('Starting HR Desktop', { version: app.getVersion() });

// Squirrel install events on Windows.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#0b0b0c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Surface renderer-side failures to the log — essential for diagnosing
  // white-screen issues in packaged builds (no devtools visible by default).
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log.error('Renderer failed to load', { code, desc, url });
  });
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) log.warn('Renderer console:', { level, message, line, sourceId });
  });

  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== 'undefined' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    log.info('Loading renderer from', indexHtml);
    await mainWindow.loadFile(indexHtml);
    // Open devtools in the packaged build too while we stabilize the demo.
    // Press Ctrl+Shift+I to toggle. Remove before final ship if desired.
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  try {
    getDb();
    runMigrations();
    seedRolesAndPermissions();
    seedDemoData();
    registerAllHandlers();
    await createMainWindow();
  } catch (e) {
    log.error('Fatal startup error', e);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDb();
});
