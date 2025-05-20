// --- UI Element References ---
const widgetModeSelect = document.getElementById('widgetMode'); const textColorInput = document.getElementById('textColor');
const backgroundColorInput = document.getElementById('backgroundColor'); const backgroundAlphaSlider = document.getElementById('backgroundAlpha');
const autoResizeEnabledCheckbox = document.getElementById('autoResizeEnabled'); const manualSizeGroupDiv = document.getElementById('manualSizeGroup');
const widgetWidthInput = document.getElementById('widgetWidth'); const widgetHeightInput = document.getElementById('widgetHeight');
const fontFamilyInput = document.getElementById('fontFamily'); const timeFontSizeInput = document.getElementById('timeFontSize');
const timeFontWeightSelect = document.getElementById('timeFontWeight'); const timeFontStyleSelect = document.getElementById('timeFontStyle');
const dateFontSizeInput = document.getElementById('dateFontSize'); const dateFontWeightSelect = document.getElementById('dateFontWeight');
const dateFontStyleSelect = document.getElementById('dateFontStyle'); const showHrLinesCheckbox = document.getElementById('showHrLines');
const hrLineColorInput = document.getElementById('hrLineColor'); const hrLineOpacitySlider = document.getElementById('hrLineOpacity');
const hrLineThicknessInput = document.getElementById('hrLineThickness');
const hrLineLengthInput = document.getElementById('hrLineLength'); // Added for HR line length
const timeFormatInput = document.getElementById('timeFormatInput');
const dateFormatInput = document.getElementById('dateFormatInput'); const toggleFormatInfoSpan = document.getElementById('toggleFormatInfo');
const formatLegendContentDiv = document.getElementById('formatLegendContent');
const widgetContainerPaddingInput = document.getElementById('widgetContainerPadding');
const timeMarginBottomInput = document.getElementById('timeMarginBottom'); const dateMarginTopInput = document.getElementById('dateMarginTop');
const dateMarginBottomInput = document.getElementById('dateMarginBottom'); const hrMarginVerticalInput = document.getElementById('hrMarginVertical');
const saveButton = document.getElementById('saveButton'); const statusMessage = document.getElementById('statusMessage');

function hexToRgba(hex, alpha) { if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) hex = '#000000'; const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${alpha})`; }
function rgbaToHexAlpha(rgba) { if (!rgba || !rgba.startsWith('rgba')) return { hex: '#280050', alpha: 0.8 }; const p = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/); if (p.length < 4) return { hex: '#280050', alpha: 0.8 }; const r = parseInt(p[0]), g = parseInt(p[1]), b = parseInt(p[2]), a = parseFloat(p[3]); const cTH = c => (c.toString(16).length === 1 ? "0" + c.toString(16) : c.toString(16)); return { hex: "#" + cTH(r) + cTH(g) + cTH(b), alpha: isNaN(a) ? 0.8 : a }; }
function toggleManualSizeUI(show) { if (manualSizeGroupDiv) manualSizeGroupDiv.style.display = show ? 'flex' : 'none'; }

if (autoResizeEnabledCheckbox) autoResizeEnabledCheckbox.addEventListener('change', () => toggleManualSizeUI(!autoResizeEnabledCheckbox.checked));
if (toggleFormatInfoSpan && formatLegendContentDiv) { const tA = () => { const h = formatLegendContentDiv.style.display === 'none' || !formatLegendContentDiv.classList.contains('expanded'); if (h) { formatLegendContentDiv.style.display = 'block'; setTimeout(() => formatLegendContentDiv.classList.add('expanded'), 10); toggleFormatInfoSpan.textContent = 'Hide Placeholders'; } else { formatLegendContentDiv.classList.remove('expanded'); toggleFormatInfoSpan.textContent = 'Show Placeholders'; setTimeout(() => { if (!formatLegendContentDiv.classList.contains('expanded')) formatLegendContentDiv.style.display = 'none'; }, 500); } }; toggleFormatInfoSpan.addEventListener('click', tA); toggleFormatInfoSpan.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tA(); } }); }

async function loadSettings() {
    try {
        const s = await window.settingsAPI.getSettings(); if (!s) { console.error("Settings undefined in loadSettings."); if(statusMessage)statusMessage.textContent = "Error: Load failed."; return; }
        if (widgetModeSelect) widgetModeSelect.value = s.widgetMode || 'on-top-click-through'; if (textColorInput) textColorInput.value = s.textColor || '#FFF';
        if (backgroundColorInput && backgroundAlphaSlider) { const bg = rgbaToHexAlpha(s.backgroundColor); backgroundColorInput.value = bg.hex; backgroundAlphaSlider.value = bg.alpha; }
        if (autoResizeEnabledCheckbox) autoResizeEnabledCheckbox.checked = s.autoResizeEnabled !== undefined ? s.autoResizeEnabled : true;
        if (s.widgetSize && widgetWidthInput && widgetHeightInput) { widgetWidthInput.value = s.widgetSize.width || 350; widgetHeightInput.value = s.widgetSize.height || 200; }
        toggleManualSizeUI(autoResizeEnabledCheckbox ? !autoResizeEnabledCheckbox.checked : false);
        if (s.fontSettings) { if (fontFamilyInput) fontFamilyInput.value = s.fontSettings.family || 'Arial'; if (timeFontSizeInput) timeFontSizeInput.value = s.fontSettings.timeSize || '3.5em'; if (timeFontWeightSelect) timeFontWeightSelect.value = s.fontSettings.timeWeight || 'bold'; if (timeFontStyleSelect) timeFontStyleSelect.value = s.fontSettings.timeStyle || 'normal'; if (dateFontSizeInput) dateFontSizeInput.value = s.fontSettings.dateSize || '1.3em'; if (dateFontWeightSelect) dateFontWeightSelect.value = s.fontSettings.dateWeight || 'normal'; if (dateFontStyleSelect) dateFontStyleSelect.value = s.fontSettings.dateStyle || 'normal'; }
        
        if (s.hrLineSettings) { // MODIFIED to load hrLineSettings.length
            if (showHrLinesCheckbox) showHrLinesCheckbox.checked = s.hrLineSettings.visible !== undefined ? s.hrLineSettings.visible : true;
            if (hrLineColorInput) hrLineColorInput.value = s.hrLineSettings.color || '#FFF';
            if (hrLineOpacitySlider) hrLineOpacitySlider.value = s.hrLineSettings.opacity !== undefined ? s.hrLineSettings.opacity : 0.5;
            if (hrLineThicknessInput) hrLineThicknessInput.value = s.hrLineSettings.thickness || '1px';
            if (hrLineLengthInput) hrLineLengthInput.value = s.hrLineSettings.length || '70%'; // Load length
        } else {
             if (showHrLinesCheckbox) showHrLinesCheckbox.checked = true; if (hrLineColorInput) hrLineColorInput.value = '#FFF';
             if (hrLineOpacitySlider) hrLineOpacitySlider.value = 0.5; if (hrLineThicknessInput) hrLineThicknessInput.value = '1px';
             if (hrLineLengthInput) hrLineLengthInput.value = '70%'; // Default length
        }

        if (s.dateTimeFormats) { if (timeFormatInput) timeFormatInput.value = s.dateTimeFormats.timeFormat || 'HH:mm:ss'; if (dateFormatInput) dateFormatInput.value = s.dateTimeFormats.dateFormat || 'dddd, MMMM D'; }
        if (s.widgetLayout) { if (widgetContainerPaddingInput) widgetContainerPaddingInput.value = s.widgetLayout.containerPadding || '10px 15px'; if (timeMarginBottomInput) timeMarginBottomInput.value = s.widgetLayout.timeMarginBottom || '3px'; if (dateMarginTopInput) dateMarginTopInput.value = s.widgetLayout.dateMarginTop || '3px'; if (dateMarginBottomInput) dateMarginBottomInput.value = s.widgetLayout.dateMarginBottom || '5px'; if (hrMarginVerticalInput) hrMarginVerticalInput.value = s.widgetLayout.hrMarginVertical || '3px';
        } else { if (widgetContainerPaddingInput) widgetContainerPaddingInput.value = '10px 15px'; if (timeMarginBottomInput) timeMarginBottomInput.value = '3px'; if (dateMarginTopInput) dateMarginTopInput.value = '3px'; if (dateMarginBottomInput) dateMarginBottomInput.value = '5px'; if (hrMarginVerticalInput) hrMarginVerticalInput.value = '3px'; }
    } catch (e) { console.error("Load settings err:", e); if(statusMessage)statusMessage.textContent = "Error load."; }
}

if (saveButton) saveButton.addEventListener('click', async () => {
    if (!backgroundColorInput || !backgroundAlphaSlider) { console.error("BG inputs missing."); return; }
    const bgCol = hexToRgba(backgroundColorInput.value, parseFloat(backgroundAlphaSlider.value));
    const settingsToSave = {
        widgetMode: widgetModeSelect ? widgetModeSelect.value : 'on-top-click-through', textColor: textColorInput ? textColorInput.value : '#FFF', backgroundColor: bgCol,
        autoResizeEnabled: autoResizeEnabledCheckbox ? autoResizeEnabledCheckbox.checked : true,
        widgetSize: { width: widgetWidthInput ? (parseInt(widgetWidthInput.value, 10) || 350) : 350, height: widgetHeightInput ? (parseInt(widgetHeightInput.value, 10) || 200) : 200 },
        fontSettings: { family: fontFamilyInput ? fontFamilyInput.value : 'Arial', timeSize: timeFontSizeInput ? timeFontSizeInput.value : '3.5em', timeWeight: timeFontWeightSelect ? timeFontWeightSelect.value : 'bold', timeStyle: timeFontStyleSelect ? timeFontStyleSelect.value : 'normal', dateSize: dateFontSizeInput ? dateFontSizeInput.value : '1.3em', dateWeight: dateFontWeightSelect ? dateFontWeightSelect.value : 'normal', dateStyle: dateFontStyleSelect ? dateFontStyleSelect.value : 'normal', },
        hrLineSettings: { // MODIFIED to save hrLineSettings.length
            visible: showHrLinesCheckbox ? showHrLinesCheckbox.checked : true,
            color: hrLineColorInput ? hrLineColorInput.value : '#FFF',
            opacity: hrLineOpacitySlider ? parseFloat(hrLineOpacitySlider.value) : 0.5,
            thickness: hrLineThicknessInput ? hrLineThicknessInput.value : '1px',
            length: hrLineLengthInput ? hrLineLengthInput.value.trim() || '70%' : '70%', // Save length
        },
        dateTimeFormats: { timeFormat: timeFormatInput ? timeFormatInput.value : 'HH:mm:ss', dateFormat: dateFormatInput ? dateFormatInput.value : 'dddd, MMMM D' },
        widgetLayout: { containerPadding: widgetContainerPaddingInput ? widgetContainerPaddingInput.value.trim() || '10px 15px' : '10px 15px', timeMarginBottom: timeMarginBottomInput ? timeMarginBottomInput.value.trim() || '3px' : '3px', dateMarginTop: dateMarginTopInput ? dateMarginTopInput.value.trim() || '3px' : '3px', dateMarginBottom: dateMarginBottomInput ? dateMarginBottomInput.value.trim() || '5px' : '5px', hrMarginVertical: hrMarginVerticalInput ? hrMarginVerticalInput.value.trim() || '3px' : '3px', }
    };
    try {
        const res = await window.settingsAPI.saveSettings(settingsToSave);
        if (statusMessage) { if (res && res.success) { statusMessage.textContent = "Settings saved!"; statusMessage.style.color = 'var(--accent-primary)'; setTimeout(() => statusMessage.textContent = "", 3000); } else { statusMessage.textContent = "Failed save."; statusMessage.style.color = '#E06C75'; } }
    } catch (e) { console.error("Save error:", e); if (statusMessage) { statusMessage.textContent = "Error save: " + e.message; statusMessage.style.color = '#E06C75'; } }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSettings); else loadSettings();