const { BrowserWindow } = require('electron');
const electronDl = require('electron-dl');
const mime = require('mime');

function getExt(name) {
	const parts = name.split('.');
	return parts[parts.length - 1];
}

async function handleDownload(_e, { url, downloadLocationPreference, fullName }) {
	const win = BrowserWindow.getFocusedWindow();
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
		contents.session.on('will-download', (_event, item) => {
			const type = mime.getType(fullName);
			const ext = getExt(fullName);
			const options = {
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

module.exports = { handleDownload };
