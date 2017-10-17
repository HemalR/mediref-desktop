const {app, BrowserWindow, ipcMain} = require('electron');
const {appUpdater} = require('./appUpdater');
const fs = require('fs');

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

  appUpdater(mainWindow);
  
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
