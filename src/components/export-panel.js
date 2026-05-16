/* Export panel — copy palette in various formats to clipboard. */

// ── State ─────────────────────────────────────────────────────────────────────

const exportBtn   = document.getElementById('export-btn');
const exportPanel = document.getElementById('export-panel');

// ── Event bindings ────────────────────────────────────────────────────────────

exportBtn.addEventListener('click', e => {
  e.stopPropagation();
  exportPanel.classList.toggle('open');
});

document.addEventListener('click', () => exportPanel.classList.remove('open'));
exportPanel.addEventListener('click', e => e.stopPropagation());

document.getElementById('copy-rgb').addEventListener('click', () => {
  const list = swatches.map(s => {
    const r = parseInt(s.hex.slice(1,3),16);
    const g = parseInt(s.hex.slice(3,5),16);
    const b = parseInt(s.hex.slice(5,7),16);
    return `"rgb(${r}, ${g}, ${b})"`;
  }).join(', ');
  navigator.clipboard.writeText(list);
  showToast('RGB list copied!');
  exportPanel.classList.remove('open');
});

document.getElementById('copy-rgba').addEventListener('click', () => {
  const list = swatches.map(s => {
    const r = parseInt(s.hex.slice(1,3),16);
    const g = parseInt(s.hex.slice(3,5),16);
    const b = parseInt(s.hex.slice(5,7),16);
    return `"rgba(${r}, ${g}, ${b}, 1.0)"`;
  }).join(', ');
  navigator.clipboard.writeText(list);
  showToast('RGBA list copied!');
  exportPanel.classList.remove('open');
});

document.getElementById('copy-url').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href);
  showToast('URL copied!');
  exportPanel.classList.remove('open');
});

document.getElementById('copy-hex').addEventListener('click', () => {
  navigator.clipboard.writeText(swatches.map(s => `"${s.hex.toUpperCase()}"`).join(', '));
  showToast('HEX codes copied!');
  exportPanel.classList.remove('open');
});

document.getElementById('copy-css').addEventListener('click', () => {
  const css = ':root {\n' + swatches.map((s,i) => `  --color-${i+1}: ${s.hex.toUpperCase()};`).join('\n') + '\n}';
  navigator.clipboard.writeText(css);
  showToast('CSS variables copied!');
  exportPanel.classList.remove('open');
});
