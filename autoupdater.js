'use strict';
const fs = require('fs');
const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

// const ConfigUtil = require('./../renderer/js/utils/config-util.js');

function appUpdater(win) {
	// Don't initiate auto-updates in development and on Linux system
	// since autoUpdater doesn't work on Linux
	if (isDev || process.platform === 'linux') {
		return;
	}

	// Create Logs directory
	// const LogsDir = `${app.getPath('userData')}/Logs`;

	// if (!fs.existsSync(LogsDir)) {
	// 	fs.mkdirSync(LogsDir);
	// }

	// Log whats happening
	// const log = require('electron-log');

	// log.transports.file.file = `${LogsDir}/updates.log`;
	// log.transports.file.level = 'info';
	// autoUpdater.logger = log;

	// Handle auto updates for beta/pre releases
	// autoUpdater.allowPrerelease = ConfigUtil.getConfigItem('betaUpdate') || false;

	// Ask the user if update is available
	// eslint-disable-next-line no-unused-vars
	// Init for updates
	autoUpdater.checkForUpdates()
		.then(res=>{
			win.send('Updater', 'Checked for updates');		
		});

	autoUpdater.on('update-downloaded', event => {
		win.send('Updater', 'Update downloaded');
		// Ask user to update the app
		dialog.showMessageBox({
			type: 'question',
			buttons: ['Install and Relaunch', 'Install Later'],
			defaultId: 0,
			message: `A new update ${event.version} has been downloaded`,
			detail: 'It will be installed the next time you restart the application'
		}, response => {
			if (response === 0) {
				setTimeout(() => {
					autoUpdater.quitAndInstall();
					// force app to quit. This is just a workaround, ideally autoUpdater.quitAndInstall() should relaunch the app.
					app.quit();
				}, 1000);
			}
		});
	});
}

module.exports = {
	appUpdater
};