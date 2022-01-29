import { app, BrowserWindow, ipcMain, shell } from 'electron';
import fs from 'fs';
import { promisify } from 'util';
import mime from 'mime';
import path from 'path';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import { appUpdater } from './appUpdater';
import platform from './platform';
import { setMenu } from './menuTemplate';
import { handleDownload } from './utils/handleDownload';
import { FileData } from './global';
import contextMenu from 'electron-context-menu';
import { filterFileArgs } from './utils/filterFileArgs';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

contextMenu({
	prepend: (_defaultActions, params, _browserWindow) => [
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: params.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
			},
		},
	],
	showSaveImage: true,
	showSaveImageAs: true,
});

// Set up all log related functionality here. Don't 100% understand the logging levels/functionality.
// Has been sporadic, esp when not in appData.Don't know if related. Second line causes an error if not commented out
log.transports.file.level = 'info';
// log.transports.file.file = __dirname + '/log.txt';

let mainWindow: null | Electron.BrowserWindow = null;

// Declare a global empty object variable to hold file path if a file is opened while the app is closed
global.fileToOpen = null;
global.pathToHandle = null;

// Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on('file-handled', () => {
	global.fileToOpen = null;
});

// Takes in a file path, reads the file, assigns it to the global fileToOpen and then emits an event if window open
function handleFilePath(filePath: string, ptName = '', ptEmail = '', recipientEmail = '') {
	global.pathToHandle = filePath;
	const name = path.basename(filePath);
	const type = mime.getType(filePath);
	const data = fs.readFileSync(filePath, 'base64');
	const fileData: FileData = {
		name,
		data,
		type,
		path: filePath,
		ptName,
		ptEmail,
		recipientEmail,
	};
	global.fileToOpen = fileData;
	if (mainWindow) {
		mainWindow.webContents.send('open-file', fileData);
		const statusToSend = `File path to upload: ${filePath}`;
		// log.info(statusToSend);
		mainWindow.webContents.send('Updater', statusToSend);
	}
	return fileData;
}

function handleWindowsArgs(args: string[]) {
	const [filePath, ptName = '', ptEmail = '', recipientEmail = ''] = filterFileArgs(args);

	if (filePath) {
		handleFilePath(filePath, ptName, ptEmail, recipientEmail);
	}
}

// Temp folder for PS files (when using Ghostscript) should be cleared
async function clearTempFolder() {
	try {
		const tempDir = 'C:\\MedirefPrinter\\Temp';
		// Retrieve all files in the temp folder
		const files = await readdir(tempDir);
		const oneDay = 1 * 24 * 60 * 60 * 1000;
		const deleteDate = new Date().getTime() - oneDay;
		files.forEach(async function (file) {
			const filepath = path.join(tempDir, file);
			if (!mainWindow) return;
			mainWindow.webContents.send('Updater', `File: ${filepath}`);

			// Find each files createdAt timestamp. Use the earlier between mtime and birthtime to account for
			// situations where birthtime reverts to ctime. See https://nodejs.org/api/fs.html#statsbirthtime
			const { mtime, birthtime } = await stat(filepath);
			const createdDate = Math.min(mtime.getTime(), birthtime.getTime());
			// If older than one day, delete it
			if (deleteDate > createdDate) {
				await unlink(filepath);
				mainWindow.webContents.send('Updater', `Deleted file: ${filepath}`);
			} else {
				mainWindow.webContents.send('Updater', `Did not delete File: ${filepath}`);
			}
		});
	} catch (err: any) {
		if (mainWindow) {
			mainWindow.webContents.send('Updater', `Error clearing temp folder: ${JSON.stringify(err)}`);
		}
		if (err.code === 'ENOENT') {
			return;
		}
	}
}

function createMainWindow() {
	mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: false,
			preload: __dirname + '/preload.js',
			spellcheck: true,
		},
	});
	if (platform.isWindows) {
		handleWindowsArgs(process.argv);
		clearTempFolder();
	}

	mainWindow.maximize();

	if (isDev) {
		mainWindow.loadURL('http://localhost:3000/new');
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadURL('https://www.mediref.com.au/new');
	}
	setMenu(app);
}

/**
 * Each 'print' launches a new instance. Hence, this check ensures only one instance is ever running...
 * See: https://www.electronjs.org/docs/all#apprequestsingleinstancelock
 * The return value of this method indicates whether or not this instance of your application successfully obtained
 * the lock. If it failed to obtain the lock, you can assume that another instance of your application is already
 * running with the lock and exit immediately.
 */

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (_event, commandLine) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}
			mainWindow.focus();
			handleWindowsArgs(commandLine);
		}
	});

	app.on('ready', createMainWindow);
}

app.on('will-finish-launching', () => {
	app.on('open-file', (event, filePath) => {
		event.preventDefault();
		handleFilePath(filePath);
	});
});

// For Mac's where app has not quit even if all windows are 'closed'
app.on('activate', () => {
	if (mainWindow === null) {
		createMainWindow();
	}
});

// TODO Set up crash reporter
process.on('uncaughtException', (err) => {
	log.info(err);
	console.log(`Application exited with error: ${err}`);
});

// Quit app if all windows are closed
app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('view-pdf', (_event, url, filename) => {
	const pdfWindow = new BrowserWindow({
		width: 1024,
		height: 800,
		webPreferences: {
			plugins: true,
		},
		title: filename,
	});
	pdfWindow.loadURL(url);
});

ipcMain.on('app-mounted', () => {
	if (!mainWindow) return;

	// If there is a global file, send it across
	if (global.fileToOpen) {
		mainWindow.webContents.send('open-file', global.fileToOpen);
	}
	// Send electron metadata
	const { name: os, is64Bit } = platform;
	const electronVersion = app.getVersion();
	const basepath = app.getAppPath();
	mainWindow.webContents.send('handle-electron-version', { version: electronVersion, os, is64Bit, path: basepath });
	appUpdater(mainWindow);
});

ipcMain.on('download-file', handleDownload);

// Remotely load a provided url on to the main window (allows for easier use of ngrok)
ipcMain.on('load-url', (_event, url) => {
	if (!mainWindow) return;

	mainWindow.loadURL(url);
});

// Remotely load a provided url on to the main window (allows for easier use of ngrok)
ipcMain.on('load-dev', () => {
	if (!mainWindow) return;
	mainWindow.loadURL('http://localhost:3000/');
});

// Remotely load staging url on to the main window (allows for easier debugging of staging environment)
ipcMain.on('load-staging', () => {
	if (!mainWindow) return;

	mainWindow.loadURL('https://staging.mediref.com.au/');
});

ipcMain.on('clear-temp', async () => {
	await clearTempFolder();
	if (!mainWindow) return;
	mainWindow.webContents.send('Updater', `Temp folder apparently cleared..?`);
});

ipcMain.on('aping', async () => {
	console.log('Async Ping received');
	if (!mainWindow) return;
	mainWindow.webContents.send('Updater', `apong`);
});

ipcMain.on('ping', () => {
	console.log('Ping received');
	if (!mainWindow) return;
	mainWindow.webContents.send('Updater', `pong`);
});
