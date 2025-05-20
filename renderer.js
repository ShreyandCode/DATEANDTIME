// renderer.js (Widget Logic - Complete)

const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const widgetContainer = document.getElementById('widget-container');
const hrTop = document.getElementById('hr-top');
const hrBottom = document.getElementById('hr-bottom');
const adjustModeIndicator = document.getElementById('adjust-mode-indicator');

let currentDateTimeFormats = {
    timeFormat: 'HH:mm:ss',     // Default
    dateFormat: 'dddd, MMMM D'  // Default
};
let currentAutoResizeEnabled = true; // Default
let resizeTimeout = null;

// --- Helper: Format Date/Time ---
function formatDateTime(date, formatString) {
    if (!formatString || typeof formatString !== 'string') {
        console.warn("Invalid format string provided to formatDateTime, using ISO as fallback.");
        return date.toISOString();
    }
    // Using a parts object for cleaner replacements
    const parts = {
        H: String(date.getHours()),
        HH: String(date.getHours()).padStart(2, '0'),
        h: String(date.getHours() % 12 || 12), // 0 becomes 12 for 12hr format
        hh: String((date.getHours() % 12 || 12)).padStart(2, '0'),
        m: String(date.getMinutes()),
        mm: String(date.getMinutes()).padStart(2, '0'),
        s: String(date.getSeconds()),
        ss: String(date.getSeconds()).padStart(2, '0'),
        A: date.getHours() < 12 ? 'AM' : 'PM',
        a: date.getHours() < 12 ? 'am' : 'pm',
        D: String(date.getDate()),
        DD: String(date.getDate()).padStart(2, '0'),
        M: String(date.getMonth() + 1), // Month is 0-indexed
        MM: String(date.getMonth() + 1).padStart(2, '0'),
        MMM: date.toLocaleDateString(undefined, { month: 'short' }),
        MMMM: date.toLocaleDateString(undefined, { month: 'long' }),
        YY: String(date.getFullYear()).slice(-2),
        YYYY: String(date.getFullYear()),
        d: String(date.getDay()), // Day of week (0=Sun, 1=Mon, ...)
        // For 'dd', 'ddd', 'dddd', toLocaleDateString is quite reliable
        dd: date.toLocaleDateString(undefined, { weekday: 'short' }).substring(0,2), // Heuristic, might not be universally "min"
        ddd: date.toLocaleDateString(undefined, { weekday: 'short' }),
        dddd: date.toLocaleDateString(undefined, { weekday: 'long' }),
    };
    // Regex ensures longer tokens are replaced first (e.g., MMMM before M)
    return formatString.replace(/MMMM|MMM|MM|M|YYYY|YY|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|A|a|DD|D/g, match => parts[match] || match);
}

// --- Update displayed time and date ---
function updateTime() {
    const now = new Date();
    if(timeEl) timeEl.textContent = formatDateTime(now, currentDateTimeFormats.timeFormat);
    if(dateEl) dateEl.textContent = formatDateTime(now, currentDateTimeFormats.dateFormat);

    // If auto-resize is enabled, debounce the resize request
    if (currentAutoResizeEnabled) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(requestResizeBasedOnContent, 150); // Debounce for 150ms
    }
}

// --- Request widget resize based on content ---
async function requestResizeBasedOnContent() {
    if (!widgetContainer || !timeEl || !dateEl || !hrTop || !hrBottom || !window.electronAPI) {
        console.warn("requestResizeBasedOnContent: One or more essential DOM elements or electronAPI are missing.");
        return;
    }
    
    try {
        await document.fonts.ready; // Wait for custom fonts defined in CSS to load
        // console.log("Fonts are ready for measurement."); // For debugging font loading
    } catch (e) {
        console.error("Error occurred while waiting for document.fonts.ready:", e);
    }

    // Wait for the next animation frame to ensure DOM updates (like text changes) are rendered
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    console.log("--- Calculating Size for Resize Request ---");

    let requiredHeight = 0;
    let requiredWidth = 0;
    const elementsToMeasure = [
        { el: hrTop, key: "hrTop" },
        { el: timeEl, key: "timeEl" },
        { el: dateEl, key: "dateEl" },
        { el: hrBottom, key: "hrBottom" }
    ];

    elementsToMeasure.forEach(item => {
        // Only measure visible elements
        if (item.el.style.display !== 'none') {
            const rect = item.el.getBoundingClientRect();
            const style = getComputedStyle(item.el);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            
            console.log(`Elem: ${item.key}, Visible: ${item.el.style.display}, Height: ${rect.height.toFixed(1)}, Width: ${rect.width.toFixed(1)}, MT: ${marginTop.toFixed(1)}, MB: ${marginBottom.toFixed(1)}`);
            requiredHeight += rect.height + marginTop + marginBottom;
            requiredWidth = Math.max(requiredWidth, rect.width);
        } else {
            console.log(`Elem: ${item.key} is hidden (display: ${item.el.style.display})`);
        }
    });
    
    // Add container and body paddings
    const containerStyle = getComputedStyle(widgetContainer);
    const bodyStyle = getComputedStyle(document.body);

    const containerPaddingV = (parseFloat(containerStyle.paddingTop) || 0) + (parseFloat(containerStyle.paddingBottom) || 0);
    const containerPaddingH = (parseFloat(containerStyle.paddingLeft) || 0) + (parseFloat(containerStyle.paddingRight) || 0);
    const bodyPaddingV = (parseFloat(bodyStyle.paddingTop) || 0) + (parseFloat(bodyStyle.paddingBottom) || 0);
    const bodyPaddingH = (parseFloat(bodyStyle.paddingLeft) || 0) + (parseFloat(bodyStyle.paddingRight) || 0);

    console.log(`Paddings - ContainerV: ${containerPaddingV.toFixed(1)}, ContainerH: ${containerPaddingH.toFixed(1)}, BodyV: ${bodyPaddingV.toFixed(1)}, BodyH: ${bodyPaddingH.toFixed(1)}`);

    requiredHeight += containerPaddingV + bodyPaddingV;
    requiredWidth += containerPaddingH + bodyPaddingH;
    
    // Add a small buffer for insurance / rendering inconsistencies
    requiredHeight += 4; 
    requiredWidth += 4;

    console.log(`Renderer: Calculated final size to send: ${requiredWidth.toFixed(1)}w x ${requiredHeight.toFixed(1)}h`);
    
    try {
        const result = await window.electronAPI.requestWidgetResize(requiredWidth, requiredHeight);
        if (result && result.success) {
            // console.log("Renderer: Resize request successful, main resized to:", result.resizedTo);
        } else if (result) {
            console.log("Renderer: Resize not performed by main process:", result.reason);
        }
    } catch (e) {
        console.error("Renderer: Error during requestWidgetResize IPC call:", e);
    }
    console.log("--- End of Size Calculation ---");
}

// --- Apply settings received from main process ---
function applySettings(settings) {
    if (!settings) {
        console.error("applySettings received undefined settings object.");
        return;
    }
    // console.log("Applying settings in renderer:", settings); // For deep debugging

    // General Appearance
    document.body.style.setProperty('--text-color', settings.textColor || '#FFFFFF');
    document.body.style.setProperty('--background-color', settings.backgroundColor || 'rgba(0,0,0,0.5)');

    // Font Settings
    if (settings.fontSettings) {
        document.body.style.setProperty('--font-family', settings.fontSettings.family || 'Arial, sans-serif');
        if(timeEl) {
            timeEl.style.fontSize = settings.fontSettings.timeSize || '3.5em';
            timeEl.style.fontWeight = settings.fontSettings.timeWeight || 'bold';
            timeEl.style.fontStyle = settings.fontSettings.timeStyle || 'normal';
        }
        if(dateEl) {
            dateEl.style.fontSize = settings.fontSettings.dateSize || '1.3em';
            dateEl.style.fontWeight = settings.fontSettings.dateWeight || 'normal';
            dateEl.style.fontStyle = settings.fontSettings.dateStyle || 'normal';
        }
    }

    // HR Line Settings (including custom length)
    if (settings.hrLineSettings) {
        const display = settings.hrLineSettings.visible !== undefined ? (settings.hrLineSettings.visible ? 'block' : 'none') : 'block'; // Default to visible if undefined
        if (hrTop) hrTop.style.display = display;
        if (hrBottom) hrBottom.style.display = display;
        
        document.body.style.setProperty('--hr-line-color', settings.hrLineSettings.color || settings.textColor || '#FFFFFF'); // Fallback to textColor
        document.body.style.setProperty('--hr-line-opacity', settings.hrLineSettings.opacity !== undefined ? settings.hrLineSettings.opacity : 0.5);
        document.body.style.setProperty('--hr-line-thickness', settings.hrLineSettings.thickness || '1px');
        
        const hrLength = settings.hrLineSettings.length || '70%'; // Custom HR line length
        if (hrTop) hrTop.style.width = hrLength;
        if (hrBottom) hrBottom.style.width = hrLength;
    }

    // Widget Layout/Spacing
    if (settings.widgetLayout && widgetContainer && timeEl && dateEl && hrTop && hrBottom) {
        widgetContainer.style.padding = settings.widgetLayout.containerPadding || '10px 15px';
        timeEl.style.marginBottom = settings.widgetLayout.timeMarginBottom || '3px';
        // Use explicit dateMarginTop if set, otherwise derive from timeMarginBottom for symmetry
        dateEl.style.marginTop = settings.widgetLayout.dateMarginTop || settings.widgetLayout.timeMarginBottom || '3px';
        dateEl.style.marginBottom = settings.widgetLayout.dateMarginBottom || '5px';
        const hrMargin = `${settings.widgetLayout.hrMarginVertical || '3px'} auto`;
        hrTop.style.margin = hrMargin;
        hrBottom.style.margin = hrMargin;
    }

    // Date & Time Formats
    if (settings.dateTimeFormats) {
        currentDateTimeFormats.timeFormat = settings.dateTimeFormats.timeFormat || 'HH:mm:ss';
        currentDateTimeFormats.dateFormat = settings.dateTimeFormats.dateFormat || 'dddd, MMMM D';
    }

    // Auto Resize Toggle
    currentAutoResizeEnabled = settings.autoResizeEnabled !== undefined ? settings.autoResizeEnabled : true;
    
    // Critical: Update text content *after* all styles that affect font/size/spacing are applied.
    // Then, if auto-resize is on, it will measure the newly styled and content-filled elements.
    updateTime(); 
    
    // Adjust Mode Indicator
    const showIndicator = !settings.isWidgetLocked &&
                          (settings.widgetMode === 'on-top-click-through' || settings.widgetMode === 'standard-click-through');
    if(adjustModeIndicator) {
        adjustModeIndicator.style.display = showIndicator ? 'block' : 'none';
    }
    if(widgetContainer) {
        if(showIndicator) {
            widgetContainer.classList.add('adjusting');
        } else {
            widgetContainer.classList.remove('adjusting');
        }
    }
}

// --- Initial Setup and Event Listeners ---
async function loadInitialSettings() {
    try {
        const settings = await window.electronAPI.getSettings();
        if (settings) {
            console.log("Initial settings successfully loaded in renderer:", settings);
            applySettings(settings);
        } else {
            console.error("Failed to load initial settings: Received null or undefined from main process.");
        }
    } catch (e) {
        console.error("Error during loadInitialSettings IPC call:", e);
    }
}

// Ensure DOM is ready before trying to access elements and load settings
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadInitialSettings);
} else {
    loadInitialSettings(); // DOMContentLoaded has already fired
}

setInterval(updateTime, 1000); // Main update interval for time/date

window.electronAPI.onSettingsUpdated((settings) => {
    // console.log('Renderer: settings-updated event received from main.', settings); // For debugging
    if (settings) {
        applySettings(settings);
    } else {
        console.warn("Renderer: Received undefined settings in onSettingsUpdated.");
    }
});

window.electronAPI.onEnterAdjustPositionMode(() => {
    if(adjustModeIndicator) adjustModeIndicator.style.display = 'block';
    if(widgetContainer) widgetContainer.classList.add('adjusting');
});

window.electronAPI.onExitAdjustPositionMode(() => {
    if(adjustModeIndicator) adjustModeIndicator.style.display = 'none';
    if(widgetContainer) widgetContainer.classList.remove('adjusting');
});