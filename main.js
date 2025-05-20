// main.js (Complete)

const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron-store with default settings
const store = new Store({
    defaults: {
        widgetPosition: { x: undefined, y: undefined },
        widgetMode: 'on-top-click-through', // 'on-top-interactive', 'on-top-click-through', 'standard-click-through'
        textColor: '#FFFFFF',
        backgroundColor: 'rgba(40, 0, 80, 0.8)',
        fontSettings: {
            family: 'Arial, sans-serif',
            timeSize: '3.5em',
            dateSize: '1.3em',
            timeWeight: 'bold',
            dateWeight: 'normal',
            timeStyle: 'normal',
            dateStyle: 'normal',
        },
        hrLineSettings: {
            visible: true,
            color: '#FFFFFF',
            opacity: 0.5,
            thickness: '1px',
            length: '70%' // Customizable HR line length
        },
        dateTimeFormats: {
            timeFormat: 'HH:mm:ss',
            dateFormat: 'dddd, MMMM D',
        },
        isWidgetLocked: true, // True if click-through/not adjusting
        autoResizeEnabled: true, // For widget auto-resizing
        widgetSize: { width: 350, height: 200 }, // Stored/default widget size
        widgetLayout: { // Customizable spacing for the widget
            containerPadding: '10px 15px',
            timeMarginBottom: '3px',
            dateMarginTop: '3px',
            dateMarginBottom: '5px',
            hrMarginVertical: '3px'
        }
    }
});

// Global references to windows and tray
let widgetWindow;
let settingsWindow;
let tray;
let isAdjustingPosition = false; // Tracks if the widget is in "Adjust Position" mode

// Icon paths
const ICONS_DIR = path.join(__dirname, 'assets');
const TRAY_ICON_FILENAME = process.platform === 'win32' ? 'icon.ico' : 'icon.png'; // OS-specific tray icon
const TRAY_ICON_PATH = path.join(ICONS_DIR, TRAY_ICON_FILENAME);

// Function to create the main widget window
function createWidgetWindow() {
    const savedPosition = store.get('widgetPosition');
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const initialSize = store.get('widgetSize');

    widgetWindow = new BrowserWindow({
        width: initialSize.width,
        height: initialSize.height,
        x: savedPosition.x === undefined ? Math.round(screenWidth * 0.75) : savedPosition.x,
        y: savedPosition.y === undefined ? Math.round(screenHeight * 0.1) : savedPosition.y,
        frame: false,
        transparent: true,
        skipTaskbar: true,
        useContentSize: true, // Width and height set the web page size
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            // devTools: true // Uncomment for debugging the widget window
        },
    });

    applyWidgetBehavior(store.get('widgetMode'), store.get('isWidgetLocked')); // Apply initial behavior
    widgetWindow.loadFile('index.html');

    // Uncomment to open DevTools for the widget window automatically
    // if (process.env.NODE_ENV !== 'production') { // Example: Open only in development
    //    widgetWindow.webContents.openDevTools({ mode: 'detach' });
    // }

    // Save position when moved
    widgetWindow.on('moved', () => {
        if (widgetWindow) { // Check if window still exists
            const [x, y] = widgetWindow.getPosition();
            store.set('widgetPosition', { x, y });
        }
    });

    // Save size if manually resized (and auto-resize is off)
    widgetWindow.on('resize', () => {
        if (widgetWindow && !widgetWindow.isDestroyed() && store.get('autoResizeEnabled') === false) {
            const [width, height] = widgetWindow.getSize();
            store.set('widgetSize', { width, height });
        }
    });

    widgetWindow.on('closed', () => {
        widgetWindow = null;
    });
}

// Function to create the settings window
function createSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 650, // Adjusted for modern UI
        height: 850, // Adjusted for modern UI and more settings
        modal: false, 
        frame: true, // Standard window controls
        title: 'Widget Settings',
        webPreferences: {
            preload: path.join(__dirname, 'settingsPreload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            // devTools: true // Uncomment for debugging the settings window
        },
    });

    // Hide the menu bar for the settings window for a cleaner dialog look
    settingsWindow.setMenuBarVisibility(false); 
    // Alternatively, to completely remove its menu: settingsWindow.removeMenu();

    settingsWindow.loadFile('settings.html');

    // Uncomment to open DevTools for the settings window automatically
    // if (process.env.NODE_ENV !== 'production') {
    //    settingsWindow.webContents.openDevTools({ mode: 'detach' });
    // }
    
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

// Function to build the tray icon's context menu
function buildTrayMenu() {
    const currentWidgetMode = store.get('widgetMode');
    // "Adjust Position" is relevant for modes that can be click-through
    const isClickThroughCapableMode = currentWidgetMode === 'on-top-click-through' || currentWidgetMode === 'standard-click-through';

    const template = [
        { label: 'Settings', click: createSettingsWindow },
        { type: 'separator' },
        {
            label: isAdjustingPosition ? 'Lock Position' : 'Adjust Position',
            enabled: isClickThroughCapableMode, // Only enable for relevant modes
            click: () => { if (isClickThroughCapableMode) toggleAdjustPositionMode(); },
        },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() },
    ];
    return Menu.buildFromTemplate(template);
}

// Function to create the tray icon
function createTray() {
    try {
        tray = new Tray(TRAY_ICON_PATH);
    } catch (error) {
        console.error("Failed to create primary tray icon:", error);
        try { // Fallback icon path
            tray = new Tray(path.join(app.getAppPath(), 'assets', 'icon.png')); // Adjust if your assets structure differs
        } catch (fallbackError) {
            console.error("Fallback tray icon also failed. Tray not created.", fallbackError);
            return; // Critical failure if tray cannot be created
        }
    }
    tray.setToolTip('Clock Widget');
    tray.setContextMenu(buildTrayMenu());
}

// Function to toggle the "Adjust Position" mode for the widget
function toggleAdjustPositionMode() {
    isAdjustingPosition = !isAdjustingPosition;
    store.set('isWidgetLocked', !isAdjustingPosition); // Update stored lock state

    if (widgetWindow && !widgetWindow.isDestroyed()) {
        if (isAdjustingPosition) { // Entering adjust mode
            widgetWindow.setFocusable(true);
            widgetWindow.setIgnoreMouseEvents(false); // Make it interactive
            widgetWindow.webContents.send('enter-adjust-position-mode');
        } else { // Exiting adjust mode (locking position)
            applyWidgetBehavior(store.get('widgetMode'), true); // Re-apply behavior, ensuring it's locked
            widgetWindow.webContents.send('exit-adjust-position-mode');
        }
    }
    if (tray) tray.setContextMenu(buildTrayMenu()); // Update tray menu label
}

// --- Electron App Lifecycle ---
app.whenReady().then(() => {
    createTray();
    createWidgetWindow();

    app.on('activate', () => { // macOS specific
        if (BrowserWindow.getAllWindows().length === 0) {
            if (!tray) createTray(); // Recreate tray if needed (though usually persists)
            createWidgetWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') { // Quit app if not on macOS
        app.quit();
    }
});

// --- IPC Handlers ---
// Get all current settings
ipcMain.handle('get-settings', () => {
    return { ...store.store }; // Spread all properties from the store
});

// Save settings received from the settings window
ipcMain.handle('save-settings', (event, settingsFromRenderer) => {
    // Iterate over received settings and update store to ensure new sub-properties are also saved
    for (const key in settingsFromRenderer) {
        if (Object.hasOwnProperty.call(settingsFromRenderer, key)) {
             // Update existing keys or add new ones if they came from settings
            store.set(key, settingsFromRenderer[key]);
        }
    }

    // Specific logic for widgetSize based on autoResizeEnabled
    if (settingsFromRenderer.widgetSize && settingsFromRenderer.autoResizeEnabled === false) {
        store.set('widgetSize', settingsFromRenderer.widgetSize);
    }
    
    // Determine lock state based on the new mode and current adjust state
    let currentWidgetMode = store.get('widgetMode'); // Use the newly saved mode
    let lockState = currentWidgetMode !== 'on-top-interactive' && !isAdjustingPosition; // Preserve adjust state unless mode forces interactive
    store.set('isWidgetLocked', lockState);
    isAdjustingPosition = !lockState; // Sync module-level variable

    // Apply changes to the widget window
    if (widgetWindow && !widgetWindow.isDestroyed()) {
        applyWidgetBehavior(currentWidgetMode, store.get('isWidgetLocked'));
        widgetWindow.webContents.send('settings-updated', { ...store.store }); // Send all updated settings

        // If auto-resize is off, and a manual size was given, apply it now
        if (store.get('autoResizeEnabled') === false && store.get('widgetSize')) {
             widgetWindow.setSize(store.get('widgetSize').width, store.get('widgetSize').height, true); // Animate resize
        }
    }
    if (tray) tray.setContextMenu(buildTrayMenu()); // Update tray menu state
    return { success: true };
});

// Handle resize requests from the widget renderer
ipcMain.handle('request-resize', (event, newWidth, newHeight) => {
    // console.log(`Main: RX resize request for ${newWidth.toFixed(1)}w x ${newHeight.toFixed(1)}h`); // Debugging
    if (widgetWindow && !widgetWindow.isDestroyed() && store.get('autoResizeEnabled')) {
        const currentSize = widgetWindow.getSize();
        const primaryDisplay = screen.getPrimaryDisplay().workAreaSize;

        // Validate and sanitize input dimensions
        const normalizedNewWidth = typeof newWidth === 'number' && !isNaN(newWidth) ? Math.round(newWidth) : currentSize[0];
        const normalizedNewHeight = typeof newHeight === 'number' && !isNaN(newHeight) ? Math.round(newHeight) : currentSize[1];

        const targetWidth = Math.min(Math.max(normalizedNewWidth, 100), primaryDisplay.width * 0.9); // Min/Max width
        const targetHeight = Math.min(Math.max(normalizedNewHeight, 50), primaryDisplay.height * 0.9); // Min/Max height
        
        // console.log(`Main: Current: ${currentSize[0]}x${currentSize[1]}, Target Calc: ${targetWidth}x${targetHeight}`); // Debugging

        // Resize only if there's a significant difference to prevent jitter
        if (Math.abs(currentSize[0] - targetWidth) > 2 || Math.abs(currentSize[1] - targetHeight) > 2) {
            // console.log(`Main: Applying resize to ${targetWidth}x${targetHeight}`); // Debugging
            widgetWindow.setSize(targetWidth, targetHeight, false); // No animation for quicker programmatic resize
            store.set('widgetSize', { width: targetWidth, height: targetHeight }); // Save the new auto-calculated size
            return { success: true, resizedTo: { width: targetWidth, height: targetHeight } };
        }
        // console.log(`Main: No significant size change needed for widget.`); // Debugging
        return { success: false, reason: "No significant size change." };
    }
    // console.log(`Main: Resize not performed. AutoResize: ${store.get('autoResizeEnabled')}, Window valid: ${!!widgetWindow && !widgetWindow.isDestroyed()}`); // Debugging
    return { success: false, reason: "Auto-resize disabled or widget window unavailable." };
});

// Apply widget behavior based on mode and lock state
function applyWidgetBehavior(mode, isCurrentlyLocked) {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;

    isAdjustingPosition = !isCurrentlyLocked; // Sync module-level state

    let ignoreMouse = isCurrentlyLocked;
    let focusable = !isCurrentlyLocked;
    let alwaysOnTopLevel = 'screen-saver'; // Default for click-through on-top
    let alwaysOnTopFlag = true;

    switch (mode) {
        case 'on-top-interactive':
            ignoreMouse = false;
            focusable = true;
            alwaysOnTopLevel = 'floating'; // Suitable for interactive always-on-top windows
            break;
        case 'standard-click-through':
            alwaysOnTopFlag = false; // Not always on top
            // ignoreMouse and focusable determined by isCurrentlyLocked
            break;
        case 'on-top-click-through':
            // ignoreMouse and focusable determined by isCurrentlyLocked
            // alwaysOnTopLevel default ('screen-saver') is fine
            break;
        default: // Fallback to a safe, locked state
            console.warn(`Unknown widget mode: ${mode}. Falling back to default.`);
            store.set('isWidgetLocked', true); // Force lock for unknown mode
            isAdjustingPosition = false;
            ignoreMouse = true;
            focusable = false;
    }

    widgetWindow.setAlwaysOnTop(alwaysOnTopFlag, alwaysOnTopLevel);
    widgetWindow.setFocusable(focusable);
    widgetWindow.setIgnoreMouseEvents(ignoreMouse, { forward: ignoreMouse }); // Forward mouse events if click-through

    if (tray) tray.setContextMenu(buildTrayMenu());
    else console.warn("applyWidgetBehavior: Tray not initialized when trying to update context menu.");
}

// IPC for fine-grained mouse event control from renderer (advanced use)
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.setIgnoreMouseEvents(ignore, options);
    }
});