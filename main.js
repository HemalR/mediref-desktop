const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const isDev = require('electron-is-dev');
const PDFWindow = require('electron-pdf-window');

/*
	Log locations (https://github.com/megahertz/electron-log#readme):

	* MacOS: ~/Library/Logs/<app name>/log.log
	* Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/

const log = require('electron-log');
// const isDev = require('electron-is-dev');
const { appUpdater } = require('./appUpdater');
const platform = require('./platform');
const { setMenu } = require('./menuTemplate');

require('electron-context-menu')();

// Set up all log related functionality here. Don't 100% understand the logging levels/functionality.
// Has been sporadic, esp when not in appData.Don't know if related. Second line causes an error if not commented out
log.transports.file.level = 'info';
// log.transports.file.file = __dirname + '/log.txt';

let mainWindow = null;

global.fileToOpen = null; //Declare a global empty object variable to hold file path if a file is opened while the app is closed
global.gp = null;

//Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on('file-handled', () => {
	fileToOpen = null;
});

//Takes in a file path, reads the file, assigns it to the global fileToOpen and then emits an event if window open
function handleFilePath(filePath, ptName = '', ptEmail = '', recipientEmail = '') {
	gp = filePath;
	const name = path.basename(filePath);
	const type = mime.getType(filePath);
	const data = fs.readFileSync(filePath, 'base64');
	const fileData = { name, data, type, path: filePath, ptName, ptEmail, recipientEmail };
	fileToOpen = fileData;
	if (mainWindow) {
		mainWindow.send('open-file', fileData);
		const statusToSend = `File path to upload: ${filePath}`;
		log.info(statusToSend);
		mainWindow.send('Updater', statusToSend);
	}
	log.info(filePath);
	return fileData;
}

function handleWindowsArgs(arr) {
	const [, backupFilePath, filePath, ptName = '', ptEmail = '', recipientEmail = ''] = arr;
	const pathOfUpload = filePath || backupFilePath;

	if (pathOfUpload) {
		handleFilePath(pathOfUpload, ptName, ptEmail, recipientEmail);
	}
}

const gotTheLock = app.requestSingleInstanceLock();

app.on('second-instance', (event, commandLine, cwd) => {
	/* ... */
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		mainWindow.focus();
		handleWindowsArgs(commandLine);
	}
});

if (!gotTheLock) {
	app.quit();
}

app.on('will-finish-launching', () => {
	app.on('open-file', (event, filePath) => {
		event.preventDefault();
		handleFilePath(filePath);
		log.info(`Open file line 63 with the path: ${filePath}`);
	});
});

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: false,
			preload: __dirname + '/preload.js',
		},
	});
	if (platform.isWindows) {
		handleWindowsArgs(process.argv);
	}
	mainWindow.maximize();

	if (isDev) {
		// 	mainWindow.loadURL('http://localhost:3000/');
		mainWindow.webContents.openDevTools();
		// } else {
		// 	mainWindow.loadURL('https://new.mediref.com.au/new');
	}

	mainWindow.loadURL('https://www.mediref.com.au/new');

	appUpdater(mainWindow);

	setTimeout(() => {
		let version = app.getVersion();
		mainWindow.send('Updater', `You are running v${version}`);
		mainWindow.send('Updater', `Your OS: ${platform.name}`);
	}, 5000);

	setMenu(app);
});

//For Mac's where app has not quit even if all windows are 'closed'
app.on('activate', () => {
	if (mainWindow === null) {
		createMainWindow();
	}
});

//TODO Set up crash reporter
process.on('uncaughtException', err => {
	log.error(err);
	console.log(`Application exited with error: ${err}`);
});

//Quit app if all windows are closed
app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('view-pdf', (event, url) => {
	const pdfWindow = new BrowserWindow({ width: 1024, height: 800 });
	PDFWindow.addSupport(pdfWindow);
	pdfWindow.loadURL(url);
});
