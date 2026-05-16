/* Color picker — HSV gradient picker. */

// ── State ─────────────────────────────────────────────────────────────────────

let cpIdx      = null;
let cpOnChange = null;
let cpH = 0, cpS = 100, cpV = 100, cpA = 100;
let cpDragging = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const cpEl      = document.getElementById('color-picker');
const cpArea    = document.getElementById('cp-area');
const cpCursor  = document.getElementById('cp-cursor');
const cpHueEl   = document.getElementById('cp-hue');
const cpHexEl   = document.getElementById('cp-hex');
const cpPreview = document.getElementById('cp-preview');
const cpTextEl  = document.getElementById('cp-color-text');

// ── UI update ─────────────────────────────────────────────────────────────────

function cpUpdateUI(skipHex) {
  const [r, g, b] = hsvToRgb(cpH, cpS, cpV);
  const hex = cpRgbToHex(r, g, b);
  cpArea.style.setProperty('--cp-h', cpH);
  cpCursor.style.left = cpS + '%';
  cpCursor.style.top  = (100 - cpV) + '%';
  if (!skipHex) cpHexEl.value = hex.toUpperCase();
  cpPreview.style.background = hex;
  if (document.activeElement !== cpTextEl)
    cpTextEl.value = `rgba(${r}, ${g}, ${b}, ${(cpA / 100).toFixed(2)})`;
  cpTextEl.classList.remove('invalid');
  if (cpOnChange) {
    cpOnChange(hex);
  } else if (cpIdx !== null) {
    // DOM check for panel state to avoid coupling
    const adjusting   = document.getElementById('adjust-panel')?.classList.contains('open');
    const contrasting = document.getElementById('contrast-panel')?.classList.contains('open');
    if (!adjusting && !contrasting) {
      swatches[cpIdx].hex = hex;
      applySwatch(document.querySelectorAll('.swatch')[cpIdx], hex);
      updateURL();
    }
  }
}

function cpSetFromPointer(e) {
  const rect = cpArea.getBoundingClientRect();
  cpS = Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width))  * 100;
  cpV = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)) * 100;
  cpUpdateUI();
}

// ── Open / close ──────────────────────────────────────────────────────────────

function openPicker(idx, triggerEl, onchange) {
  cpOnChange = onchange || null;
  if (typeof idx === 'number') {
    pushHistory(); cpIdx = idx;
    [cpH, cpS, cpV] = rgbToHsv(...cpHexToRgb(swatches[idx].hex));
  } else {
    cpIdx = null;
    [cpH, cpS, cpV] = rgbToHsv(...cpHexToRgb(idx || PICKER_DEFAULT_HEX));
  }
  cpA = 100; cpHueEl.value = cpH; cpUpdateUI(); cpEl.classList.add('open');
  requestAnimationFrame(() => {
    const rect = triggerEl.getBoundingClientRect();
    const pw = cpEl.offsetWidth, ph = cpEl.offsetHeight;
    let left = rect.left + rect.width / 2 - pw / 2;
    let top  = rect.top - ph - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    top  = top < 8 ? rect.bottom + 10 : top;
    cpEl.style.left = left + 'px'; cpEl.style.top = top + 'px';
  });
}

function closePicker() { cpEl.classList.remove('open'); cpIdx = null; cpOnChange = null; }

// ── Event bindings ────────────────────────────────────────────────────────────

cpArea.addEventListener('mousedown', e => { cpDragging = true; cpSetFromPointer(e); e.preventDefault(); });
document.addEventListener('mousemove', e => { if (cpDragging) cpSetFromPointer(e); });
document.addEventListener('mouseup',   () => { cpDragging = false; });

cpHueEl.addEventListener('input', () => { cpH = +cpHueEl.value; cpUpdateUI(); });

cpHexEl.addEventListener('input', () => {
  let v = cpHexEl.value.trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (/^#[0-9a-f]{6}$/i.test(v)) { [cpH, cpS, cpV] = rgbToHsv(...cpHexToRgb(v)); cpUpdateUI(true); }
});

cpTextEl.addEventListener('input', () => {
  const parsed = cpParseText(cpTextEl.value);
  if (!parsed) { cpTextEl.classList.add('invalid'); return; }
  cpTextEl.classList.remove('invalid');
  const [r, g, b, a] = parsed;
  cpA = Math.max(0, Math.min(100, a));
  [cpH, cpS, cpV] = rgbToHsv(Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)));
  cpUpdateUI();
});

document.getElementById('cp-copy').addEventListener('click',      () => { navigator.clipboard.writeText(cpHexEl.value); showToast('Hex copied!'); });
document.getElementById('cp-copy-rgba').addEventListener('click', () => { navigator.clipboard.writeText(cpTextEl.value); showToast('RGBA copied!'); });

document.addEventListener('click', e => {
  if (cpEl.classList.contains('open') && !cpEl.contains(e.target) && !e.target.closest('.pick-btn, .pb-color-btn'))
    closePicker();
});
cpEl.addEventListener('click', e => e.stopPropagation());
