const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const mime = require("mime");
const path = require("path");
const log = require("electron-log");
const isDev = require("electron-is-dev");
const { appUpdater } = require("./appUpdater");
const platform = require("./platform");
const { setMenu } = require("./menuTemplate");

require("electron-context-menu")();

let mainWindow = null;

global.fileToOpen = null; //Declare a global empty object variable to hold file path if a file is opened while the app is closed
global.gp = null;

//Clear the global fileToOpen variable once Mediref app renderer process has handled the file
ipcMain.on("file-handled", () => {
  fileToOpen = null;
});

//Takes in a file path, reads the file, assigns it to the global fileToOpen and then emits an event if window open
function handleFilePath(filePath) {
  gp = filePath;
  const name = path.basename(filePath);
  const type = mime.getType(filePath);
  const data = fs.readFileSync(filePath, "base64");
  const fileData = { name, data, type, path: filePath };
  fileToOpen = fileData;
  if (mainWindow) {
    mainWindow.send("open-file", fileData);
    const statusToSend = `File path to upload: ${filePath}`;
    log.info(statusToSend);
    mainWindow.send("Updater", statusToSend);
  }
  return fileData;
}

//@hemal deprecated? https://electronjs.org/docs/all#appmakesingleinstance
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    console.log(commandLine[2]);
    const filePath = commandLine[2];
    if (filePath != undefined) {
      handleFilePath(filePath);
    }
  }
});

if (shouldQuit) {
  app.quit();
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
  if (platform.isWindows) {
    const filePath = process.argv[2];
    if (filePath != undefined) {
      handleFilePath(filePath);
    }
  }
  mainWindow.maximize();

  // if (isDev) {
  // 	mainWindow.loadURL('http://localhost:3000/');
  // 	mainWindow.webContents.openDevTools();
  // } else {
  // 	mainWindow.loadURL('https://new.mediref.com.au/new');
  // }
  mainWindow.loadURL("http://localhost:3000/");

  appUpdater(mainWindow);

  setTimeout(() => {
    let version = app.getVersion();
    mainWindow.send("Updater", `You are running v${version}`);
    mainWindow.send("Updater", `Your OS: ${platform.name}`);
  }, 5000);

  setMenu(app);
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

ipcMain.on("view-pdf", (event, url) => {
  const pdfWindow = new BrowserWindow({
    width: 1024,
    height: 800,
    webPreferences: {
      plugins: true,
      webSecurity: false
    }
  });
  pdfWindow.loadURL(url);
});

ipcMain.on("download-file", (event, downloadUrl) => {
  let contents = mainWindow.webContents;

  contents.downloadURL(downloadUrl);

  contents.session.on("will-download", (event, item, contents) => {
    // const options = {
    //   filters: [
    //     { name: "Images", extensions: ["jpg", "png", "gif"] },
    //     { name: "Movies", extensions: ["mkv", "avi", "mp4"] },
    //     { name: "Custom File Type", extensions: ["as"] },
    //     { name: "All Files", extensions: ["*"] }
    //   ]
    // };
    // item.setSaveDialogOptions(options);

    item.on("updated", (event, state) => {
      if (state === "interrupted") {
        console.log("Download is interrupted but can be resumed");
      } else if (state === "progressing") {
        if (item.isPaused()) {
          console.log("Download is paused");
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    });
    item.once("done", (event, state) => {
      if (state === "completed") {
        console.log("Download successfully");
      } else {
        console.log(`Download failed: ${state}`);
      }
      console.log(item.getSavePath());
      console.log(item.getURL());
    });
  });
});
// let win = new BrowserWindow();

//downloadOptions allows user to select where to download file, if set to false, autodownloads to default folder.
// const downloadOptions = { saveAs: true, openFolderWhenDone: true };
// const win = BrowserWindow.getFocusedWindow();
// download(win, downloadUrl, downloadOptions)
//   .then(dl => console.log(dl.getSavePath()))
//   .catch(console.error);

// ipcMain.on("download-files", function(event, urlArray) {
//   const downloadOptions = { saveAs: false, openFolderWhenDone: true };
//   const win = BrowserWindow.getFocusedWindow();

//   for (let i = 0; i < urlArray.length; i++) {
//     download(win, urlArray[i], downloadOptions)
//       .then(dl => console.log(dl.getSavePath()))
//       .catch(console.error);
//   }
// });
