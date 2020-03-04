const { app, BrowserWindow, globalShortcut } = require('electron')
const electronDl = require('electron-dl');
const windowStateKeeper = require('electron-window-state');

var win = null;

// Show bootlogs
console.log("Welcome to mWallet!");

// Create window
function createWindow () {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 410,
		defaultHeight: 540
	});

	win = new BrowserWindow({
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		icon: 'build/icon.png',
		webPreferences: {
			nodeIntegration: true
		}
	});

	mainWindowState.manage(win);

	globalShortcut.register('CommandOrControl+D', () => {
		showDebugger();
	});
	globalShortcut.register('CommandOrControl+R', () => {
		win.reload();
	});

	win.removeMenu();
	win.loadFile('www/index.html')
}

function showDebugger() {
	win.webContents.openDevTools()
}

app.whenReady().then(createWindow);
