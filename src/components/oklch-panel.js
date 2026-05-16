/* OKLCH generation panel — perceptual palette generation via L/C/H sliders. */

// ── State ─────────────────────────────────────────────────────────────────────

let oklchBase = [];

const oklchPanel = document.getElementById('oklch-panel');
const oklchSliders = {
  l: { el: document.getElementById('sl-oklch-l'), val: document.getElementById('oklch-l-val'), fill: document.getElementById('oklch-l-fill') },
  c: { el: document.getElementById('sl-oklch-c'), val: document.getElementById('oklch-c-val'), fill: document.getElementById('oklch-c-fill') },
  h: { el: document.getElementById('sl-oklch-h'), val: document.getElementById('oklch-h-val'), fill: document.getElementById('oklch-h-fill') },
};

// ── Slider sync ───────────────────────────────────────────────────────────────

function updateOklchFills() {
  const pct = (el, min, max) => ((el.value - min) / (max - min) * 100).toFixed(1) + '%';
  oklchSliders.l.fill.style.left = '0'; oklchSliders.l.fill.style.width = pct(oklchSliders.l.el, 10, 90);
  oklchSliders.c.fill.style.left = '0'; oklchSliders.c.fill.style.width = pct(oklchSliders.c.el, 0, 35);
  oklchSliders.h.fill.style.left = '0'; oklchSliders.h.fill.style.width = pct(oklchSliders.h.el, 0, 359);
}

function syncOklchSliders() {
  oklchSliders.l.el.value = Math.round(oklchParams.L * 100);
  oklchSliders.c.el.value = Math.round(oklchParams.C * 100);
  oklchSliders.h.el.value = Math.round(oklchParams.H);
  oklchSliders.l.val.textContent = oklchSliders.l.el.value;
  oklchSliders.c.val.textContent = oklchSliders.c.el.value;
  oklchSliders.h.val.textContent = oklchSliders.h.el.value;
  updateOklchFills();
}

// ── Scale UI ──────────────────────────────────────────────────────────────────

const oklchScaleLabels = {
  hue:       { l: 'Lightness', c: 'Chroma',  h: 'Hue start' },
  lightness: { l: 'L center',  c: 'Chroma',  h: 'Hue'       },
  chroma:    { l: 'Lightness', c: 'C max',   h: 'Hue'       },
};

function updateOklchScaleUI() {
  const lbl = oklchScaleLabels[oklchParams.scale];
  document.getElementById('oklch-l-label').textContent = lbl.l;
  document.getElementById('oklch-c-label').textContent = lbl.c;
  document.getElementById('oklch-h-label').textContent = lbl.h;
  oklchPanel.querySelectorAll('.dir-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scale === oklchParams.scale);
  });
}

// ── Preview ───────────────────────────────────────────────────────────────────

function previewOklch() {
  oklchParams.L = oklchSliders.l.el.value / 100;
  oklchParams.C = oklchSliders.c.el.value / 100;
  oklchParams.H = +oklchSliders.h.el.value;
  oklchSliders.l.val.textContent = oklchSliders.l.el.value;
  oklchSliders.c.val.textContent = oklchSliders.c.el.value;
  oklchSliders.h.val.textContent = oklchSliders.h.el.value;
  updateOklchFills();
  const newColors = generatePalette(swatches.length);
  const els = document.querySelectorAll('.swatch');
  swatches.forEach((sw, i) => { sw.hex = newColors[i]; applySwatch(els[i], sw.hex); });
}

// ── Open / close ──────────────────────────────────────────────────────────────

function openOklchPanel() {
  oklchBase = swatches.map(s => ({ ...s }));
  const target = (oklchParams.scale === 'lightness' || oklchParams.scale === 'chroma') ? SCALE_DEFAULT_COUNT : swatches.length;
  if (swatches.length !== target) { setSwatches(Array.from({ length: target }, () => ({ hex: PLACEHOLDER_HEX }))); renderPalette(); }
  syncOklchSliders(); updateOklchScaleUI(); previewOklch();
  oklchPanel.classList.add('open');
}

function closeOklchPanel(revert) {
  if (revert && oklchBase.length) { setSwatches(oklchBase.map(s => ({ ...s }))); renderPalette(); }
  oklchPanel.classList.remove('open');
}

// ── Event bindings ────────────────────────────────────────────────────────────

oklchPanel.querySelectorAll('.dir-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    oklchParams.scale = btn.dataset.scale;
    updateOklchScaleUI();
    const target = (oklchParams.scale === 'lightness' || oklchParams.scale === 'chroma') ? SCALE_DEFAULT_COUNT : swatches.length;
    if (swatches.length !== target) { setSwatches(Array.from({ length: target }, () => ({ hex: PLACEHOLDER_HEX }))); renderPalette(); }
    previewOklch();
  });
});

Object.values(oklchSliders).forEach(s => s.el.addEventListener('input', previewOklch));

document.getElementById('oklch-cancel').addEventListener('click', () => closeOklchPanel(true));
document.getElementById('oklch-apply').addEventListener('click', () => { pushHistory(); closeOklchPanel(false); updateURL(); showToast('Applied'); });
oklchPanel.addEventListener('click', e => e.stopPropagation());

// Hue gradient on generation panel hue track
(function() {
  const stops = Array.from({length: 13}, (_, i) => oklchToHex(OKLCH_HUE_TRACK_L, OKLCH_HUE_TRACK_C, i * OKLCH_HUE_STEP)).join(',');
  document.getElementById('oklch-gen-hue-track').style.background = `linear-gradient(to right,${stops})`;
})();
