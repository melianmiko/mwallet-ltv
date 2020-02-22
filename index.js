const { app, BrowserWindow, globalShortcut } = require('electron')
const electronDl = require('electron-dl');

var win = null;

electronDl();

function createWindow () {
  win = new BrowserWindow({
    width: 410,
    height: 540,
    webPreferences: {
      nodeIntegration: true
    }
  });

  globalShortcut.register('CommandOrControl+D', () => {
  	showDebugger();
  });

  win.removeMenu();
  win.loadFile('index.html')
}

function showDebugger() {
	win.webContents.openDevTools()
}

app.whenReady().then(createWindow)
