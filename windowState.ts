import { app, BrowserWindow } from 'electron';
const path = require('path');
const fs = require('fs');

const userDataPath = app.getPath('userData');
const windowStateFile = path.join(userDataPath, 'windowState.json');

type WindowState = { width: number; height: number; x?: number; y?: number };

export function getWindowState(): WindowState {
	try {
		const data = fs.readFileSync(windowStateFile, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		// Return default values if the file does not exist or is invalid
		return { width: 800, height: 600 };
	}
}

export function saveWindowState(mainWindow: null | Electron.BrowserWindow) {
	if (mainWindow) {
		const { width, height, x, y } = mainWindow.getBounds();
		const windowState: WindowState = { width, height, x, y };
		fs.writeFileSync(windowStateFile, JSON.stringify(windowState));
	}
}
