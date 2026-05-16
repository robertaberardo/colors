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

initPalette();
