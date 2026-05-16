/* Adjust panel — HSL / OKLCH slider adjustments applied to the full palette. */

// ── State ─────────────────────────────────────────────────────────────────────

const adjustBtn   = document.getElementById('adjust-btn');
const adjustPanel = document.getElementById('adjust-panel');
let adjustBase    = [];
let isAdjusting   = false;

// ── Sliders ───────────────────────────────────────────────────────────────────

const sliders = {
  hue: { el: document.getElementById('sl-hue'), val: document.getElementById('hue-val'), fill: document.getElementById('hue-fill') },
  sat: { el: document.getElementById('sl-sat'), val: document.getElementById('sat-val'), fill: document.getElementById('sat-fill') },
  bri: { el: document.getElementById('sl-bri'), val: document.getElementById('bri-val'), fill: document.getElementById('bri-fill') },
  tmp: { el: document.getElementById('sl-tmp'), val: document.getElementById('tmp-val'), fill: document.getElementById('tmp-fill') },
};

let adjustColorMode = 'hsl';

// ── Preview ───────────────────────────────────────────────────────────────────

function previewAdjustments() {
  const hue = +sliders.hue.el.value, sat = +sliders.sat.el.value;
  const bri = +sliders.bri.el.value, tmp = +sliders.tmp.el.value;
  const els = document.querySelectorAll('.swatch');
  adjustBase.forEach((hex, i) => {
    const adjusted = adjustColorMode === 'oklch'
      ? applyAdjustmentsOklch(hex, hue, sat, bri, tmp)
      : applyAdjustments(hex, hue, sat, bri, tmp);
    swatches[i].hex = adjusted;
    applySwatch(els[i], adjusted);
  });
}

function setAdjustColorMode(m) {
  adjustColorMode = m;
  document.querySelectorAll('#adjust-panel .cm-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cm === m);
  });
  document.getElementById('adj-sat-label').textContent = m === 'oklch' ? 'Chroma'    : 'Saturation';
  document.getElementById('adj-bri-label').textContent = m === 'oklch' ? 'Lightness' : 'Brightness';
  const hueTrack = document.getElementById('adj-hue-track');
  if (m === 'oklch') {
    const stops = Array.from({length: 13}, (_, i) => oklchToHex(OKLCH_HUE_TRACK_L, OKLCH_HUE_TRACK_C, i * OKLCH_HUE_STEP)).join(',');
    hueTrack.style.background = `linear-gradient(to right,${stops})`;
  } else {
    hueTrack.style.background = '';
  }
  previewAdjustments();
}

function resetSliders() { Object.values(sliders).forEach(s => { s.el.value = 0; updateFill(s); }); }

// ── Sync with palette re-render ───────────────────────────────────────────────

function syncAdjustWithPalette() {
  if (!isAdjusting) return;
  adjustBase = swatches.map(s => s.hex);
  document.querySelectorAll('.swatch').forEach((el, i) => {
    el.querySelector('.swatch-original-bg').style.backgroundColor = adjustBase[i];
  });
  previewAdjustments();
}

// ── Open / close ──────────────────────────────────────────────────────────────

function openAdjustPanel() {
  closeOklchPanel(false);
  adjustBase = swatches.map(s => s.hex);
  resetSliders();
  setAdjustColorMode('hsl');
  document.querySelectorAll('.swatch').forEach((el, i) => {
    el.querySelector('.swatch-original-bg').style.backgroundColor = adjustBase[i];
  });
  isAdjusting = true;
  document.getElementById('palette').classList.add('adjusting');
  adjustPanel.classList.add('open');
  adjustBtn.classList.add('active');
  document.getElementById('export-panel').classList.remove('open');
}

function closeAdjustPanel() {
  isAdjusting = false;
  document.getElementById('palette').classList.remove('adjusting');
  adjustPanel.classList.remove('open');
  adjustBtn.classList.remove('active');
}

// ── Event bindings ────────────────────────────────────────────────────────────

adjustBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (adjustPanel.classList.contains('open')) {
    swatches.forEach((sw, i) => { sw.hex = adjustBase[i]; applySwatch(document.querySelectorAll('.swatch')[i], sw.hex); });
    closeAdjustPanel();
  } else {
    openAdjustPanel();
  }
});

Object.values(sliders).forEach(s => {
  s.el.addEventListener('input', () => { updateFill(s); previewAdjustments(); });
});

document.getElementById('adjust-cancel').addEventListener('click', () => {
  swatches.forEach((sw, i) => { sw.hex = adjustBase[i]; applySwatch(document.querySelectorAll('.swatch')[i], sw.hex); });
  closeAdjustPanel();
});

document.getElementById('adjust-apply').addEventListener('click', () => {
  pushHistory(); closeAdjustPanel(); updateURL(); showToast('Adjustments applied');
});

document.addEventListener('click', () => {
  if (adjustPanel.classList.contains('open')) {
    swatches.forEach((sw, i) => { sw.hex = adjustBase[i]; applySwatch(document.querySelectorAll('.swatch')[i], sw.hex); });
    closeAdjustPanel();
  }
});
adjustPanel.addEventListener('click', e => e.stopPropagation());

document.querySelectorAll('#adjust-panel .cm-btn').forEach(btn => {
  btn.addEventListener('click', () => setAdjustColorMode(btn.dataset.cm));
});

Object.values(sliders).forEach(s => updateFill(s));
