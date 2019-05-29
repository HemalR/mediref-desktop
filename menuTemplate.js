// const menuTemplate = [
// 	{
// 		label: 'Mediref',
// 		submenu: [
// 			{ label: 'About Mediref', selector: 'orderFrontStandardAboutPanel:' },
// 			{ type: 'separator' },
// 			{
// 				label: 'Quit',
// 				accelerator: 'CmdOrCtrl+Q',
// 				click: function() {
// 					app.quit();
// 				},
// 			},
// 		],
// 	},
// 	{
// 		label: 'Edit',
// 		submenu: [
// 			{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
// 			{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
// 			{ type: 'separator' },
// 			{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
// 			{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
// 			{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
// 			{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
// 		],
// 	},
// ];

// module.exports = { menuTemplate };

const { Menu } = require("electron");

function setMenu(app) {
  const template = [
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteandmatchstyle" },
        { role: "delete" },
        { role: "selectall" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }]
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click() {
            require("electron").shell.openExternal(
              "http://support.mediref.com.au"
            );
          }
        }
      ]
    }
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services", submenu: [] },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    });

    // Edit menu
    template[1].submenu.push(
      { type: "separator" },
      {
        label: "Speech",
        submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
      }
    );

    // Window menu
    template[3].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { setMenu };
