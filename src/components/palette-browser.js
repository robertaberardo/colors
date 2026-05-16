/* Palette browser — searchable, filterable named palette selector. */

// ── State ─────────────────────────────────────────────────────────────────────

const paletteSelectorBtn = document.getElementById('palette-selector-btn');
const paletteBrowser     = document.getElementById('palette-browser');
const pbSearch           = document.getElementById('pb-search');
const pbList             = document.getElementById('pb-list');

let pbOpen      = false;
let pbQuery     = '';
let pbKinds     = new Set(['q', 's', 'd']);
let pbColorPick = null;
let pbColorTol  = 0.20;
let pbOffset    = 0;

// ── Selector button ───────────────────────────────────────────────────────────

function updateSelectorBtn() {
  const dotsEl  = paletteSelectorBtn.querySelector('.psb-dots');
  const labelEl = paletteSelectorBtn.querySelector('.psb-label');
  if (activePalette) {
    const colors = activePalette[1].split(',').slice(0, 10);
    dotsEl.innerHTML = colors.map(c => `<span class="psb-dot" style="background:#${c}"></span>`).join('');
    labelEl.textContent = activePalette[0];
  } else {
    dotsEl.innerHTML = '';
    labelEl.textContent = mode === 'perceptual' ? 'Perceptual OKLCH' : mode.charAt(0).toUpperCase() + mode.slice(1);
  }
}

// ── List rendering ────────────────────────────────────────────────────────────

function buildPbItems(filtered, append) {
  const frag = document.createDocumentFragment();
  if (!append) {
    const sec = document.createElement('div');
    sec.className = 'pb-section'; sec.textContent = 'Generate';
    frag.appendChild(sec);
    MODES.forEach(m => {
      const el = document.createElement('div');
      el.className = 'pb-item' + (m === mode && !activePalette ? ' active' : '');
      el.dataset.mode = m;
      const label = m === 'perceptual' ? 'Perceptual OKLCH' : m.charAt(0).toUpperCase() + m.slice(1);
      el.innerHTML = `<span class="pb-name">${label}</span>`;
      el.addEventListener('click', () => {
        setMode(m); setActivePalette(null);
        if (m !== 'perceptual') closeOklchPanel(false);
        generate(); updateSelectorBtn(); closePaletteBrowser();
        if (m === 'perceptual') openOklchPanel();
      });
      frag.appendChild(el);
    });
    const sec2 = document.createElement('div');
    sec2.className = 'pb-section';
    sec2.textContent = 'Palettes — ' + filtered.length.toLocaleString();
    frag.appendChild(sec2);
  }
  const slice = filtered.slice(pbOffset, pbOffset + PB_BATCH);
  slice.forEach(entry => {
    const [name, colorsStr] = entry;
    const colors = colorsStr.split(',');
    const el = document.createElement('div');
    el.className = 'pb-item' + (activePalette && activePalette[0] === name ? ' active' : '');
    const dots = colors.map(c => `<span class="pb-dot" style="background:#${c}"></span>`).join('');
    el.innerHTML = `<span class="pb-name">${name}</span><div class="pb-dots">${dots}</div>`;
    el._applyPalette = () => {
      setActivePalette(entry);
      setSwatches(colorsStr.split(',').map(c => ({ hex: '#' + c })));
      renderPalette(); updateURL(); updateSelectorBtn();
    };
    el.addEventListener('click', () => {
      pushHistory();
      el._applyPalette();
      closePaletteBrowser();
    });
    frag.appendChild(el);
  });
  pbOffset += slice.length;
  return frag;
}

function renderPbList(append) {
  const q = pbQuery.toLowerCase();
  const filtered = PYPALETTES.filter(([name, hexStr, tagStr]) => {
    if (q && !name.toLowerCase().includes(q)) return false;
    if (tagStr) {
      const tags = tagStr.split(',').map(t => t === 'dis' ? 'q' : t);
      if (!tags.some(t => pbKinds.has(t))) return false;
    }
    if (pbColorPick) {
      const hexes = hexStr.split(',');
      if (!hexes.some(h => oklabDist(pbColorPick, '#' + h) <= pbColorTol)) return false;
    }
    return true;
  });
  if (!append) { pbOffset = 0; pbList.innerHTML = ''; }
  pbList.appendChild(buildPbItems(filtered, append));
  pbList._filtered = filtered;
}

// ── Open / close ──────────────────────────────────────────────────────────────

function openPaletteBrowser() {
  pbQuery = ''; pbSearch.value = '';
  paletteBrowser.classList.add('open'); paletteSelectorBtn.classList.add('active');
  pbOpen = true; renderPbList(false); pbSearch.focus();
  requestAnimationFrame(() => {
    const active = pbList.querySelector('.pb-item.active');
    if (active) { active.classList.add('kb-focus'); active.scrollIntoView({ block: 'center' }); }
  });
}

function closePaletteBrowser() {
  paletteBrowser.classList.remove('open'); paletteSelectorBtn.classList.remove('active');
  pbOpen = false;
  if (cpOnChange) closePicker();
}

// ── Event bindings ────────────────────────────────────────────────────────────

pbList.addEventListener('scroll', () => {
  if (!pbList._filtered) return;
  const nearBottom = pbList.scrollHeight - pbList.scrollTop - pbList.clientHeight < 120;
  if (nearBottom && pbOffset < pbList._filtered.length) renderPbList(true);
});

pbSearch.addEventListener('input', () => { pbQuery = pbSearch.value; renderPbList(false); });

pbSearch.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
  const items = [...pbList.querySelectorAll('.pb-item')];
  if (!items.length) return;
  const focused = pbList.querySelector('.pb-item.kb-focus');
  const idx     = focused ? items.indexOf(focused) : -1;
  if (e.key === 'Enter') { e.preventDefault(); (focused || items[0])?.click(); return; }
  e.preventDefault();
  const next = e.key === 'ArrowDown' ? items[Math.min(idx + 1, items.length - 1)] : items[Math.max(idx - 1, 0)];
  if (focused) focused.classList.remove('kb-focus');
  next.classList.add('kb-focus'); next.scrollIntoView({ block: 'nearest' });
  if (next._applyPalette) next._applyPalette();
});

document.querySelectorAll('.pb-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const kind = chip.dataset.kind;
    if (pbKinds.has(kind)) { if (pbKinds.size > 1) { pbKinds.delete(kind); chip.classList.remove('active'); } }
    else { pbKinds.add(kind); chip.classList.add('active'); }
    renderPbList(false);
  });
});

const pbColorBtn   = document.getElementById('pb-color-btn');
const pbColorRowEl = document.getElementById('pb-color-row');
const pbColorClear = document.getElementById('pb-color-clear');
const pbTolSlider  = document.getElementById('pb-tol-slider');
const pbTolFill    = document.getElementById('pb-tol-fill');

function updatePbTolFill() {
  const pct = (pbTolSlider.value - 5) / (40 - 5) * 100;
  pbTolFill.style.cssText = `left:0; width:${pct}%`;
}
updatePbTolFill();

pbColorBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (cpEl.classList.contains('open') && cpOnChange) { closePicker(); return; }
  openPicker(pbColorPick || PICKER_DEFAULT_HEX, pbColorBtn, hex => {
    pbColorPick = hex; pbColorBtn.style.background = hex;
    pbColorRowEl.classList.add('active'); updatePbTolFill(); renderPbList(false);
  });
});

pbTolSlider.addEventListener('input', () => { pbColorTol = pbTolSlider.value / 100; updatePbTolFill(); if (pbColorPick) renderPbList(false); });

pbColorClear.addEventListener('click', () => {
  pbColorPick = null; pbColorBtn.style.background = '';
  pbColorRowEl.classList.remove('active'); closePicker(); renderPbList(false);
});

paletteSelectorBtn.addEventListener('click', e => { e.stopPropagation(); pbOpen ? closePaletteBrowser() : openPaletteBrowser(); });
document.addEventListener('click', () => { if (pbOpen) closePaletteBrowser(); });
paletteBrowser.addEventListener('click', e => e.stopPropagation());

updateSelectorBtn();
