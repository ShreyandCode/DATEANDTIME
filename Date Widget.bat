@echo off
cd /d "%~dp0"
echo Initializing Electron Widget...

:: Run the script silently using WScript
wscript.exe "%~dp0hide-electron.vbs"

exit
