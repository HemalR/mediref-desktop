import { BrowserWindow } from 'electron';
import electronDl from 'electron-dl';
import mime from 'mime';

function getExt(name: string) {
	const parts = name.split('.');
	return parts[parts.length - 1];
}

export async function handleDownload(
	_e: Electron.IpcMainEvent,
	{ url, downloadLocationPreference, fullName }: { url: string; downloadLocationPreference: string; fullName: string }
) {
	const win = BrowserWindow.getFocusedWindow();
	if (!win) return;
	if (downloadLocationPreference === 'auto') {
		return await electronDl.download(win, url, {
			openFolderWhenDone: true,
			filename: fullName,
		});
	}
	if (downloadLocationPreference === 'ask') {
		const contents = win.webContents;
		contents.downloadURL(url);
		// https://electronjs.org/docs/api/dialog#dialogshowsavedialogbrowserwindow-options-callback
		contents.session.on('will-download', (_event: any, item) => {
			const type = mime.getType(fullName) || '';
			const ext = getExt(fullName);
			const options: Electron.SaveDialogOptions = {
				defaultPath: fullName, // defaultPath String (optional) - Absolute directory path, absolute file path, or file name to use by default.
				buttonLabel: 'Save', // String (optional) - Custom label for the confirmation button, when left empty the default label will be used.
				filters: [
					{ name: type, extensions: [ext] },
					{ name: 'All files', extensions: ['*'] },
				], // https://electronjs.org/docs/api/structures/file-filter
			};
			item.setSaveDialogOptions(options);
		});
	}
}
