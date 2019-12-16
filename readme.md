https://www.excelsiorjet.com/kb/34/howto-digitally-sign-executables-and-installers-produced-by-excelsior-jet

#Signing
signtool sign /f certificate-file
/p password
/t timestamp-server-URL
file-to-sign-1 file-to-sign-2 ...

Example:

    C:\temp> signtool sign /f MyCert.p12 /p SeCRetpASsw0rd /t http://timestamp.comodoca.com/authenticode MyApp.exe

#Auto-updating

1. Ensure that package.json new updated version SemVer is higher than the version on Github
2.

#Log locations

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