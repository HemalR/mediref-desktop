const {app, BrowserWindow, ipcMain} = require('electron');
const {autoUpdater} = require("electron-updater");
const log = require('electron-log');
const fs = require('fs');

//Logging update stuff
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

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
function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.send('Updater', text);
}
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  log.info(err);
  sendStatusToWindow(`Error in auto-updater.`);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded; will install now');
  autoUpdater.quitAndInstall();
});
app.on('ready', ()=>{
  
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.maximize();
  mainWindow.loadURL('http://localhost:3000/');

  autoUpdater.checkForUpdates();
  setTimeout(()=>{
    let version = app.getVersion();
    mainWindow.send('Updater', `You are running v${version}`);  
  }, 5000)

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
