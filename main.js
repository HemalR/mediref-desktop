const {app, BrowserWindow, ipcMain} = require('electron');
const {autoUpdater} = require("electron-updater");
const {appUpdater} = require('./autoupdater');
const fs = require('fs');

//TODO Uncomment this when ready to log
// const log = require('electron-log');
// autoUpdater.logger = log;
// autoUpdater.logger.transports.file.level = 'info';
// log.info('App starting...');

var mainWindow = null;

global.fileToOpen = null; //Declare a global empty object variable to hold file path if a file is opened while the app is closed


//Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on('file-handled', ()=>{
  fileToOpen = null;
});

app.on('will-finish-launching', ()=>{
  app.on('open-file', (event, path)=>{
    event.preventDefault();
    fileToOpen = path;
  
    if (mainWindow) {
      mainWindow.send('open-file', path);
    }
  })
})

app.on('ready', ()=>{
  // autoUpdater.checkForUpdates();
  appUpdater();
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.maximize();
  mainWindow.loadURL('http://localhost:3000/');
  //Dummy comment to test auto-updater

  mainWindow.webContents.openDevTools();
});

//For Mac's where app has not quit even if all windows are 'closed'
app.on('activate', ()=>{
  if (mainWindow === null) { 
    createMainWindow(); 
  } 
});

//TODO Set up crash reporter
process.on('uncaughtException', (err)=>{
  console.log(`Application exited with error: ${err}`);
});

//Quit app if all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});
