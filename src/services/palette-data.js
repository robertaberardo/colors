/* Palette data layer — state management, generation, history and URL sync. */

// ── Core state ────────────────────────────────────────────────────────────────

let mode          = 'random';
let swatches      = [];
let dragSrc       = null;
let activePalette = null;

// OKLCH generation params (owned here; mutated by oklch-panel via object ref)
const oklchParams = { ...OKLCH_DEFAULTS };

// ── State setters ─────────────────────────────────────────────────────────────

function setSwatches(arr)       { swatches      = arr; }
function setDragSrc(idx)        { dragSrc       = idx; }
function setMode(m)             { mode          = m;   }
function setActivePalette(p)    { activePalette = p;   }

// ── History ───────────────────────────────────────────────────────────────────

let historyStack = [];
let redoStack    = [];

function pushHistory() {
  historyStack.push(swatches.map(s => s.hex));
  redoStack = [];
  updateUndoRedo();
}

function updateUndoRedo() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = historyStack.length === 0;
  if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

function applyHistory(hexes) {
  swatches = hexes.map(hex => ({ hex }));
  renderPalette();
  updateURL();
  updateSelectorBtn();
}

// DOM-based panel checks — avoids tight coupling with adjust/contrast panels
function isPanelOpen(id) { return document.getElementById(id)?.classList.contains('open') ?? false; }

function undo() {
  if (isPanelOpen('adjust-panel') || isPanelOpen('contrast-panel') || historyStack.length === 0) return;
  redoStack.push(swatches.map(s => s.hex));
  applyHistory(historyStack.pop());
  updateUndoRedo();
}

function redo() {
  if (isPanelOpen('adjust-panel') || isPanelOpen('contrast-panel') || redoStack.length === 0) return;
  historyStack.push(swatches.map(s => s.hex));
  applyHistory(redoStack.pop());
  updateUndoRedo();
}

// ── URL sync ──────────────────────────────────────────────────────────────────

function parseHash() {
  const raw = window.location.hash.slice(1);
  if (!raw) return null;
  const parts = raw.split('-');
  if (parts.length < 2) return null;
  const hexes = parts.map(p => '#' + p);
  return hexes.every(h => /^#[0-9a-f]{6}$/i.test(h)) ? hexes : null;
}

function updateURL() {
  if (isPanelOpen('adjust-panel') || isPanelOpen('contrast-panel')) return;
  const hash = swatches.map(s => s.hex.slice(1).toLowerCase()).join('-');
  try { history.replaceState(null, '', '#' + hash); } catch (e) { /* blocked on file:// in some browsers */ }
}

// ── Palette generation ────────────────────────────────────────────────────────

function generatePalette(count) {
  const baseH = rand(0, 360);
  const colors = [];
  if (mode === 'analogous') {
    const baseS = rand(45, 80), baseL = rand(38, 62);
    for (let i = 0; i < count; i++) {
      const h = baseH + (i - Math.floor(count/2)) * rand(14, 22);
      const s = baseS + rand(-8, 8);
      const l = baseL + (i - Math.floor(count/2)) * rand(4, 9);
      colors.push(hslToHex(h, Math.max(20, Math.min(90, s)), Math.max(20, Math.min(82, l))));
    }
  } else if (mode === 'complementary') {
    const s = rand(40, 75), l = rand(35, 65);
    for (let i = 0; i < count; i++) {
      const offsets = [0, 180, 30, 210, 60, 150, 45, 225, 15, 195];
      const h = baseH + (offsets[i % offsets.length] || i * 37);
      colors.push(hslToHex(h, s + rand(-10,10), l + rand(-12,12)));
    }
  } else if (mode === 'triadic') {
    const s = rand(40, 72), l = rand(38, 62);
    const base = [baseH, baseH + 120, baseH + 240];
    for (let i = 0; i < count; i++) {
      const h = base[i % 3] + rand(-15, 15);
      colors.push(hslToHex(h, s + rand(-8,8), l + rand(-10,10)));
    }
  } else if (mode === 'pastel') {
    for (let i = 0; i < count; i++) {
      const h = baseH + i * rand(20, 45);
      colors.push(hslToHex(h, rand(30, 60), rand(72, 88)));
    }
  } else if (mode === 'perceptual') {
    const { L, C, H, scale } = oklchParams;
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) : 0;
      let lc, cc, hc;
      if (scale === 'lightness') {
        const lo = Math.max(0.05, L - 0.42), hi = Math.min(0.97, L + 0.42);
        lc = lo + t * (hi - lo); cc = C; hc = H;
      } else if (scale === 'chroma') {
        lc = L; cc = CHROMA_FLOOR + t * (C - CHROMA_FLOOR); hc = H;
      } else {
        lc = L; cc = C; hc = (H + t * 360) % 360;
      }
      colors.push(oklchToHex(lc, cc, hc));
    }
  } else {
    for (let i = 0; i < count; i++) {
      colors.push(hslToHex(rand(0,360), rand(30,80), rand(30,75)));
    }
  }
  return colors;
}

function generate() {
  pushHistory();
  activePalette = null;
  updateSelectorBtn();
  if (mode === 'perceptual') {
    oklchParams.L = rand(55, 72) / 100;
    oklchParams.C = rand(18, 28) / 100;
    oklchParams.H = rand(0, 359);
    syncOklchSliders();
  }
  const newColors = generatePalette(swatches.length);
  const els = document.querySelectorAll('.swatch');
  swatches.forEach((sw, i) => { sw.hex = newColors[i]; applySwatch(els[i], sw.hex); });
  updateURL();
}

// ── Swatch mutations ──────────────────────────────────────────────────────────

function insertNSwatches(afterIdx, n) {
  pushHistory();
  const hex1 = swatches[afterIdx].hex, hex2 = swatches[afterIdx + 1].hex;
  const inserts = Array.from({length: n}, (_, i) => ({ hex: interpolateOklab(hex1, hex2, (i+1)/(n+1)) }));
  swatches.splice(afterIdx + 1, 0, ...inserts);
  renderPalette(); updateURL();
}

function insertSwatch(afterIdx) {
  pushHistory();
  swatches.splice(afterIdx + 1, 0, { hex: blendHex(swatches[afterIdx].hex, swatches[afterIdx+1].hex) });
  renderPalette(); updateURL();
}

function insertSwatchAtStart() {
  pushHistory();
  const newHex = swatches.length >= 2
    ? extrapolateHex(swatches[0].hex, swatches[1].hex)
    : hslToHex(...hexToHsl(swatches[0].hex).map((v, i) => i === 0 ? (v + 30) % 360 : v));
  swatches.unshift({ hex: newHex }); renderPalette(); updateURL();
}

function insertSwatchAtEnd() {
  pushHistory();
  const n = swatches.length;
  const newHex = n >= 2
    ? extrapolateHex(swatches[n-1].hex, swatches[n-2].hex)
    : hslToHex(...hexToHsl(swatches[0].hex).map((v, i) => i === 0 ? (v + 330) % 360 : v));
  swatches.push({ hex: newHex }); renderPalette(); updateURL();
}

function deleteSwatch(idx) {
  if (swatches.length <= 2) { showToast('Need at least 2 colors'); return; }
  pushHistory();
  swatches.splice(idx, 1); renderPalette(); updateURL();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function initPalette() {
  const fromHash = parseHash();
  swatches = fromHash ? fromHash.map(hex => ({ hex })) : generatePalette(INITIAL_COUNT).map(hex => ({ hex }));
  renderPalette(); updateURL();
}
