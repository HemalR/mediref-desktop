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

- Use the license files sent by Nova/on Google Drive
- For local save option, default is C:\Users\[U]\Documents\
  The [U] so that each user has their own folder
- OEM Run parameters - specify either Program Files as the application path (if installed for all users) or user macros to specify AppData as the install location
- Digitally sign the OEM and PrinterDrivers (instructions above)

3. Download Inno setup from JRSoftware.org

- Use the mainsetup.iss script to generate a single combined installer

# Different installers naming conventions to follow

# Version numbers
