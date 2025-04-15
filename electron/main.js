const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Tắt CORS để tăng tốc request
    }
  });

  // Load Angular app (sau khi build)
  mainWindow.loadFile(path.join(__dirname, '../../dist/ok-vip/browser/index.html'));

  // Tối ưu network
  require('http').globalAgent.maxSockets = Infinity;
}

app.whenReady().then(createWindow);


try {
    require('electron-reloader')(module);
  } catch (_) {}