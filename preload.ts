import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ipcRenderer', {
	on(eventName: string, callback: (...args: any[]) => void) {
		ipcRenderer.on(eventName, callback);
	},
	send: ipcRenderer.send,
	removeListener: ipcRenderer.removeListener,
});

// Todo: Migrate to a more specific/narrow use case of contextBridge. See: https://www.electronjs.org/docs/latest/tutorial/context-isolation
contextBridge.exposeInMainWorld('medirefDesktopAPI', {
	viewPdf(url: string, filename: string) {
		ipcRenderer.send('view-pdf', url, filename);
	},
	handleAppMounted() {
		ipcRenderer.send('app-mounted');
	},
	downloadFile(fileData: { url: string; downloadLocationPreference: string; fullName: string }) {
		ipcRenderer.send('download-file', fileData);
	},
	loadUrl(url: string) {
		ipcRenderer.send('load-url', url);
	},
	loadDev() {
		ipcRenderer.send('load-dev');
	},
	loadStaging() {
		ipcRenderer.send('load-staging');
	},
	clearTemp() {
		ipcRenderer.send('clear-temp');
	},
});
