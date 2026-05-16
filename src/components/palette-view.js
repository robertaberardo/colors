/* Palette view — swatch rendering, divider, edge buttons, toast. */

// ── Slider fill (shared with adjust-panel + contrast-panel) ───────────────────

function updateFill(s) {
  const min = +s.el.min, max = +s.el.max, v = +s.el.value;
  const pct = x => (x - min) / (max - min) * 100;
  const center = pct(0), thumb = pct(v);
  if (v >= 0) {
    s.fill.style.left  = center + '%';
    s.fill.style.width = (thumb - center) + '%';
  } else {
    s.fill.style.left  = thumb + '%';
    s.fill.style.width = (center - thumb) + '%';
  }
  s.val.textContent = v;
}

// ── Swatch painting ───────────────────────────────────────────────────────────

function applySwatch(el, hex) {
  el.querySelector('.swatch-bg').style.backgroundColor = hex;
  const luma = getLuma(hex);
  const dark = luma > LUMA_THRESHOLD;
  const textColor = dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
  const border    = dark ? 'rgba(0,0,0,0.18)'  : 'rgba(255,255,255,0.22)';
  const bg        = dark ? 'rgba(0,0,0,0.07)'  : 'rgba(255,255,255,0.1)';
  el.querySelectorAll('.color-name, .action-btn').forEach(e => e.style.color = textColor);
  el.querySelectorAll('.action-btn').forEach(e => { e.style.borderColor = border; e.style.background = bg; });
  const inp = el.querySelector('.hex-input');
  if (document.activeElement !== inp) inp.value = hex.toUpperCase();
  inp.style.borderColor = border;
  inp.style.background  = dark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  inp.style.color = textColor;
  const [h, s, l] = hexToHsl(hex);
  el.querySelector('.color-name').textContent = getColorName(h, s, l);
}

// ── Swatch element factory ────────────────────────────────────────────────────

function createSwatchEl(idx) {
  const sw = swatches[idx];
  const el = document.createElement('div');
  el.className = 'swatch';
  el.draggable = true;
  el.innerHTML = `
    <div class="swatch-original"><div class="swatch-original-bg"></div></div>
    <div class="split-divider">
      <span class="split-label">before</span><span class="split-label">after</span>
    </div>
    <div class="swatch-bg"></div>
    <div class="swatch-actions">
      <button class="action-btn delete-btn" title="Delete color" aria-label="Delete color">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
      <button class="action-btn drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
        <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="17" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="1" fill="currentColor" stroke="none"/></svg>
      </button>
    </div>
    <div class="swatch-content">
      <div class="color-name"></div>
      <input class="hex-input" type="text" maxlength="7" spellcheck="false" aria-label="Hex color code" />
      <button class="pick-btn" title="Color picker" aria-label="Open color picker">
        <svg viewBox="0 0 24 24"><path d="M2 22l10-10M20.5 3.5a2.121 2.121 0 0 0-3 0L9 12l3 3 8.5-8.5a2.121 2.121 0 0 0 0-3z"/><path d="M9 12l-2 5-2 2 5-2z"/></svg>
      </button>
    </div>
  `;

  el.querySelector('.delete-btn').addEventListener('click', e => { e.stopPropagation(); deleteSwatch(idx); });
  el.querySelector('.pick-btn').addEventListener('click', e => { e.stopPropagation(); openPicker(idx, el.querySelector('.pick-btn')); });

  const inp = el.querySelector('.hex-input');
  inp.addEventListener('click', e => e.stopPropagation());
  inp.addEventListener('focus', () => { inp.select(); el.draggable = false; });
  inp.addEventListener('blur',  () => { el.draggable = true; inp.classList.remove('invalid'); });

  inp._histPushed = false;
  inp.addEventListener('focus', () => { inp._histPushed = false; });
  inp.addEventListener('input', () => {
    let val = inp.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-f]{6}$/i.test(val)) {
      if (!inp._histPushed) { pushHistory(); inp._histPushed = true; }
      inp.classList.remove('invalid');
      swatches[idx].hex = val.toLowerCase();
      el.querySelector('.swatch-bg').style.backgroundColor = val;
      const luma = getLuma(val), dark = luma > LUMA_THRESHOLD;
      const textColor = dark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
      const border    = dark ? 'rgba(0,0,0,0.18)'  : 'rgba(255,255,255,0.22)';
      el.querySelectorAll('.color-name, .action-btn').forEach(e => e.style.color = textColor);
      el.querySelectorAll('.action-btn').forEach(e => { e.style.borderColor = border; });
      inp.style.color = textColor; inp.style.borderColor = border;
      const [h, s, l] = hexToHsl(val);
      el.querySelector('.color-name').textContent = getColorName(h, s, l);
      updateURL();
    } else { inp.classList.add('invalid'); }
  });

  inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); if (e.key === ' ') e.stopPropagation(); });

  el.addEventListener('dragstart', () => { setDragSrc(idx); setTimeout(() => el.classList.add('dragging'), 0); });
  el.addEventListener('dragend',   () => el.classList.remove('dragging'));
  el.addEventListener('dragover',  e => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (dragSrc !== null && dragSrc !== idx) {
      pushHistory();
      [swatches[dragSrc], swatches[idx]] = [swatches[idx], swatches[dragSrc]];
      renderPalette(); updateURL();
    }
    setDragSrc(null);
  });

  applySwatch(el, sw.hex);
  return el;
}

// ── Divider element factory ───────────────────────────────────────────────────

function createDividerEl(afterIdx) {
  const el = document.createElement('div');
  el.className = 'divider';
  el.innerHTML = `<button class="divider-btn" aria-label="Add color between" title="Add · Hold for more">+</button>`;
  const btn = el.querySelector('.divider-btn');
  let holdTimer = null, didHold = false;

  btn.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    didHold = false;
    holdTimer = setTimeout(() => { didHold = true; openCountPicker(afterIdx, btn); }, HOLD_MS);
  });
  btn.addEventListener('mouseup',    () => clearTimeout(holdTimer));
  btn.addEventListener('mouseleave', () => clearTimeout(holdTimer));
  btn.addEventListener('click', e => { e.stopPropagation(); if (!didHold) insertSwatch(afterIdx); });
  return el;
}

// ── Edge button factory ───────────────────────────────────────────────────────

function createEdgeBtn(onLeft) {
  const btn = document.createElement('button');
  btn.className = 'edge-add-btn ' + (onLeft ? 'edge-add-left' : 'edge-add-right');
  btn.textContent = '+';
  btn.setAttribute('aria-label', onLeft ? 'Add color at start' : 'Add color at end');
  btn.addEventListener('click', e => { e.stopPropagation(); onLeft ? insertSwatchAtStart() : insertSwatchAtEnd(); });
  return btn;
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function updateSwatchMode() {
  const palette = document.getElementById('palette');
  const w = window.innerWidth / swatches.length;
  palette.classList.toggle('swatch-sm', w < SWATCH_SM_WIDTH);
  palette.classList.toggle('swatch-xs', w < SWATCH_XS_WIDTH);
}

window.addEventListener('resize', updateSwatchMode);

// ── Palette render ────────────────────────────────────────────────────────────

function renderPalette() {
  const container = document.getElementById('palette');
  container.innerHTML = '';
  container.appendChild(createEdgeBtn(true));
  swatches.forEach((sw, i) => {
    container.appendChild(createSwatchEl(i));
    if (i < swatches.length - 1) container.appendChild(createDividerEl(i));
  });
  container.appendChild(createEdgeBtn(false));
  updateSwatchMode();
  syncAdjustWithPalette();
  syncContrastWithPalette();
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), TOAST_MS);
}
