https://www.excelsiorjet.com/kb/34/howto-digitally-sign-executables-and-installers-produced-by-excelsior-jet

# Signing

signtool sign /f certificate-file
/p password
/t timestamp-server-URL
file-to-sign-1 file-to-sign-2 ...

Example:

    C:\temp> signtool sign /f MyCert.p12 /p SeCRetpASsw0rd /t http://timestamp.comodoca.com/authenticode MyApp.exe

# Auto-updating

Extra info:

- https://docs.github.com/en/free-pro-team@latest/github/administering-a-repository/managing-releases-in-a-repository

1. Ensure that package.json new updated version SemVer is higher than the version on Github
2. (Optional) Draft a new release on Github (if skipped, step 1 and 3 will automatically create one)
3. `npm run pub` - `electron-builder --mac --win --x64 --ia32 -p always`
4. Release when ready

# Log locations

From https://github.com/megahertz/electron-log#readme

- MacOS: ~/Library/Logs/<app name>/log.log
- Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log

# package.json settings to determine install location

For installs into AppData automatically

```
    "nsis": {
      "oneClick": true,
      "runAfterFinish": true,
      "allowToChangeInstallationDirectory": false
    }
```

For installs that ask the user for install location (and allow them to set C:/Program Files as the location):

```
    "nsis": {
      "oneClick": false,
      "runAfterFinish": true,
      "allowToChangeInstallationDirectory": true
    }
```

# Creating a NOVA installer from scratch

1. Download and install the OEM
2. Run the cobranding tool
3. Configuration files page

- Use the license files sent by Nova/on Google Drive
- Keep the rest of the options as their default settings

2. OEM Save parameters page

- For local save option, default is C:\Users\[U]\Mediref-Printer-PDFs
- The [U] so that each user has their own folder
- Username and password should be blank
- File should be [N] (the document name)
- When file exists, auto number the new file

3. OEM Run parameters - specify either Program Files as the application path (if installed for all users) or user macros to specify AppData as the install location

- For all users, "C:\Program Files\Mediref\Mediref.exe"
- Parameters - %1
- Blank username and password
- Run as "normal"
- Run type "Run from shell"

3. Digitally sign the OEM and PrinterDrivers (instructions above)

4. Download Inno setup from JRSoftware.org

- Use the mainsetup.iss script to generate a single combined installer

# Different installers naming conventions to follow

# Version numbers

# Testing

All functionality of the app (user facing and background) is predicated with a comment with the info tag: `// info

## Main

- Mac
  - Does the printer functionality work when app is closed
  - Does the printer functionality work when app is open (including not launching additional browser windows)
  - Ensure closing the window quits the app entirely, or if not, that a new windows is properly created when the 'activate' event fires
  - Does auto update work?
- Windows - Appdata
  - Does the printer functionality work when app is closed
  - Does the printer functionality work when app is open (including not launching additional browser windows)
  - Does the temp folder get cleared properly
  - Does auto update work?
- Windows - Program Files
  - Does the printer functionality work when app is closed
  - Does the printer functionality work when app is open (including not launching additional browser windows)
  - Does auto update work?
- Do additional args get passed on - recipient email, patient name etc
- Does viewing files work (non-PDFs)
- Does viewing PDFs work
- Does the react app receive app data (e.g. version etc). `handle-electron-version` event

## Misc

- `./src/handleDownload.js` - `handleDownload` function - download to default downloads directory if set to 'auto' or
- Does the context menu apply correctly
- Does the preload script load correctly so that the react app has access to required modules (e.g. ipcRenderer)
- Does the logger work to log whatever is needed to local disk for debugging purposes
