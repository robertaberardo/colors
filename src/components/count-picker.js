/* Divider count picker — long-press popup for inserting N interpolated swatches. */

// ── State ─────────────────────────────────────────────────────────────────────

let dcpAfterIdx = null;

// ── Open / close ──────────────────────────────────────────────────────────────

function openCountPicker(afterIdx, triggerBtn) {
  dcpAfterIdx = afterIdx;
  const picker = document.getElementById('divider-count-picker');
  picker.classList.add('open');
  requestAnimationFrame(() => {
    const rect = triggerBtn.getBoundingClientRect();
    const ph = picker.offsetHeight;
    let top = rect.top - ph - 10;
    if (top < 8) top = rect.bottom + 10;
    picker.style.left = (rect.left + rect.width / 2) + 'px';
    picker.style.top  = top + 'px';
  });
}

function closeCountPicker() {
  document.getElementById('divider-count-picker').classList.remove('open');
  dcpAfterIdx = null;
}

// ── Build buttons 1–8 ─────────────────────────────────────────────────────────

(function buildCountPicker() {
  const picker = document.getElementById('divider-count-picker');
  for (let n = 1; n <= 8; n++) {
    const b = document.createElement('button');
    b.className = 'dcp-btn';
    b.textContent = n;
    b.addEventListener('mouseup', e => {
      e.stopPropagation();
      if (dcpAfterIdx !== null) insertNSwatches(dcpAfterIdx, n);
      closeCountPicker();
    });
    picker.appendChild(b);
  }
})();

// ── Global close triggers ─────────────────────────────────────────────────────

document.getElementById('divider-count-picker').addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', () => closeCountPicker());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCountPicker(); });
