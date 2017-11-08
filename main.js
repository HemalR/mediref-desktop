const { app, BrowserWindow, ipcMain } = require("electron");
const { appUpdater } = require("./appUpdater");
const fs = require("fs");
const mime = require("mime");
const path = require("path");
const log = require("electron-log");

let mainWindow = null;

global.fileToOpen = null; //Declare a global empty object variable to hold file path if a file is opened while the app is closed

//Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on("file-handled", () => {
  fileToOpen = null;
});

//Takes in a file path, reads the file, assigns it to the global fileToOpen and then emits an event if windown open
function handleFilePath(filePath) {
  mainWindow.send("Updater", "Began handleFilePath line 18 of main.js");
  const name = path.basename(filePath);
  mainWindow.send("Updater", `Filename is ${name}`);
  const type = mime.getType(filePath);
  mainWindow.send("Updater", `Filetype is ${type}`);
  const data = fs.readFileSync(filePath, "base64");
  const fileData = { name, data, type, path: filePath };
  fileToOpen = fileData;
  if (mainWindow) {
    mainWindow.send("open-file", fileData);
  }
  mainWindow.send("Updater", "Ending handleFilePath line 35 of main.js");
  return fileData;
}

app.on("will-finish-launching", () => {
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    handleFilePath(filePath);
  });
});

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      preload: __dirname + "/preload.js"
    }
  });

   var filePath = process.argv[1];
   if(filePath != undefined){
     handleFilePath(filePath);
   }

  mainWindow.maximize();
  mainWindow.loadURL("https://dev5.mediref.com.au/new");

  appUpdater(mainWindow);

  setTimeout(() => {
    let version = app.getVersion();
    mainWindow.send("Updater", `You are running v${version}`);
  }, 5000);

  mainWindow.webContents.openDevTools();
});

//For Mac's where app has not quit even if all windows are 'closed'
app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

//TODO Set up crash reporter
process.on("uncaughtException", err => {
  console.log(`Application exited with error: ${err}`);
});

//Quit app if all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});
