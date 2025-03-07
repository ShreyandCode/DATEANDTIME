const { app, BrowserWindow, screen } = require('electron');

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const taskbarHeight = screen.getPrimaryDisplay().bounds.height - height; // Get taskbar height
    const y = height - 350; // Place window as low as possible without overlapping taskbar

    const win = new BrowserWindow({
        width: 550,
        height: 350,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: false,
        focusable: false,
        skipTaskbar: true,
        x: 0, // Touching the left side
        y: y, // Bottom-most position respecting taskbar
        hasShadow: false,
        backgroundColor: '#00000000'
    });
    // Keep the window only on the desktop (below all other apps)
    win.setAlwaysOnTop(false, "desktop");

    // Ignore mouse events so it's click-through
    win.setIgnoreMouseEvents(true);

    // Load your HTML file
    win.loadFile('popup.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
