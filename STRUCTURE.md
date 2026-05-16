# Project Structure

## Overview

Vanilla JS color palette generator. No build step — open `index.html` directly in the browser (`file://` compatible, uses classic `<script src>` tags, not ES modules).

---

## File tree

```
color-palette-generator/
├── index.html               # Single entry point — markup, CSS, script tags
├── palettes.js              # Dataset: ~900 named palettes as PYPALETTES array
├── STRUCTURE.md             # This file
└── src/
    ├── config/
    │   └── constants.js     # All magic numbers — one source of truth
    ├── utils/
    │   └── color.js         # Pure color functions — no DOM, no state
    ├── services/
    │   └── palette-data.js  # Global state + generation logic + history + URL
    └── components/
        ├── palette-view.js  # Swatch rendering, dividers, edge buttons, toast
        ├── count-picker.js  # Long-press popup for inserting N swatches
        ├── color-picker.js  # HSV gradient picker widget
        ├── adjust-panel.js  # HSL / OKLCH global slider adjustments
        ├── contrast-panel.js# Perceptual spread / lightness contrast tool
        ├── oklch-panel.js   # Perceptual palette generation via L/C/H sliders
        ├── palette-browser.js # Searchable named-palette selector
        └── export-panel.js  # Copy palette as RGB / HEX / CSS / URL
```

---

## Script load order

Order matters — each script assumes prior ones have run:

| # | File | Provides |
|---|------|----------|
| 1 | `palettes.js` | `PYPALETTES` |
| 2 | `src/config/constants.js` | `INITIAL_COUNT`, `MODES`, `OKLCH_DEFAULTS`, … |
| 3 | `src/utils/color.js` | `hslToHex`, `oklchToHex`, `interpolateOklab`, … |
| 4 | `src/services/palette-data.js` | `swatches`, `mode`, `oklchParams`, `generate`, `pushHistory`, … |
| 5 | `src/components/palette-view.js` | `renderPalette`, `applySwatch`, `showToast`, `updateFill` |
| 6 | `src/components/count-picker.js` | `openCountPicker`, `closeCountPicker` |
| 7 | `src/components/adjust-panel.js` | `syncAdjustWithPalette`, `openAdjustPanel`, `closeAdjustPanel` |
| 8 | `src/components/color-picker.js` | `openPicker`, `closePicker`, `cpEl`, `cpOnChange` |
| 9 | `src/components/contrast-panel.js` | `syncContrastWithPalette`, `openContrastPanel`, `closeContrastPanel` |
| 10 | `src/components/oklch-panel.js` | `openOklchPanel`, `closeOklchPanel`, `syncOklchSliders` |
| 11 | `src/components/palette-browser.js` | `updateSelectorBtn`, `openPaletteBrowser`, `closePaletteBrowser` |
| 12 | `src/components/export-panel.js` | (event bindings only) |
| 13 | `src/main.js` | Bootstrap — calls `initPalette()`, wires keyboard shortcuts |

---

## State ownership

All mutable state lives in `palette-data.js` as top-level `let` variables:

| Variable | Type | Description |
|----------|------|-------------|
| `swatches` | `Array<{hex}>` | Ordered list of current palette colors |
| `mode` | `string` | Active generation mode (`'random'`, `'analogous'`, …) |
| `activePalette` | `Array \| null` | Currently selected named palette entry, or null |
| `dragSrc` | `number \| null` | Index of the swatch being dragged |
| `oklchParams` | `{L, C, H, scale}` | Perceptual generation parameters |
| `historyStack` | `Array[]` | Undo history — each entry is a hex array snapshot |
| `redoStack` | `Array[]` | Redo buffer |

### Setters

Because classic scripts share the same global scope, `swatches`, `mode`, `activePalette`, and `dragSrc` can technically be reassigned from anywhere. Setter functions (`setSwatches`, `setMode`, `setActivePalette`, `setDragSrc`) exist to make mutation explicit and keep reassignment local to `palette-data.js`:

```js
// Preferred — explicit intent
setSwatches(newArr);

// Works but bypasses convention
swatches = newArr;
```

`oklchParams` is a `const` object — its properties are mutated directly (`oklchParams.L = 0.65`) by both `palette-data.js` and `oklch-panel.js`.

---

## Data flow

```
User action
    │
    ▼
Component (e.g. palette-browser.js)
    │  calls setter: setActivePalette(entry)
    │  calls:        setSwatches([...])
    ▼
palette-data.js (state updated)
    │  calls: renderPalette()
    ▼
palette-view.js (re-renders DOM)
    │  calls: syncAdjustWithPalette()  ← adjust-panel re-applies sliders if open
    │  calls: syncContrastWithPalette()← contrast-panel re-applies if open
    ▼
DOM updated
```

---

## Cross-file references

Classic scripts avoid the circular-import problem entirely — every function call resolves at call time, not at parse time. The conventions are:

- **Forward references are safe** — `palette-data.js` calls `renderPalette()` (defined in `palette-view.js`, loaded later) only inside function bodies, never at the top level.
- **Panel state is read via DOM** — instead of importing `isAdjusting` from `adjust-panel.js`, files that need panel state check `document.getElementById('adjust-panel').classList.contains('open')`. This keeps the coupling lightweight.
- **`updateFill`** lives in `palette-view.js` (not adjust-panel) because it is shared by `adjust-panel.js`, `contrast-panel.js`, and the palette browser tolerance slider.

---

## Key algorithms

### `generatePalette(count)` — `palette-data.js`
Produces `count` hex colors for the active `mode`. Perceptual mode uses `oklchParams` to sweep hue, lightness, or chroma across the OKLCH space.

### `interpolateOklab(hex1, hex2, t)` — `color.js`
Blends two colors in Oklab (perceptual) space at parameter `t ∈ [0,1]`. Used when inserting swatches between existing ones.

### `applyContrast(hexes, strength)` — `color.js`
Iterative constraint-satisfaction that pushes perceptually similar colors apart in Oklab lightness. Runs up to `CONTRAST_PASSES` iterations, stops early when stable.

### `extrapolateHex(anchor, neighbor)` — `color.js`
Reflects `anchor` away from `neighbor` in HSL space. Used by edge-add buttons to continue the palette's hue/lightness direction outward.

---

## Adding a new panel

1. Create `src/components/my-panel.js` — no imports/exports needed, all globals are available.
2. Add a `<div id="my-panel" role="dialog" aria-label="…" aria-modal="true">` and its trigger `<button>` to `index.html`.
3. Add the CSS inline in `index.html` near the other panel styles.
4. Add `<script src="src/components/my-panel.js"></script>` to `index.html` before `src/main.js`.
5. If the panel needs to react when `renderPalette` re-renders, expose a `syncMyPanelWithPalette()` function and call it from `renderPalette()` in `palette-view.js`.
