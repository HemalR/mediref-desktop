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
  
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.maximize();
  mainWindow.loadURL('http://localhost:3000/');
  // appUpdater(mainWindow);

  setTimeout(()=>{
    let version = app.getVersion();
    mainWindow.send('Updater', `You are running v${version}`);
    autoUpdater.checkForUpdates()
    .then(res=>{
      mainWindow.send('Updater', 'Checked for updates');		
    });
  
  autoUpdater.on('update-downloaded', event => {
    mainWindow.send('Updater', 'Update downloaded');
    // Ask user to update the app
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Install and Relaunch', 'Install Later'],
      defaultId: 0,
      message: `A new update ${event.version} has been downloaded`,
      detail: 'It will be installed the next time you restart the application'
    }, response => {
      if (response === 0) {
        setTimeout(() => {
          autoUpdater.quitAndInstall();
          // force app to quit. This is just a workaround, ideally autoUpdater.quitAndInstall() should relaunch the app.
          app.quit();
        }, 1000);
      }
    });
  });  
  mainWindow.send('Updater', 'End of set timeout');  
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
