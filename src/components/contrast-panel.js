/* Contrast panel — perceptual spread / contrast adjustment. */

// ── State ─────────────────────────────────────────────────────────────────────

const contrastBtn   = document.getElementById('contrast-btn');
const contrastPanel = document.getElementById('contrast-panel');
let contrastBase    = [];
let isContrasting   = false;

const conSlider = {
  el:   document.getElementById('sl-con'),
  val:  document.getElementById('con-val'),
  fill: document.getElementById('con-fill'),
};

// ── Preview ───────────────────────────────────────────────────────────────────

function previewContrast() {
  const strength = +conSlider.el.value;
  const els      = document.querySelectorAll('.swatch');
  const adjusted = applyContrast(contrastBase, strength);
  adjusted.forEach((hex, i) => {
    swatches[i].hex = hex;
    applySwatch(els[i], hex);
    els[i].querySelector('.swatch-original-bg').style.backgroundColor = contrastBase[i];
  });
}

// ── Sync with palette re-render ───────────────────────────────────────────────

function syncContrastWithPalette() {
  if (!isContrasting) return;
  contrastBase = swatches.map(s => s.hex);
  document.querySelectorAll('.swatch').forEach((el, i) => {
    el.querySelector('.swatch-original-bg').style.backgroundColor = contrastBase[i];
  });
  previewContrast();
}

// ── Open / close ──────────────────────────────────────────────────────────────

function openContrastPanel() {
  closeOklchPanel(false);
  contrastBase = swatches.map(s => s.hex);
  conSlider.el.value = 0; updateFill(conSlider);
  document.querySelectorAll('.swatch').forEach((el, i) => {
    el.querySelector('.swatch-original-bg').style.backgroundColor = contrastBase[i];
  });
  isContrasting = true;
  document.getElementById('palette').classList.add('adjusting');
  contrastPanel.classList.add('open'); contrastBtn.classList.add('active');
  // close adjust panel via DOM to avoid coupling
  document.getElementById('adjust-panel').classList.remove('open');
  document.getElementById('adjust-btn').classList.remove('active');
}

function closeContrastPanel(revert) {
  if (revert) {
    contrastBase.forEach((hex, i) => {
      swatches[i].hex = hex;
      applySwatch(document.querySelectorAll('.swatch')[i], hex);
    });
  }
  isContrasting = false;
  document.getElementById('palette').classList.remove('adjusting');
  contrastPanel.classList.remove('open'); contrastBtn.classList.remove('active');
}

// ── Event bindings ────────────────────────────────────────────────────────────

conSlider.el.addEventListener('input', () => { updateFill(conSlider); conSlider.val.textContent = conSlider.el.value; previewContrast(); });

contrastBtn.addEventListener('click', e => {
  e.stopPropagation();
  contrastPanel.classList.contains('open') ? closeContrastPanel(true) : openContrastPanel();
});

document.getElementById('contrast-cancel').addEventListener('click', () => closeContrastPanel(true));

document.getElementById('contrast-apply').addEventListener('click', () => {
  pushHistory(); closeContrastPanel(false); updateURL(); showToast('Contrast applied');
});

document.addEventListener('click', e => { if (contrastPanel.classList.contains('open')) closeContrastPanel(true); });
contrastPanel.addEventListener('click', e => e.stopPropagation());
