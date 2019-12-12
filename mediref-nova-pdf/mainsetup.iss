#define MyAppName "Mediref"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "Mediref"
#define MyAppURL "https://www.mediref.com.au/"
#define MedirefPrinterDriver "MedirefPrinterDriver(x64).msi";
#define MedirefPrinter "MedirefPrinter(x64).msi";

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{EF6E46F5-1C1F-462F-8BCE-062908993054}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

;Installed in Program files.
DefaultDirName={commonpf}\Mediref-Printer-Setup

DisableProgramGroupPage=yes

;The path where the installer is after compile
OutputDir=C:\output-dir

;The installer name after compilation
OutputBaseFilename="mediref-printer-setup-ts"

Compression=lzma
; SignTool
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "{#MedirefPrinterDriver}"; DestDir: "{tmp}"; Flags: ignoreversion deleteafterinstall
Source: "{#MedirefPrinter}"; DestDir: "{tmp}"; Flags: ignoreversion deleteafterinstall

[Run]
Filename: "{tmp}\{#MedirefPrinterDriver}"; Verb: open; Flags:shellexec waituntilterminated skipifdoesntexist; StatusMsg: "Installing Mediref printer driver"
Filename: "{tmp}\{#MedirefPrinter}"; Verb: open; Flags:shellexec waituntilterminated skipifdoesntexist; StatusMsg: "Installing Mediref printer"

