window.ipcRenderer = require('electron').ipcRenderer; //To send and receive events from electron
window.remote = require('electron').remote; //To allow access to main process from webapp. E.g. To retrieve files set when app was not open
