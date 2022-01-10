import { contextBridge, ipcRenderer } from 'electron';
// window.remote = require('@electron/remote'); //To allow access to main process from webapp. E.g. To retrieve files set when app was not open

contextBridge.exposeInMainWorld('ipcRenderer', {
	on(eventName: string, callback: (...args: any[]) => void) {
		ipcRenderer.on(eventName, callback);
	},
	send: ipcRenderer.send,
});

// Todo: Migrate to a more specific/narrow use case of contextBridge. See: https://www.electronjs.org/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('medirefDesktopAPI', {
	ping() {
		console.log('Ping the Mediref API');
	},
});
