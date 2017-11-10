const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { appUpdater } = require('./appUpdater');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const log = require('electron-log');
const platform = require('./platform');
const isDev = require('electron-is-dev');

let mainWindow = null;

global.fileToOpen = null; //Declare a global empty object variable to hold file path if a file is opened while the app is closed

//Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on('file-handled', () => {
	fileToOpen = null;
});

//Takes in a file path, reads the file, assigns it to the global fileToOpen and then emits an event if windown open
function handleFilePath(filePath) {
	mainWindow.send('Updater', 'Began handleFilePath line 18 of main.js');
	const name = path.basename(filePath);
	mainWindow.send('Updater', `Filename is ${name}`);
	const type = mime.getType(filePath);
	mainWindow.send('Updater', `Filetype is ${type}`);
	const data = fs.readFileSync(filePath, 'base64');
	const fileData = { name, data, type, path: filePath };
	fileToOpen = fileData;
	if (mainWindow) {
		mainWindow.send('open-file', fileData);
	}
	mainWindow.send('Updater', 'Ending handleFilePath line 35 of main.js');
	return fileData;
}

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus();
        console.log(commandLine[2]);
        var filePath = commandLine[2];
        if(filePath != undefined){
          handleFilePath(filePath);
        }
    }
});

if (shouldQuit) {
    app.quit();
}

app.on('will-finish-launching', () => {
	app.on('open-file', (event, filePath) => {
		event.preventDefault();
		handleFilePath(filePath);
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
		const filePath = process.argv[2];
		if (filePath != undefined) {
			handleFilePath(filePath);
		}
	}

	mainWindow.maximize();

	if (isDev) {
		mainWindow.loadURL('http://localhost:3000/');
	} else {
		mainWindow.loadURL('https://dev5.mediref.com.au/new');
	}

	appUpdater(mainWindow);

	setTimeout(() => {
		let version = app.getVersion();
		mainWindow.send('Updater', `You are running v${version}`);
		mainWindow.send('Updater', `Your OS: ${platform.name}`);
	}, 5000);

	mainWindow.webContents.openDevTools();

	// Create the Application's main menu
	const menuTemplate = [
		{
			label: 'Mediref',
			submenu: [
				{ label: 'About Mediref', selector: 'orderFrontStandardAboutPanel:' },
				{ type: 'separator' },
				{
					label: 'Quit',
					accelerator: 'CmdOrCtrl+Q',
					click: function() {
						app.quit();
					},
				},
			],
		},
		{
			label: 'Edit',
			submenu: [
				{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
				{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
				{ type: 'separator' },
				{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
				{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
				{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
				{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
			],
		},
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
});

//For Mac's where app has not quit even if all windows are 'closed'
app.on('activate', () => {
	if (mainWindow === null) {
		createMainWindow();
	}
});

//TODO Set up crash reporter
process.on('uncaughtException', err => {
	console.log(`Application exited with error: ${err}`);
});

//Quit app if all windows are closed
app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('view-pdf', (event, url) => {
	const pdfWindow = new BrowserWindow({
		width: 1024,
		height: 800,
		webPreferences: {
			plugins: true,
		},
	});
	pdfWindow.loadURL(url);
});
