/* Application entry point — global event bindings and bootstrap. */

// ── Toolbar ───────────────────────────────────────────────────────────────────

document.getElementById('generate-btn').addEventListener('click', generate);

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    generate();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
});

document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);

// ── Bootstrap ─────────────────────────────────────────────────────────────────

window.addEventListener('hashchange', () => {
  const fromHash = parseHash();
  if (fromHash) {
    const currentHash = swatches.map(s => s.hex.slice(1).toLowerCase()).join('-');
    const newHash = window.location.hash.slice(1).toLowerCase();
    if (currentHash === newHash) return;
    setSwatches(fromHash.map(hex => ({ hex })));
    renderPalette();
    setActivePalette(null);
    updateSelectorBtn();
  }
});

initPalette();

