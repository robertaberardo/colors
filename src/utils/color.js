/* Pure color utility functions — no DOM, no global state. */

// ── Color naming ──────────────────────────────────────────────────────────────

const colorNames = [
  [0,'Ruby'],[15,'Vermilion'],[25,'Tangerine'],[35,'Amber'],[45,'Gold'],
  [55,'Flax'],[65,'Lime'],[80,'Emerald'],[100,'Jade'],[130,'Teal'],
  [160,'Aqua'],[185,'Sky'],[210,'Cobalt'],[230,'Indigo'],[255,'Violet'],
  [280,'Plum'],[300,'Fuchsia'],[320,'Rose'],[345,'Crimson'],[360,'Ruby']
];

function getColorName(h, s, l) {
  if (s < 12) {
    if (l > 85) return 'Snow';
    if (l > 65) return 'Silver';
    if (l > 40) return 'Ash';
    if (l > 20) return 'Charcoal';
    return 'Onyx';
  }
  if (l > 85) return 'Blush';
  if (l < 20) return 'Noir';
  const h360 = ((h % 360) + 360) % 360;
  for (let i = colorNames.length - 1; i >= 0; i--) {
    if (h360 >= colorNames[i][0]) return colorNames[i][1];
  }
  return 'Hue';
}

// ── HSL conversions ───────────────────────────────────────────────────────────

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h /= 6;
  }
  return [h*360, s*100, l*100];
}

// ── OKLCH / Oklab conversions ─────────────────────────────────────────────────
// L: 0–1  C: 0–0.4  H: 0–360

function oklchToHex(L, C, H) {
  const hr = H * Math.PI / 180;
  const a  = C * Math.cos(hr);
  const b  = C * Math.sin(hr);
  const l_ = L + 0.3963377774*a + 0.2158037573*b;
  const m_ = L - 0.1055613458*a - 0.0638541728*b;
  const s_ = L - 0.0894841775*a - 1.2914855480*b;
  const l3 = l_*l_*l_, m3 = m_*m_*m_, s3 = s_*s_*s_;
  let r =  4.0767416621*l3 - 3.3077115913*m3 + 0.2309699292*s3;
  let g = -1.2684380046*l3 + 2.6097574011*m3 - 0.3413193965*s3;
  let bv= -0.0041960863*l3 - 0.7034186147*m3 + 1.7076147010*s3;
  r = Math.max(0,Math.min(1,r)); g = Math.max(0,Math.min(1,g)); bv = Math.max(0,Math.min(1,bv));
  const toS = c => c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055;
  return '#' + [r,g,bv].map(c => Math.round(toS(c)*255).toString(16).padStart(2,'0')).join('');
}

function hexToOklch(hex) {
  const fromS = c => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  const r = fromS(parseInt(hex.slice(1,3),16)/255);
  const g = fromS(parseInt(hex.slice(3,5),16)/255);
  const b = fromS(parseInt(hex.slice(5,7),16)/255);
  const l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
  const m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
  const s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L  =  0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
  const a  =  1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
  const bv =  0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
  const C  = Math.sqrt(a*a + bv*bv);
  let H = Math.atan2(bv, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H]; // L: 0–1, C: 0–~0.4, H: 0–360
}

// Perceptually uniform color distance (Oklab Euclidean)
function oklabDist(hex1, hex2) {
  const [L1,C1,H1] = hexToOklch(hex1);
  const [L2,C2,H2] = hexToOklch(hex2);
  const r1 = H1*Math.PI/180, r2 = H2*Math.PI/180;
  const dL = L1-L2;
  const da = C1*Math.cos(r1) - C2*Math.cos(r2);
  const db = C1*Math.sin(r1) - C2*Math.sin(r2);
  return Math.sqrt(dL*dL + da*da + db*db);
}

// ── Luma ──────────────────────────────────────────────────────────────────────

function getLuma(hex) {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

// ── General utility ───────────────────────────────────────────────────────────

function rand(min, max) { return Math.random() * (max - min) + min; }

// ── Blend / interpolate ───────────────────────────────────────────────────────

/** Simple RGB midpoint blend between two hex colors. */
function blendHex(hex1, hex2) {
  const r = Math.round((parseInt(hex1.slice(1,3),16) + parseInt(hex2.slice(1,3),16)) / 2);
  const g = Math.round((parseInt(hex1.slice(3,5),16) + parseInt(hex2.slice(3,5),16)) / 2);
  const b = Math.round((parseInt(hex1.slice(5,7),16) + parseInt(hex2.slice(5,7),16)) / 2);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** Perceptually linear interpolation in Oklab at parameter t ∈ [0, 1]. */
function interpolateOklab(hex1, hex2, t) {
  const [L1,C1,H1] = hexToOklch(hex1);
  const [L2,C2,H2] = hexToOklch(hex2);
  const r1 = H1*Math.PI/180, r2 = H2*Math.PI/180;
  const a1 = C1*Math.cos(r1), b1 = C1*Math.sin(r1);
  const a2 = C2*Math.cos(r2), b2 = C2*Math.sin(r2);
  const L = L1+(L2-L1)*t, a = a1+(a2-a1)*t, b = b1+(b2-b1)*t;
  const C = Math.sqrt(a*a+b*b);
  const H = (Math.atan2(b,a)*180/Math.PI+360)%360;
  return oklchToHex(L, C, H);
}

/** Reflect anchorHex away from neighborHex in HSL space (for edge insertion). */
function extrapolateHex(anchorHex, neighborHex) {
  const [h0, s0, l0] = hexToHsl(anchorHex);
  const [h1, s1, l1] = hexToHsl(neighborHex);
  return hslToHex(
    ((h0 - (h1 - h0)) + 360) % 360,
    Math.max(15, Math.min(85, s0 - (s1 - s0))),
    Math.max(8,  Math.min(92, l0 - (l1 - l0)))
  );
}

// ── Color picker helpers (HSV ↔ RGB) ─────────────────────────────────────────

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i].map(c => Math.round(c * 255));
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, max ? (d / max) * 100 : 0, max * 100];
}

function cpRgbToHex(r, g, b) {
  return '#' + [r,g,b].map(c => Math.max(0,Math.min(255,Math.round(c))).toString(16).padStart(2,'0')).join('');
}

function cpHexToRgb(hex) {
  hex = hex.replace('#','');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

/** Parse a flexible color string into [r, g, b, a%]. */
function cpParseText(raw) {
  raw = raw.trim();
  let m;
  m = raw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (m) return [+m[1], +m[2], +m[3], m[4] != null ? Math.round(+m[4] * 100) : 100];
  m = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3
      ? m[1].split('').map(c => c + c).join('')
      : m[1];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 100];
  }
  m = raw.match(/^([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,]+([\d.]+))?$/);
  if (m) return [+m[1], +m[2], +m[3], m[4] != null ? Math.round(+m[4] * 100) : 100];
  return null;
}

// ── Adjust transformations ────────────────────────────────────────────────────

/** Apply HSL-space hue/sat/brightness/temperature offsets to a hex color. */
function applyAdjustments(hex, hue, sat, bri, tmp) {
  let [h, s, l] = hexToHsl(hex);
  h = (h + hue + 360) % 360;
  s = Math.max(0, Math.min(100, s + sat));
  l = Math.max(0, Math.min(100, l + bri));
  if (tmp !== 0) {
    const target = tmp > 0 ? 30 : 210;
    const t = Math.abs(tmp) / 100;
    const diff = ((target - h + 540) % 360) - 180;
    h = (h + diff * t * 0.5 + 360) % 360;
    s = Math.max(0, Math.min(100, s + tmp * 0.12));
  }
  return hslToHex(h, s, l);
}

/** Apply OKLCH-space hue/chroma/lightness/temperature offsets to a hex color. */
function applyAdjustmentsOklch(hex, hue, chroma, lightness, tmp) {
  let [L, C, H] = hexToOklch(hex);
  H = (H + hue + 360) % 360;
  C = Math.max(0, Math.min(0.4, C + chroma * 0.003));
  L = Math.max(0, Math.min(1, L + lightness / 100));
  if (tmp !== 0) {
    const target = tmp > 0 ? 60 : 220;
    const t = Math.abs(tmp) / 100;
    const diff = ((target - H + 540) % 360) - 180;
    H = (H + diff * t * 0.5 + 360) % 360;
    C = Math.max(0, Math.min(0.4, C + Math.abs(tmp) * 0.0012));
  }
  return oklchToHex(L, C, H);
}

// ── Spread / Contrast ─────────────────────────────────────────────────────────

/** Push perceptually similar colors apart in lightness. */
function applyContrast(hexes, strength) {
  const n = hexes.length;
  if (n < 2 || strength === 0) return hexes.slice();

  const okl = hexes.map(h => hexToOklch(h));
  const L   = okl.map(c => c[0]);
  const ab  = okl.map(([, C, H]) => {
    const r = H * Math.PI / 180;
    return [C * Math.cos(r), C * Math.sin(r)];
  });

  const dists = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const dL = L[i] - L[j];
      const [a1, b1] = ab[i], [a2, b2] = ab[j];
      dists.push(Math.sqrt(dL * dL + (a1 - a2) ** 2 + (b1 - b2) ** 2));
    }
  dists.sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)];
  const target = median * CONTRAST_TARGET_FACTOR * (strength / 100);

  for (let pass = 0; pass < CONTRAST_PASSES; pass++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const [a1, b1] = ab[i], [a2, b2] = ab[j];
        const dab2 = (a1 - a2) ** 2 + (b1 - b2) ** 2;
        if (dab2 >= target * target) continue;
        const neededDL  = Math.sqrt(Math.max(0, target * target - dab2));
        const currentDL = Math.abs(L[j] - L[i]);
        if (currentDL >= neededDL) continue;
        const deficit = neededDL - currentDL;
        const sign    = L[i] <= L[j] ? 1 : -1;
        L[i] = Math.max(0.03, Math.min(0.97, L[i] - sign * deficit * 0.5));
        L[j] = Math.max(0.03, Math.min(0.97, L[j] + sign * deficit * 0.5));
        changed = true;
      }
    }
    if (!changed) break;
  }

  return okl.map(([, c, h], i) => oklchToHex(L[i], c, h));
}
