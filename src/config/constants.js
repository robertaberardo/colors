/* Application constants — single source of truth for all magic numbers. */

// ── Palette ───────────────────────────────────────────────────────────────────
const INITIAL_COUNT       = 5;    // default swatch count on first load
const SCALE_DEFAULT_COUNT = 8;    // count used by lightness / chroma OKLCH scales

// ── Palette browser ───────────────────────────────────────────────────────────
const PB_BATCH = 80;              // items loaded per scroll page

// ── Generation modes ──────────────────────────────────────────────────────────
const MODES = ['random', 'analogous', 'complementary', 'triadic', 'pastel', 'perceptual'];

// ── OKLCH defaults ────────────────────────────────────────────────────────────
const OKLCH_DEFAULTS = { L: 0.65, C: 0.18, H: 180, scale: 'hue' };

// Hue-track gradient preview (the rainbow strip on the H slider)
const OKLCH_HUE_TRACK_L = 0.65;   // OKLCH lightness for gradient stops
const OKLCH_HUE_TRACK_C = 0.22;   // OKLCH chroma for gradient stops
const OKLCH_HUE_STEP    = 30;     // degrees between adjacent stops

// Chroma scale: minimum chroma so the first swatch isn't a pure gray
const CHROMA_FLOOR = 0.06;

// ── Interaction ───────────────────────────────────────────────────────────────
const HOLD_MS  = 350;   // hold duration (ms) before count picker opens
const TOAST_MS = 1800;  // how long a toast stays visible (ms)

// ── Color thresholds ──────────────────────────────────────────────────────────
const LUMA_THRESHOLD = 0.45;  // sRGB luma above this → background is "dark"

// ── Spread / Contrast ─────────────────────────────────────────────────────────
const CONTRAST_PASSES        = 30;   // max constraint-satisfaction iterations
const CONTRAST_TARGET_FACTOR = 1.5;  // target gap = median distance × factor

// ── Swatch responsive breakpoints ─────────────────────────────────────────────
const SWATCH_SM_WIDTH = 150;  // px-per-swatch below which compact mode applies
const SWATCH_XS_WIDTH = 120;  // px-per-swatch below which extra-compact applies

// ── Placeholder hex values ────────────────────────────────────────────────────
const PLACEHOLDER_HEX    = '#888888';  // neutral fill when resizing scale palette
const PICKER_DEFAULT_HEX = '#e05555';  // fallback color for the palette color filter
