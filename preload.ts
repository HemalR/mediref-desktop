import { contextBridge, ipcRenderer } from 'electron';

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
