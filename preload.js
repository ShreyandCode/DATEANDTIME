const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_event, value) => callback(value)),
    setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    onEnterAdjustPositionMode: (callback) => ipcRenderer.on('enter-adjust-position-mode', () => callback()),
    onExitAdjustPositionMode: (callback) => ipcRenderer.on('exit-adjust-position-mode', () => callback()),
    requestWidgetResize: (width, height) => ipcRenderer.invoke('request-resize', width, height)
});