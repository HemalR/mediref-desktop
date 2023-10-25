import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['Updater', 'open-file', 'handle-electron-version'];

contextBridge.exposeInMainWorld('medirefDesktopAPI', {
	receive(channel: string, func: (...args: any[]) => void) {
		if (validChannels.includes(channel)) {
			// Deliberately strip event as it includes `sender`
			const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args);
			ipcRenderer.on(channel, subscription);
			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		}
	},
	ping() {
		ipcRenderer.send('ping');
	},
	fileHandled() {
		ipcRenderer.send('file-handled');
	},
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
