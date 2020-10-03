const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');

/*
	Log locations (https://github.com/megahertz/electron-log#readme):

	* MacOS: ~/Library/Logs/<app name>/log.log
	* Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
*/

const { appUpdater } = require('./appUpdater');
const platform = require('./platform');
const { setMenu } = require('./menuTemplate');
const contextMenu = require('electron-context-menu');

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
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
	const fileData = {
		name,
		data,
		type,
		path: filePath,
		ptName,
		ptEmail,
		recipientEmail,
	};
	fileToOpen = fileData;
	if (mainWindow) {
		mainWindow.send('open-file', fileData);
		const statusToSend = `File path to upload: ${filePath}`;
		// log.info(statusToSend);
		mainWindow.send('Updater', statusToSend);
	}
	//   log.info(filePath);
	return fileData;
}

function handleWindowsArgs(arr) {
	const [, backupFilePath, filePath, ptName = '', ptEmail = '', recipientEmail = ''] = arr;
	const pathOfUpload = filePath || backupFilePath;

	if (pathOfUpload) {
		handleFilePath(pathOfUpload, ptName, ptEmail, recipientEmail);
	}
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
		// log.info("App ready");
		mainWindow = new BrowserWindow({
			webPreferences: {
				nodeIntegration: false,
				preload: __dirname + '/preload.js',
				spellcheck: true,
			},
		});
		if (platform.isWindows) {
			handleWindowsArgs(process.argv);
		}
		mainWindow.maximize();

		if (isDev) {
			mainWindow.loadURL('http://localhost:3000/new');
			mainWindow.webContents.openDevTools();
		} else {
			mainWindow.loadURL('https://www.mediref.com.au/new');
		}
		setMenu(app);
	});
}

app.on('will-finish-launching', () => {
	app.on('open-file', (event, filePath) => {
		event.preventDefault();
		handleFilePath(filePath);
		// log.info(`Open file line 140 with the path: ${filePath}`);
	});
});

//For Mac's where app has not quit even if all windows are 'closed'
app.on('activate', () => {
	if (mainWindow === null) {
		createMainWindow();
	}
});

//TODO Set up crash reporter
process.on('uncaughtException', (err) => {
	log.info(err);
	console.log(`Application exited with error: ${err}`);
});

//Quit app if all windows are closed
app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('view-pdf', (_event, url) => {
	const pdfWindow = new BrowserWindow({
		width: 1024,
		height: 800,
		webPreferences: {
			plugins: true,
		},
	});
	pdfWindow.loadURL(url);
});

ipcMain.on('app-mounted', () => {
	const { name: os, is64Bit } = platform;
	const electronVersion = app.getVersion();
	// #SWITCH
	mainWindow.send('handle-electron-version (AppData Installer)', electronVersion, os, is64Bit);
	appUpdater(mainWindow);
});

ipcMain.on('download-file', (_e, downloadUrl, customName, ext, type) => {
	const contents = mainWindow.webContents;
	contents.downloadURL(downloadUrl);
	// https://electronjs.org/docs/api/dialog#dialogshowsavedialogbrowserwindow-options-callback
	contents.session.on('will-download', (_event, item) => {
		// log.info("Downloading file");
		mainWindow.send('Updater', 'Downloading file, electorn main.js line 161');
		const options = {
			defaultPath: customName, // defaultPath String (optional) - Absolute directory path, absolute file path, or file name to use by default.
			buttonLabel: 'Save', // String (optional) - Custom label for the confirmation button, when left empty the default label will be used.
			filters: [
				{ name: type, extensions: [ext.substr(1)] },
				{ name: 'All files', extensions: ['*'] },
			], // https://electronjs.org/docs/api/structures/file-filter
		};
		item.setSaveDialogOptions(options);
	});
});

// When an upload is complete, check to see if it was a nova-pdf printed file, and if so, delete it
ipcMain.on('upload-complete', (_event, filePath) => {
	// if (fs.existsSync(filePath)) {
	//   fs.unlink(filePath, err => {
	//     if (err) {
	//       mainWindow.send("Updater", JSON.stringify(err));
	//       log.info(err);
	//       throw err;
	//     } else {
	//       mainWindow.send(`File successfully removed: ${filePath}`);
	//     }
	//   });
	// } else {
	//   mainWindow.send(`File doesn't exist: ${filePath}`);
	// }
});

// Remotely load a provided url on to the main window (allows for easier use of ngrok)
ipcMain.on('load-url', (_event, url) => {
	mainWindow.loadURL(url);
});

// Remotely load a provided url on to the main window (allows for easier use of ngrok)
ipcMain.on('load-dev', () => {
	mainWindow.loadURL('http://localhost:3000/');
});
