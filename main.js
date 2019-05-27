const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const isDev = require('electron-is-dev');
const PDFWindow = require('electron-pdf-window');
const log = require('electron-log');

/*
	Log locations (https://github.com/megahertz/electron-log#readme):

	* MacOS: ~/Library/Logs/<app name>/log.log
	* Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/

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

// Each 'print' launches a new instance. Hence, this check ensures only one instance is ever running...
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
} else {
	app.on('second-instance', (event, commandLine) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}
			mainWindow.focus();
			/* 
				With the electron update, when the command line is used to open Electron while it is already open, the command line
				args are as follows (index numbered):
				0. Path to Mediref
				1. '--allow0file-access-from-files'
				2. '--original-process-start-time=XXX'
				3. filpath and the rest of the command line args

				For initial processes (where command line opens Electron while it is closed), args 1 and 2 from above are omitted. The printer
				driver tries to fix this by sending the file path as argument 1 as well as 2/leaving argument 1 empty. But we need to take
				into account that there are now 2 injections into the args array rather than just 1 so we deal with it by removing arg 1
			*/
			commandLine.splice(1, 1);
			handleWindowsArgs(commandLine);
		}
	});

	app.on('ready', () => {
		log.info('App ready');
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
}

app.on('will-finish-launching', () => {
	app.on('open-file', (event, filePath) => {
		event.preventDefault();
		handleFilePath(filePath);
		log.info(`Open file line 119 with the path: ${filePath}`);
	});
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
