'use strict';
const fs = require('fs');
const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const log = require('electron-log');

function appUpdater(mainWindow) {
	// Don't initiate auto-updates in development and on Linux system
	// since autoUpdater doesn't work on Linux
	if (isDev || process.platform === 'linux') {
		return;
	}

	// Log whats happening
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	log.info('App starting...');

	autoUpdater.logger = log;

	function sendStatusToWindow(text) {
		log.info(text);
		if (mainWindow) {
			mainWindow.send('Updater', text);
		}
	}

	autoUpdater.on('checking-for-update', () => {
		sendStatusToWindow('Checking for update...');
	});
	autoUpdater.on('update-available', info => {
		sendStatusToWindow('Update available.');
	});
	autoUpdater.on('update-not-available', info => {
		sendStatusToWindow('Update not available.');
	});
	autoUpdater.on('error', err => {
		log.info(err);
		sendStatusToWindow(`Error in auto-updater.`);
	});
	autoUpdater.on('download-progress', progressObj => {
		let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
		log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
		log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
		sendStatusToWindow(log_message);
	});

	// Ask the user to restart if an update is available
	autoUpdater.on('update-downloaded', event => {
		dialog.showMessageBox(
			{
				type: 'question',
				buttons: ['Install and Relaunch', 'Install Later'],
				defaultId: 0,
				message: `A new update ${event.version} has been downloaded`,
				detail: 'It will be installed the next time you restart the application',
			},
			response => {
				if (response === 0) {
					setTimeout(() => {
						autoUpdater.quitAndInstall();
						// force app to quit. This is just a workaround, ideally autoUpdater.quitAndInstall() should relaunch the app.
						app.quit();
					}, 1000);
				}
			}
		);
	});
	// Init for updates
	autoUpdater.checkForUpdates();
}

module.exports = {
	appUpdater,
};
