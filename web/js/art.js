// POKÉPOL — arte em pixel gerada por código (tiles 32px, prédios, agente, políticos 96x96).
// Estilo GBA / Fire Red: paleta suave, contorno escuro, sombreamento em 2-3 tons.
// Se existir web/sprites/<id>.png (96x96), ele substitui o sprite procedural.
// Regra: só coordenadas inteiras, sem anti-aliasing (nada de arc/ellipse fill), alpha 0/255.

const TILE = 32;
const OUTLINE = '#1c1c28';

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; }
  else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ruído determinístico por posição (0..1)
function hash2(i, j, s = 0) {
  let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

// Contorno escuro em volta de tudo que é opaco.
function outline(c, color = OUTLINE) {
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height);
  const w = c.width, h = c.height, a = d.data;
  const op = (i, j) => i >= 0 && j >= 0 && i < w && j < h && a[(j * w + i) * 4 + 3] > 0;
  const marks = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!op(i, j) && (op(i - 1, j) || op(i + 1, j) || op(i, j - 1) || op(i, j + 1))) marks.push([i, j]);
  }
  x.fillStyle = color;
  for (const [i, j] of marks) x.fillRect(i, j, 1, 1);
}

// Garante alpha 0/255 (útil depois de drawImage de PNGs com bordas suaves).
function hardAlpha(c) {
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height);
  for (let k = 3; k < d.data.length; k += 4) d.data[k] = d.data[k] >= 128 ? 255 : 0;
  x.putImageData(d, 0, 0);
}

// ---------- Primitivas de pixel ----------
const R_ = (x, i, j, w, h, col) => { x.fillStyle = col; x.fillRect(i | 0, j | 0, w | 0, h | 0); };
const P_ = (x, i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
// Elipse por pixel: fn(i, j, nx, ny) devolve cor (ou null). half: 'top' | 'bot' | undefined
function Eg(x, cx, cy, rx, ry, fn, half) {
  const j0 = half === 'bot' ? cy : cy - ry, j1 = half === 'top' ? cy : cy + ry;
  for (let j = j0; j <= j1; j++) {
    const ny = (j + 0.5 - cy) / (ry + 0.5);
    if (ny * ny > 1) continue;
    const hw = (rx + 0.5) * Math.sqrt(1 - ny * ny);
    const i0 = Math.ceil(cx - hw - 0.5), i1 = Math.floor(cx + hw - 0.5);
    for (let i = i0; i <= i1; i++) {
      const col = fn(i, j, (i + 0.5 - cx) / (rx + 0.5), ny);
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
  }
}
function E_(x, cx, cy, rx, ry, col, half) { Eg(x, cx, cy, rx, ry, () => col, half); }
function inE(i, j, cx, cy, rx, ry) { return ((i + 0.5 - cx) / (rx + 0.5)) ** 2 + ((j + 0.5 - cy) / (ry + 0.5)) ** 2 <= 1; }
function ring(x, cx, cy, r, th, col) {
  for (let j = cy - r; j <= cy + r; j++) for (let i = cx - r; i <= cx + r; i++) {
    const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy);
    if (d <= r + 0.5 && d > r + 0.5 - th) P_(x, i, j, col);
  }
}
function line(x, x0, y0, x1, y1, col, th = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  x.fillStyle = col;
  for (let k = 0; k <= n; k++) x.fillRect(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), th, th);
}
// caixa com realce no topo/esquerda e sombra embaixo/direita
function bx(x, i, j, w, h, col) {
  R_(x, i, j, w, h, col);
  R_(x, i, j, w, 1, shade(col, 1.3)); R_(x, i, j, 1, h, shade(col, 1.18));
  R_(x, i, j + h - 1, w, 1, shade(col, 0.68)); R_(x, i + w - 1, j, 1, h, shade(col, 0.78));
}

// ---------- Tiles 32x32 ----------
const Tiles = {};
function buildTiles() {
  const mk = (name, fn, frames = 1) => {
    Tiles[name] = [];
    for (let f = 0; f < frames; f++) {
      const [c, x] = mkCanvas(TILE, TILE);
      fn(x, rng(name.length * 977 + f * 31 + 7), f);
      Tiles[name].push(c);
    }
  };
  const px = P_;
  const rr = (r, n) => (r() * n) | 0;
  const grass = (x, r) => {
    R_(x, 0, 0, 32, 32, '#88d070');
    // manchas suaves
    for (let k = 0; k < 6; k++) { const a = rr(r, 30), b = rr(r, 30); R_(x, a, b, 3, 2, '#80c868'); }
    for (let k = 0; k < 40; k++) px(x, rr(r, 32), rr(r, 32), '#78c060');
    for (let k = 0; k < 18; k++) px(x, rr(r, 32), rr(r, 32), '#a0e088');
    // tufos em Y
    for (let k = 0; k < 7; k++) {
      const a = 2 + rr(r, 28), b = 4 + rr(r, 26);
      px(x, a, b, '#58a048'); px(x, a, b - 1, '#58a048'); px(x, a - 1, b - 2, '#58a048'); px(x, a + 1, b - 2, '#58a048');
      px(x, a + 1, b - 1, '#a8e898');
    }
  };
  mk('grass', grass);
  mk('tall', (x, r, f) => {
    R_(x, 0, 0, 32, 32, '#58a848');
    for (let k = 0; k < 30; k++) px(x, rr(r, 32), rr(r, 32), '#4c9a3c');
    R_(x, 0, 28, 32, 4, '#4a9a3c');
    const blades = [[0, 12], [3, 16], [6, 13], [9, 10]];
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      const ox = col * 16 + 3, base = row * 16 + 14 + (row ? 1 : 0);
      for (const [bx0, h] of blades) {
        for (let k = 0; k < h; k++) {
          const t = k / h;
          const sway = t > 0.55 ? (f ? 1 : -1) * (t > 0.85 ? 2 : 1) : 0;
          const xx = ox + bx0 + sway, yy = base - k;
          px(x, xx, yy, '#2f6e2c'); px(x, xx + 1, yy, k < h - 2 ? '#78c860' : '#2f6e2c');
          if (k < h * 0.6) px(x, xx - 1, yy, '#3c8034');
        }
      }
      R_(x, ox - 1, base + 1, 14, 1, '#2f6e2c');
    }
  }, 2);
  mk('path', (x, r) => {
    R_(x, 0, 0, 32, 32, '#e0c890');
    for (let k = 0; k < 40; k++) px(x, rr(r, 32), rr(r, 32), '#d0b87c');
    for (let k = 0; k < 14; k++) px(x, rr(r, 32), rr(r, 32), '#f0dca8');
    for (let k = 0; k < 8; k++) {
      const a = rr(r, 28), b = rr(r, 29);
      R_(x, a, b, 3, 2, '#c4aa70'); R_(x, a, b, 2, 1, '#b09860'); px(x, a + 1, b - 1 < 0 ? 0 : b - 1, '#f4e4b8');
    }
  });
  mk('sand', (x, r) => {
    R_(x, 0, 0, 32, 32, '#f4e4a8');
    for (let k = 0; k < 40; k++) px(x, rr(r, 32), rr(r, 32), '#e8d498');
    for (let k = 0; k < 14; k++) px(x, rr(r, 32), rr(r, 32), '#fff0c0');
    for (let k = 0; k < 5; k++) { const a = rr(r, 24), b = rr(r, 30); R_(x, a, b, 6, 1, '#e4d08c'); R_(x, a + 1, b + 1, 4, 1, '#fcf0c0'); }
    px(x, 7, 20, '#f8f0f0'); px(x, 8, 20, '#e8b0b0'); px(x, 24, 8, '#d8c080');
  });
  mk('water', (x, r, f) => {
    R_(x, 0, 0, 32, 32, '#4890e8');
    for (let y = 0; y < 32; y += 8) R_(x, 0, y + 4, 32, 4, '#3f84dc');
    for (let k = 0; k < 14; k++) px(x, (k * 7 + 3) % 32, (k * 11 + 5) % 32, '#5aa0f0');
    const off = f * 8;
    for (let row = 0; row < 4; row++) {
      const y = 3 + row * 8 + (row % 2) * 1;
      for (let k = -1; k < 3; k++) {
        const bxp = k * 16 + off + (row % 2) * 8;
        R_(x, bxp, y, 7, 1, '#a8d4fc'); R_(x, bxp + 7, y, 3, 1, '#7cb8f8');
        R_(x, bxp + 2, y + 1, 4, 1, '#6cacf4');
      }
    }
  }, 2);
  mk('tree', (x, r) => {
    grass(x, r);
    E_(x, 16, 28, 12, 3, '#5aa84c');
    // tronco
    R_(x, 13, 20, 7, 11, '#7a4a24'); R_(x, 13, 20, 2, 11, '#9a6a3c'); R_(x, 18, 20, 2, 11, '#5a3418'); R_(x, 11, 29, 11, 2, '#6a3e1e');
    px(x, 15, 25, '#5a3418'); px(x, 16, 27, '#5a3418');
    // copa
    Eg(x, 16, 13, 15, 12, (i, j, nx, ny) => {
      const v = nx * 0.5 + ny * 0.7;
      return v > 0.35 ? '#1e5c2a' : v > -0.15 ? '#2a7a34' : '#3a9040';
    });
    Eg(x, 14, 10, 10, 8, (i, j, nx, ny) => (nx * 0.4 + ny * 0.5 > 0.25) ? '#3a9040' : '#4eaa4c');
    Eg(x, 11, 7, 6, 4, (i, j, nx, ny) => (nx + ny > 0.5) ? '#4eaa4c' : '#6cc45c');
    const rr2 = rng(99);
    for (let k = 0; k < 26; k++) {
      const a = 3 + ((rr2() * 26) | 0), b = 2 + ((rr2() * 22) | 0);
      if (inE(a, b, 16, 13, 14, 11)) { px(x, a, b, '#8ae070'); px(x, a + 1, b + 1, '#1e5c2a'); }
    }
    R_(x, 8, 4, 3, 1, '#a8f088'); px(x, 7, 5, '#a8f088');
  });
  mk('flower', (x, r) => {
    grass(x, r);
    const fl = (i, j, c, cc = '#f8e84c') => {
      px(x, i, j + 2, '#3c8030'); px(x, i, j + 3, '#3c8030');
      px(x, i, j - 1, c); px(x, i - 1, j, c); px(x, i + 1, j, c); px(x, i, j + 1, c);
      px(x, i - 1, j - 1, shade(c, 0.85)); px(x, i + 1, j - 1, c); px(x, i - 1, j + 1, c); px(x, i + 1, j + 1, shade(c, 0.85));
      px(x, i, j, cc);
    };
    fl(7, 7, '#f05a5a'); fl(22, 10, '#f8f8f8'); fl(11, 22, '#f8f8f8'); fl(25, 24, '#f05a5a'); fl(17, 16, '#f8a8d0');
  });
  mk('fence', (x, r) => {
    grass(x, r);
    R_(x, 0, 21, 32, 3, '#4a8a3c'); // sombra
    // trilhos
    R_(x, 0, 11, 32, 4, '#b07a44'); R_(x, 0, 11, 32, 1, '#d0985c'); R_(x, 0, 14, 32, 1, '#7a4a24');
    R_(x, 0, 18, 32, 4, '#b07a44'); R_(x, 0, 18, 32, 1, '#d0985c'); R_(x, 0, 21, 32, 1, '#7a4a24');
    // mourões
    for (const a of [3, 21]) {
      R_(x, a, 6, 7, 22, '#8a5a30'); R_(x, a, 6, 2, 22, '#b07a44'); R_(x, a + 5, 6, 2, 22, '#5a3418');
      R_(x, a, 5, 7, 1, '#d0985c'); R_(x, a + 1, 4, 5, 1, '#d0985c');
      px(x, a + 3, 12, '#5a3418'); px(x, a + 3, 19, '#5a3418');
    }
  });
  mk('sign', (x, r) => {
    grass(x, r);
    E_(x, 16, 29, 8, 2, '#5aa84c');
    R_(x, 14, 17, 5, 13, '#7a4a24'); R_(x, 14, 17, 1, 13, '#9a6a3c'); R_(x, 18, 17, 1, 13, '#5a3418');
    R_(x, 3, 4, 26, 15, '#c08850'); R_(x, 3, 4, 26, 1, '#e0a870'); R_(x, 3, 18, 26, 1, '#7a4a24');
    R_(x, 3, 4, 1, 15, '#e0a870'); R_(x, 28, 4, 1, 15, '#7a4a24');
    R_(x, 5, 6, 22, 11, '#d0a068');
    for (let j = 8; j < 16; j += 3) R_(x, 7, j, 12 + (j % 2) * 5, 1, '#5a3418');
    for (const [a, b] of [[4, 5], [27, 5], [4, 17], [27, 17]]) px(x, a, b, '#5a3418');
  });
  mk('lawn', (x, r) => {
    R_(x, 0, 0, 32, 32, '#98d878');
    for (let j = 0; j < 32; j += 8) { R_(x, 0, j, 32, 4, '#8ccc6c'); R_(x, 0, j, 32, 1, '#a4e084'); }
    for (let k = 0; k < 24; k++) px(x, rr(r, 32), rr(r, 32), '#80c060');
    for (let k = 0; k < 10; k++) px(x, rr(r, 32), rr(r, 32), '#b0e890');
  });
  mk('pool', (x, r, f) => {
    R_(x, 0, 0, 32, 32, '#58a8e8');
    // azulejos
    R_(x, 0, 15, 32, 1, '#7cc0f0'); R_(x, 15, 0, 1, 32, '#7cc0f0');
    R_(x, 0, 31, 32, 1, '#4a98d8'); R_(x, 31, 0, 1, 32, '#4a98d8');
    R_(x, 0, 16, 32, 1, '#4a98d8'); R_(x, 16, 0, 1, 32, '#4a98d8');
    // cáusticas animadas
    const o = f * 6;
    const spots = [[3, 4], [20, 7], [9, 20], [24, 24], [12, 11], [27, 17]];
    for (const [a, b] of spots) {
      const xx = (a + o) % 30, yy = (b + o * 0) % 30;
      R_(x, xx, yy, 4, 1, '#b8e4fc'); R_(x, xx + 1, yy + 1, 3, 1, '#98d0f8'); px(x, xx + 5, yy + 2, '#d8f0ff');
    }
  }, 2);
  Tiles.tree = [Tiles.tree[0], Tiles.tree[0], Tiles.tree[0], Tiles.tree[0]]; // fallback: 4 quartos iguais
  _tilesBuilt = true;
  if (_art) _applyTiles();
  if (_fan) _applyFan();
}

// ---------- Fonte 3x5 para letreiros ----------
const MINI = {
  P: ['111', '101', '111', '100', '100'], F: ['111', '100', '110', '100', '100'],
  C: ['111', '100', '100', '100', '111'], A: ['010', '101', '111', '101', '101'],
  M: ['101', '111', '111', '101', '101'], R: ['110', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'], N: ['101', '111', '111', '111', '101'],
  O: ['111', '101', '101', '101', '111'], G: ['111', '100', '101', '101', '111'],
  U: ['101', '101', '101', '101', '111'], B: ['110', '101', '110', '101', '110'],
  E: ['111', '100', '110', '100', '111'], T: ['111', '010', '010', '010', '010'],
  I: ['111', '010', '010', '010', '111'], D: ['110', '101', '101', '101', '110'],
  S: ['111', '100', '111', '001', '111'], H: ['101', '101', '111', '101', '101'],
  ' ': ['000', '000', '000', '000', '000'],
};
function miniText(x, s, ox, oy, col, sc = 1) {
  x.fillStyle = col;
  [...s].forEach((ch, k) => {
    const g = MINI[ch]; if (!g) return;
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') x.fillRect(ox + k * 4 * sc + i * sc, oy + j * sc, sc, sc); }));
  });
}

// ---------- Prédios ----------
function drawBuildingProc(b) {
  const W = b.w * TILE, H = b.h * TILE;
  const [c, x] = mkCanvas(W, H);
  const R = (i, j, w, h, col) => R_(x, i, j, w, h, col);
  const P = (i, j, col) => P_(x, i, j, col);
  const cxm = W >> 1;

  // janela com moldura, vidro em degradê, reflexo e travessas
  const win = (i, j, w, h, o = {}) => {
    const frame = o.frame || '#3a4560', g1 = o.glass || '#9ccaf0', g2 = shade(g1, 1.22), g3 = shade(g1, 0.82);
    R(i - 1, j - 1, w + 2, h + 2, frame);
    R(i, j, w, h, g1); R(i, j, w, (h * 0.4) | 0, g2); R(i, j + h - 3, w, 3, g3);
    R(i + ((w / 2) | 0) - 1, j, 2, h, o.mull || '#e8ecf4'); R(i, j + ((h / 2) | 0) - 1, w, 2, o.mull || '#e8ecf4');
    for (let k = 0; k < 3; k++) { P(i + 2 + k, j + 4 - k + 1, '#ffffff'); }
    R(i - 2, j + h + 1, w + 4, 2, o.sill || '#c8ccd8'); R(i - 2, j + h + 3, w + 4, 1, shade(o.sill || '#c8ccd8', 0.7));
    if (o.shutters) { R(i - 6, j - 1, 5, h + 2, o.shutters); R(i + w + 1, j - 1, 5, h + 2, o.shutters);
      for (let k = j + 1; k < j + h; k += 3) { R(i - 6, k, 5, 1, shade(o.shutters, 0.7)); R(i + w + 1, k, 5, 1, shade(o.shutters, 0.7)); } }
  };
  // porta dupla centrada (x = W/2 - 14)
  const door = (col, o = {}) => {
    const dw = 28, dh = o.h || 38, dx = cxm - 14, dy = H - dh;
    R(dx - 2, dy - 2, dw + 4, dh + 2, o.frame || shade(col, 0.55));
    R(dx, dy, dw, dh, col);
    R(dx, dy, dw, 3, shade(col, 1.3));
    if (o.glass) { R(dx + 2, dy + 4, 11, dh - 12, o.glass); R(dx + 15, dy + 4, 11, dh - 12, o.glass); R(dx + 2, dy + 4, 11, 4, shade(o.glass, 1.25)); R(dx + 15, dy + 4, 11, 4, shade(o.glass, 1.25)); }
    else { R(dx + 3, dy + 5, 9, dh - 14, shade(col, 0.8)); R(dx + 16, dy + 5, 9, dh - 14, shade(col, 0.8)); R(dx + 3, dy + 5, 9, 1, shade(col, 1.2)); R(dx + 16, dy + 5, 9, 1, shade(col, 1.2)); }
    R(dx + 13, dy, 2, dh, shade(col, 0.6));
    R(dx + 11, dy + (dh >> 1), 2, 3, '#f4c430'); R(dx + 15, dy + (dh >> 1), 2, 3, '#f4c430');
    // degraus
    R(dx - 6, H - 3, dw + 12, 3, '#c8c8d0'); R(dx - 6, H - 3, dw + 12, 1, '#e8e8f0');
    R(dx - 3, H - 6, dw + 6, 3, '#d8d8e0'); R(dx - 3, H - 6, dw + 6, 1, '#f4f4f8');
  };
  // coluna branca com capitel
  const colm = (i, j0, j1, w = 8) => {
    R(i, j0, w, j1 - j0, '#f6f2e4'); R(i, j0, 2, j1 - j0, '#ffffff'); R(i + w - 2, j0, 2, j1 - j0, '#d0c8b0');
    R(i + 3, j0, 1, j1 - j0, '#e4dcc8');
    R(i - 2, j0, w + 4, 3, '#fffaf0'); R(i - 2, j0 + 3, w + 4, 1, '#c8bea4');
    R(i - 2, j1 - 3, w + 4, 3, '#fffaf0'); R(i - 2, j1 - 3, w + 4, 1, '#c8bea4');
  };

  if (b.kind === 'pf') {
    // parede
    R(0, 44, W, H - 44, '#e8e8f0');
    for (let i = 0; i < W; i += 32) { R(i, 44, 1, H - 44, '#d2d6e2'); }
    for (let k = 0; k < 90; k++) P((hash2(k, 1) * W) | 0, 50 + ((hash2(k, 2) * (H - 56)) | 0), '#dcdee8');
    R(0, H - 10, W, 10, '#a8aec0'); R(0, H - 10, W, 1, '#c4cad8');
    // telhado azul-marinho em trapézio
    for (let j = 0; j < 40; j++) {
      const inset = Math.max(0, 8 - j) * 2;
      R(inset - 4 + 4, j, W - inset * 2 - 8 + 4 + 4 - 8 + 8 - 8 + 0, 1, '#1e3a78');
    }
    R(0, 0, W, 0, '#1e3a78');
    for (let j = 0; j < 40; j++) {
      const inset = Math.max(0, 8 - j) * 2;
      const rowc = (j % 5 === 0) ? '#15295c' : '#1e3a78';
      R(inset, j, W - inset * 2, 1, rowc);
      const off = (Math.floor(j / 5) % 2) * 6;
      for (let i = inset + off; i < W - inset; i += 12) if (j % 5 !== 0) P(i, j, '#15295c');
      if (j % 5 === 1) R(inset, j, W - inset * 2, 1, '#2c4e9a');
    }
    R(8, 0, W - 16, 1, '#4a6cbc');
    // beiral
    R(0, 40, W, 6, '#c8ccd8'); R(0, 40, W, 1, '#f0f2f8'); R(0, 45, W, 1, '#8a90a8');
    for (let i = 2; i < W; i += 6) R(i, 43, 3, 2, '#a8aec0');
    // letreiro amarelo
    const sx = cxm - 46;
    R(sx - 2, 6, 96, 30, '#15295c'); R(sx, 8, 92, 26, '#f4c430'); R(sx, 8, 92, 2, '#fbe070'); R(sx, 32, 92, 2, '#c89a14');
    miniText(x, 'PF', sx + 5, 11, '#1e3a78', 4);
    miniText(x, 'POLICIA', sx + 38, 12, '#1e3a78');
    miniText(x, 'FEDERAL', sx + 38, 20, '#1e3a78');
    R(sx + 36, 11, 1, 18, '#c89a14');
    // janelas
    for (const wx of [14, 50, 86]) for (const wy of [56, 94]) {
      win(wx, wy, 26, 24); win(W - wx - 26, wy, 26, 24);
    }
    // marquise sobre a porta
    R(cxm - 30, H - 52, 60, 7, '#1e3a78'); R(cxm - 30, H - 52, 60, 1, '#4a6cbc'); R(cxm - 30, H - 46, 60, 2, '#f4c430');
    R(cxm - 28, H - 44, 2, 6, '#8a90a8'); R(cxm + 26, H - 44, 2, 6, '#8a90a8');
    door('#1e3a78', { glass: '#8cc0e8', h: 36 });
    // bandeira do Brasil menor no canto
    R(W - 20, 46, 2, 14, '#8a8a98'); R(W - 18, 47, 12, 8, '#2a8a3a'); R(W - 15, 48, 6, 6, '#f4d030'); R(W - 14, 50, 4, 2, '#1e3a78');
  } else if (b.kind === 'guanabara') {
    // telhado laranja
    for (let j = 4; j < 34; j++) {
      const inset = Math.floor((34 - j) * 1.1);
      R(inset, j, W - inset * 2, 1, (j % 4 === 0) ? '#b85a1c' : '#d8742c');
      const off = (Math.floor(j / 4) % 2) * 4;
      for (let i = inset + off; i < W - inset; i += 8) if (j % 4 !== 0) P(i, j, '#c4621e');
      if (j % 4 === 1) R(inset, j, W - inset * 2, 1, '#f09a50');
    }
    R(36, 4, W - 72, 2, '#f4b070');
    // parede creme
    R(0, 34, W, H - 34, '#f0e0b8');
    R(0, 34, W, 6, '#d8c690'); R(0, 34, W, 1, '#f8eccc');
    for (let i = 0; i < W; i += 6) R(i, 40, 3, 3, '#e4d4a4'); // dentículos
    for (let k = 0; k < 80; k++) P((hash2(k, 5) * W) | 0, 46 + ((hash2(k, 6) * (H - 52)) | 0), '#e6d6aa');
    R(0, H - 8, W, 8, '#c8b684'); R(0, H - 8, W, 1, '#e0d0a0');
    // pilastras
    for (let i = 10; i < W; i += 38) { if (Math.abs(i + 3 - cxm) < 48) continue; R(i, 44, 6, H - 52, '#faf2d8'); R(i + 4, 44, 2, H - 52, '#d8c890'); }
    // janelas das alas
    for (const wx of [20, 52, 84]) for (const wy of [50, 88]) {
      win(wx, wy, 20, 24, { glass: '#f8e8a8', frame: '#7a5a3a', mull: '#fff8e0', sill: '#fff8e0' });
      win(W - wx - 20, wy, 20, 24, { glass: '#f8e8a8', frame: '#7a5a3a', mull: '#fff8e0', sill: '#fff8e0' });
    }
    // pórtico central com frontão
    const px0 = cxm - 44;
    R(px0, 48, 88, H - 48, '#e8dcb4');
    R(px0 + 6, 54, 76, H - 62, '#8a7a5a');
    for (let j = 8; j < 46; j++) { const hw = Math.round((j - 8) * 1.18 + 2); R(cxm - hw, j, hw * 2, 1, j < 12 ? '#fffaf0' : '#f6ecd0'); }
    for (let j = 18; j < 44; j++) { const hw = Math.round((j - 18) * 0.95 + 2); R(cxm - hw, j, hw * 2, 1, '#e8dab0'); }
    R(cxm - 56, 44, 112, 5, '#fffaf0'); R(cxm - 56, 48, 112, 1, '#c8bea4');
    E_(x, cxm, 32, 5, 5, '#c86a3a'); E_(x, cxm, 32, 3, 3, '#f4d030');
    for (const cc of [px0 - 2, px0 + 26, px0 + 56, px0 + 82]) colm(cc, 49, H - 8, 8);
    door('#6a3e1e', { h: 40 });
  } else if (b.kind === 'congresso') {
    const base = H - 48;
    // torres gêmeas
    const tw = 28, th = base - 6;
    for (const tx of [cxm - 34, cxm + 6]) {
      R(tx, 6, tw, th, '#f0f2f8');
      R(tx + 3, 9, tw - 6, th - 6, '#5f86b8');
      for (let j = 9; j < 9 + th - 6; j += 6) { R(tx + 3, j, tw - 6, 1, '#9cc0e8'); }
      for (let i = tx + 3; i < tx + tw - 3; i += 5) R(i, 9, 1, th - 6, '#7aa0d0');
      R(tx + 3, 9, tw - 6, 10, '#7aa0d0'); R(tx + 3, 9, 3, th - 6, '#8cb4e0');
      R(tx + tw - 5, 9, 2, th - 6, '#4a6e9c');
      R(tx, 6, tw, 1, '#ffffff'); R(tx + tw - 2, 6, 2, th, '#c4c8d8');
      R(tx + 10, 0, 2, 7, '#8a8a98'); R(tx + 17, 2, 1, 5, '#8a8a98'); // antenas
      P(tx + 10, 0, '#d03030');
    }
    for (const by of [62, 98]) { R(cxm - 6, by, 12, 7, '#d8dce8'); R(cxm - 6, by, 12, 1, '#ffffff'); R(cxm - 6, by + 6, 12, 1, '#a0a8bc'); }
    // base (laje)
    R(0, base, W, 48, '#e4e6ec');
    R(0, base, W, 5, '#fafafe'); R(0, base + 5, W, 1, '#b4b8c8');
    for (let i = 0; i < W; i += 12) R(i, base + 6, 1, 38, '#d4d8e2');
    for (const gy of [base + 12, base + 28]) {
      R(0, gy, W, 9, '#4a6a9c'); R(0, gy, W, 3, '#7aa0d0'); R(0, gy + 8, W, 1, '#2e4a74');
      for (let i = 6; i < W; i += 12) R(i, gy, 2, 9, '#e4e6ec');
    }
    R(0, H - 6, W, 6, '#a8aec0'); R(0, H - 6, W, 1, '#c8ccd8');
    // rampa
    for (let k = 0; k < 8; k++) R(cxm - 40 - k * 3, H - 6 - k, 3, 1, '#c8ccd8');
    // cúpula do Senado (esquerda): meia esfera para cima
    Eg(x, 92, base, 62, 36, (i, j, nx, ny) => {
      const v = nx * 0.55 + ny * 0.6;
      if (ny > -0.06) return '#c4c8d8';
      return v > 0.2 ? '#cdd1e0' : v > -0.35 ? '#e8eaf2' : '#fafafe';
    }, 'top');
    for (let a = -50; a <= 50; a += 14) { line(x, 92 + a, base - 1, 92 + Math.round(a * 0.32), base - 34, 'rgba(0,0,0,0)', 1); }
    R(30, base - 4, 124, 4, '#b4b8c8');
    for (let i = 36; i < 150; i += 8) R(i, base - 3, 3, 2, '#5f86b8');
    R(88, base - 42, 8, 6, '#fafafe'); R(90, base - 46, 4, 4, '#d4d8e4');
    // cuia da Câmara (direita): meia esfera aberta para cima
    const bcx = W - 92, bcy = base - 24;
    Eg(x, bcx, bcy, 62, 24, (i, j, nx, ny) => {
      const v = nx * 0.5 - ny * 0.2;
      return v > 0.35 ? '#c0c4d4' : v > -0.3 ? '#dfe2ec' : '#f4f5fa';
    }, 'bot');
    Eg(x, bcx, bcy, 62, 8, (i, j, nx, ny) => (nx * nx + ny * ny > 0.78) ? '#fafafe' : '#8a94ac');
    Eg(x, bcx, bcy + 1, 48, 5, (i, j, nx, ny) => ny < 0 ? '#7a84a0' : '#98a2ba');
    R(bcx - 62, bcy, 124, 1, '#fafafe');
    R(bcx - 30, base - 4, 60, 4, '#b4b8c8');
    // porta central
    R(cxm - 22, base + 5, 44, 6, '#4a6a9c');
    door('#3a4a6a', { glass: '#7aa0d0', h: 30, frame: '#c4c8d8' });
  } else if (b.kind === 'planalto') {
    // fundo de vidro
    R(0, 22, W, H - 22, '#e8eaf0');
    R(6, 34, W - 12, H - 48, '#2e4a68');
    for (let i = 8; i < W - 8; i += 4) { R(i, 36, 2, H - 52, '#5a8ab0'); R(i + 2, 36, 1, H - 52, '#7ab0d4'); }
    for (let j = 40; j < H - 18; j += 18) R(6, j, W - 12, 1, '#1e3248');
    // laje de cobertura
    R(0, 14, W, 14, '#f8f8fa'); R(0, 14, W, 2, '#ffffff'); R(0, 28, W, 3, '#b4b8c8'); R(0, 25, W, 3, '#dcdce6');
    for (let i = 0; i < W; i += 24) R(i, 20, 12, 1, '#e4e4ec');
    // colunas curvas
    const nCol = Math.floor((W - 6) / 24);
    for (let k = 0; k < nCol; k++) {
      const ccx = 15 + k * 24, y0 = 31, y1 = H - 12;
      for (let j = y0; j < y1; j++) {
        const t = (j - y0) / (y1 - y0 - 1);
        const hw = 3 + Math.round(6 * Math.cos(Math.PI * t) ** 2);
        const sw = Math.round(2.5 * Math.sin(Math.PI * t));
        R(ccx - hw + sw, j, hw * 2, 1, '#f6f6f8');
        R(ccx - hw + sw, j, 2, 1, '#ffffff');
        R(ccx + hw - 3 + sw, j, 3, 1, '#c8cad6');
        P(ccx + hw - 1 + sw, j, '#a8acbc');
      }
    }
    // base e rampa
    R(0, H - 12, W, 12, '#d8d8e2'); R(0, H - 12, W, 2, '#f4f4f8'); R(0, H - 3, W, 3, '#a8aec0');
    for (let k = 0; k < 5; k++) R(cxm - 30 - k * 4, H - 12 + k * 2, 60 + k * 8, 2, k % 2 ? '#c4c8d4' : '#e4e6ee');
    door('#2e3a52', { glass: '#6a9ac4', h: 32, frame: '#f4f4f8' });
    // mastro e bandeira
    const fx = W - 36;
    R(fx, 0, 2, 16, '#8a8a98');
    R(fx + 2, 1, 16, 11, '#2a8a3a');
    for (let k = 0; k < 5; k++) { R(fx + 10 - k * 2 - 1, 6 - k, (k * 2 + 1) * 2 - 1, 1, '#f4d030'); R(fx + 10 - k * 2 - 1, 6 + k, (k * 2 + 1) * 2 - 1, 1, '#f4d030'); }
    E_(x, fx + 10, 6, 3, 3, '#1e4aa8');
  } else if (b.kind === 'empresa') {
    // torre de escritórios: vidro cinza-azulado, faixa de letreiro com o nome da empresa e porta de vidro
    const pal = { jf: '#2e7d4f', odebrecht: '#c8a020', rural: '#b02a2a', master: '#3a5fb0' }[b.empresa] || '#5a6a80';
    R(0, 6, W, H - 6, '#4a5260'); R(2, 8, W - 4, H - 10, '#6c7686');
    for (let j = 40; j < H - 20; j += 16) for (let i = 8; i < W - 8; i += 14) {
      R(i, j, 11, 11, '#8fb4d0'); R(i, j, 11, 4, '#b4d4ea'); R(i, j + 8, 11, 3, '#6c94b4'); P(i + 2, j + 2, '#ffffff'); P(i + 3, j + 3, '#ffffff');
    }
    R(0, 0, W, 8, '#2e3440'); R(0, 6, W, 2, '#1c2028');
    R(8, 14, W - 16, 22, pal); R(8, 14, W - 16, 3, shade(pal, 1.3)); R(8, 33, W - 16, 3, shade(pal, 0.6));
    x.fillStyle = '#ffffff'; x.font = 'bold 14px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText((b.label || '').replace(/^(Sede da |Banco )/, m => m === 'Banco ' ? 'BANCO ' : 'SEDE ').toUpperCase().slice(0, 22), cxm, 26);
    x.textAlign = 'left';
    door('#39424f', { glass: '#9ccaf0', h: 34 });
  } else { // casa
    const roof = b.roof || '#c84848', roofD = shade(roof, 0.7), roofL = shade(roof, 1.25);
    // chaminé
    R(W - 50, 2, 16, 34, '#a85a44'); R(W - 50, 2, 16, 3, '#c87a64'); R(W - 36, 2, 2, 34, '#7a3a2c');
    for (let j = 8; j < 34; j += 5) R(W - 50, j, 16, 1, '#8a4636');
    // paredes
    R(0, 38, W, H - 38, '#f0e8d8');
    for (let j = 46; j < H - 6; j += 6) R(0, j, W, 1, '#e0d6c0');
    R(0, H - 6, W, 6, '#b0a490'); R(0, H - 6, W, 1, '#cfc4ae');
    // telhado
    for (let j = 6; j < 42; j++) {
      const inset = Math.floor((42 - j) * 0.55);
      const edge = j % 5 === 0;
      R(inset, j, W - inset * 2, 1, edge ? roofD : roof);
      const off = (Math.floor(j / 5) % 2) * 5;
      if (!edge) for (let i = inset + off; i < W - inset; i += 10) P(i, j, roofD);
      if (j % 5 === 1) R(inset, j, W - inset * 2, 1, roofL);
    }
    R(12, 6, W - 24, 2, roofL); R(0, 40, W, 3, roofD); R(0, 38, W, 2, shade(roof, 0.9));
    // janelas com venezianas e floreira
    const wy = 58, ww = 22, wh = 26;
    for (const wx of [24, W - 24 - ww]) {
      win(wx, wy, ww, wh, { shutters: '#4a7a5a', sill: '#f6f0e0' });
      R(wx - 2, wy + wh + 4, ww + 4, 5, '#7a4a24'); R(wx - 2, wy + wh + 4, ww + 4, 1, '#9a6a3c');
      for (let i = wx; i < wx + ww; i += 4) { R(i, wy + wh + 2, 3, 2, '#3c8030'); P(i + 1, wy + wh + 1, i % 8 ? '#f05a5a' : '#f8f8f8'); }
    }
    door('#7a4a24', { h: 40 });
    P(cxm + 8, H - 22, '#f4c430');
  }
  outline(c);
  return c;
}

// ---------- Pessoas (agente e NPCs) 32x32 ----------
const personCache = {};
function drawPerson(x, look, d, frame) {
  const R = (i, j, w, h, col) => R_(x, i, j, w, h, col);
  const P = (i, j, col) => P_(x, i, j, col);
  const skin = look.skin || '#f0c098', skinD = shade(skin, 0.82), skinL = shade(skin, 1.1);
  const hair = look.hair || '#2a2220', hairD = shade(hair, 0.7), hairL = shade(hair, 1.3);
  const shirt = look.shirt, shirtD = shade(shirt, 0.7), shirtL = shade(shirt, 1.35);
  const pants = look.pants || '#2e2e3a', pantsD = shade(pants, 0.7);
  const shoe = '#15151c';
  const cap = look.cap, capD = cap ? shade(cap, 0.65) : null, capL = cap ? shade(cap, 1.4) : null;
  const lL = frame === 1, lR = frame === 2; // perna levantada
  const trim = (i, j, w, h, col) => { // retângulo com cantos cortados
    R(i, j + 1, w, h - 2, col); R(i + 1, j, w - 2, h, col);
  };
  if (d === 'down' || d === 'up') {
    // pernas
    R(11, 25, 5, lL ? 3 : 4, pants); R(16, 25, 5, lR ? 3 : 4, pants);
    R(11, 25, 1, 3, shade(pants, 1.25)); R(15, 26, 1, 2, pantsD); R(20, 25, 1, 3, pantsD);
    R(10, lL ? 28 : 29, 6, lL ? 2 : 2, shoe); R(16, lR ? 28 : 29, 6, 2, shoe);
    R(10, lL ? 28 : 29, 6, 1, '#34343e'); R(16, lR ? 28 : 29, 6, 1, '#34343e');
    // tronco
    trim(9, 15, 14, 10, shirt);
    R(9, 16, 2, 8, shirtL); R(20, 16, 3, 9, shirtD);
    R(9, 23, 14, 1, '#0e0e14'); R(15, 23, 2, 1, '#f4c430');
    // braços
    const ay = (lL ? 1 : 0), by = (lR ? 1 : 0);
    R(6, 16 + ay, 3, 8, shirt); R(6, 16 + ay, 1, 8, shirtL); R(23, 16 + by, 3, 8, shirt); R(25, 16 + by, 1, 8, shirtD);
    R(6, 24 + ay, 3, 2, skin); R(23, 24 + by, 3, 2, skin); R(8, 25 + ay, 1, 1, skinD); R(23, 25 + by, 1, 1, skinD);
    R(14, 15, 4, 1, skinD);
    if (d === 'down') {
      if (look.stripe) { R(9, 19, 14, 1, look.stripe); R(9, 20, 14, 1, shade(look.stripe, 0.75)); }
      if (look.badge) { R(12, 17, 3, 3, look.badge); P(13, 18, shirtD); }
      R(17, 17, 3, 1, shirtL);
    } else if (look.back) {
      miniText(x, 'PF', 12, 17, look.back);
      if (look.stripe) R(9, 23 - 1, 14, 0, look.stripe);
    }
    // cabeça
    trim(10, 5, 12, 11, skin);
    R(10, 6, 2, 8, skinL); R(20, 7, 2, 8, skinD);
    R(9, 10, 1, 3, skinD); R(22, 10, 1, 3, skinD);
    if (d === 'down') {
      if (!cap || true) {
        R(10, 4, 12, 4, hair); R(11, 3, 10, 1, hair); R(9, 6, 2, 5, hair); R(21, 6, 2, 5, hair);
        R(11, 8, 3, 1, hair); R(18, 8, 3, 1, hair); R(12, 4, 4, 1, hairL); R(10, 7, 12, 1, hairD);
      }
      R(12, 11, 2, 3, '#222'); R(18, 11, 2, 3, '#222'); P(12, 11, '#fff'); P(18, 11, '#fff');
      R(15, 14, 2, 1, shade(skin, 0.6));
    } else {
      R(10, 4, 12, 11, hair); R(11, 3, 10, 1, hair); R(9, 6, 2, 6, hair); R(21, 6, 2, 6, hair);
      R(12, 5, 4, 1, hairL); R(10, 12, 12, 3, hairD); R(14, 14, 4, 2, skinD);
    }
    if (cap) {
      trim(10, 2, 12, 7, cap); R(11, 1, 10, 1, cap);
      R(11, 2, 10, 1, capL); R(20, 3, 2, 5, capD); R(10, 7, 12, 1, capD);
      if (d === 'down') {
        R(8, 8, 16, 2, capD); R(9, 8, 14, 1, shade(cap, 0.85)); R(9, 10, 14, 1, shade(skin, 0.7));
        if (look.capMark) { R(14, 3, 4, 4, look.capMark); P(15, 4, cap); P(16, 5, cap); R(14, 3, 4, 1, shade(look.capMark, 1.3)); }
      } else {
        R(10, 7, 12, 2, capD); P(15, 3, capD); P(16, 3, capD); P(15, 6, capL);
        if (look.capMark) { R(14, 5, 4, 1, look.capMark); }
      }
    }
  } else {
    // lado (esquerda)
    const f1 = lL, f2 = lR;
    // perna de trás
    R(f2 ? 10 : 15, 25, 5, f1 ? 3 : 4, pantsD); R(f2 ? 8 : 15, f1 ? 28 : 29, 6, 2, shoe);
    // perna da frente
    R(f1 ? 9 : 12, 25, 5, 4, pants); R(f1 ? 6 : 10, 28, 7, 2, shoe); R(f1 ? 6 : 10, 28, 7, 1, '#34343e');
    if (!f1 && !f2) { R(14, 25, 5, 4, pants); R(15, 29, 6, 2, shoe); }
    // tronco
    trim(11, 15, 10, 10, shirt);
    R(11, 16, 2, 8, shirtL); R(19, 16, 2, 9, shirtD); R(11, 23, 10, 1, '#0e0e14');
    if (look.stripe) { R(11, 19, 10, 1, look.stripe); R(11, 20, 10, 1, shade(look.stripe, 0.75)); }
    // braço
    const sw = f1 ? -1 : f2 ? 1 : 0;
    R(14 + sw, 16, 4, 8, shirtD); R(14 + sw, 16, 1, 8, shirt); R(14 + sw, 24, 4, 2, skin); R(14 + sw, 25, 1, 1, skinD);
    // cabeça
    trim(10, 5, 12, 11, skin);
    R(10, 6, 2, 8, skinL);
    R(8, 11, 2, 2, skin); P(8, 12, skinD); // nariz
    R(14, 10, 3, 4, skinD); P(15, 11, shade(skin, 0.6)); // orelha
    R(16, 4, 6, 11, hair); R(11, 4, 5, 3, hair); R(10, 4, 12, 1, hairL); R(19, 9, 3, 6, hairD); R(13, 4, 3, 7, hair);
    R(11, 7, 1, 1, hair);
    R(11, 11, 2, 3, '#222'); P(11, 11, '#fff');
    R(9, 14, 3, 1, shade(skin, 0.6));
    if (cap) {
      trim(10, 2, 12, 7, cap); R(11, 1, 10, 1, cap); R(11, 2, 10, 1, capL); R(19, 3, 3, 5, capD); R(10, 7, 12, 1, capD);
      R(5, 7, 7, 2, capD); R(5, 7, 7, 1, shade(cap, 0.9)); R(6, 9, 5, 1, shade(skin, 0.7));
      if (look.capMark) { R(11, 3, 4, 3, look.capMark); P(12, 4, cap); }
    }
  }
}
function personSprite(look, dir, frame = 0) {
  const key = JSON.stringify(look) + dir + frame;
  if (personCache[key]) return personCache[key];
  if (_fan) { const pf = _fanPerson(look, dir, frame); if (pf) return (personCache[key] = pf); }
  if (_fan) { const pf = _fanPerson(look, dir, frame); if (pf) return (personCache[key] = pf); }
  if (_art) { const pc = _artPerson(look, dir, frame); if (pc) return (personCache[key] = pc); }
  const [c, x] = mkCanvas(32, 32);
  if (dir === 'right') {
    const [t, tx] = mkCanvas(32, 32);
    drawPerson(tx, look, 'left', frame);
    x.save(); x.translate(32, 0); x.scale(-1, 1); x.drawImage(t, 0, 0); x.restore();
  } else drawPerson(x, look, dir, frame);
  outline(c);
  personCache[key] = c;
  return c;
}

const AGENT_LOOK = { skin: '#e8b48a', hair: '#2a2220', shirt: '#1a1a22', pants: '#2e2e3a', cap: '#14141a', capMark: '#f4c430', stripe: '#f4c430', badge: '#f4c430', back: '#f4c430' };

// ---------- Políticos 96x96 ----------
const polCache = {};
const customSprites = {};

// sprites/index.json lista os PNGs disponíveis, ex.: ["golpenaro", "golpenaro_back"]
function loadCustomSprites() {
  const list = location.protocol === 'file:' && window.SPRITE_LIST ? Promise.resolve(window.SPRITE_LIST)
    : fetch('sprites/index.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : window.SPRITE_LIST || []).catch(() => window.SPRITE_LIST || []);
  return list.then(names => Promise.all(names.map(n => new Promise(res => {
    const img = new Image();
    img.onload = () => { customSprites[n] = img; res(); };
    img.onerror = res;
    img.src = `sprites/${n}.png?v=${Date.now()}`;
  })))).then(() => { for (const k in polCache) delete polCache[k]; });
}

function politicoSprite(p, back = false) {
  const key = p.id + (back ? '1' : '0');
  if (polCache[key]) return polCache[key];
  const custom = customSprites[p.id + (back ? '_back' : '')] || (!back && customSprites[p.id]);
  if (custom) {
    const [c, x] = mkCanvas(96, 96);
    x.drawImage(custom, 0, 0, 96, 96);
    hardAlpha(c);
    return (polCache[key] = c);
  }
  const a = p.art || {};
  const [c, x] = mkCanvas(96, 96);
  const R = (i, j, w, h, col) => R_(x, i, j, w, h, col);
  const P = (i, j, col) => P_(x, i, j, col);
  const skin = a.skin || '#e8b48a';
  const skL = shade(skin, 1.12), skD = shade(skin, 0.84), skDD = shade(skin, 0.66);
  const hc = (typeof HC !== 'undefined' && HC[a.hc]) || a.hc || '#2a2220';
  const hcD = shade(hc, 0.72), hcL = shade(hc, 1.3);
  const suit = a.suit || '#2b3445', suitD = shade(suit, 0.7), suitL = shade(suit, 1.3);
  const tie = a.tie || '#b03030', shirt = a.shirt || '#f4f4f4';
  const female = !!a.female, big = !!a.big;
  const acc = a.acc;

  // geometria da cabeça
  const cx = 48;
  const cy = back ? 48 : 38;
  const rx = (back ? 26 : 22) + (big ? 3 : 0), ry = back ? 29 : 26;
  const inHead = (i, j) => {
    const dy = (j + 0.5 - cy) / (ry + 0.5);
    const k = j > cy ? 1 - 0.2 * dy * dy : 1;
    return ((i + 0.5 - cx) / ((rx + 0.5) * k)) ** 2 + dy * dy <= 1;
  };
  const headBox = (fn) => { for (let j = cy - ry; j <= cy + ry; j++) for (let i = cx - rx - 1; i <= cx + rx + 1; i++) if (inHead(i, j)) fn(i, j); };

  // ----- corpo -----
  const by0 = back ? 74 : 62;
  const bodyHW = (j) => {
    const base = (back ? 34 : 26) + Math.floor((j - by0) * (back ? 0.9 : 1.4)) + (big ? 5 : 0);
    const round = Math.max(0, 5 - (j - by0));
    return Math.min(47, base - round * 2);
  };
  for (let j = by0; j < 96; j++) {
    const hw = bodyHW(j);
    for (let i = cx - hw; i < cx + hw; i++) {
      const t = (i - cx) / hw;
      let col = suit;
      if (t > 0.55) col = suitD; else if (t < -0.7 && j < by0 + 14) col = suitL; else if (t < -0.35 && j < by0 + 8) col = suitL;
      if ((j + i) % 9 === 0 && !back && t > -0.4 && t < 0.4 && hash2(i, j) > 0.82) col = shade(suit, 0.94);
      P(i, j, col);
    }
  }
  // pescoço
  if (!back) {
    R(cx - 9, 54, 18, 14, skD); R(cx - 9, 54, 5, 14, skin); R(cx - 9, 62, 18, 2, skDD);
  } else {
    R(cx - 12, 70, 24, 12, skD); R(cx - 12, 70, 6, 12, skin);
  }

  if (!back) {
    // camisa em V
    for (let j = 62; j < 90; j++) {
      const h = Math.max(0, 11 - Math.floor((j - 62) * 0.42));
      if (h) { R(cx - h, j, h * 2, 1, shirt); R(cx + h - 4, j, 4, 1, shade(shirt, 0.84)); }
    }
    if (female) {
      // blusa/decote e colar
      for (let j = 62; j < 76; j++) { const h = Math.max(0, 11 - Math.floor((j - 62) * 0.7)); if (h) R(cx - h, j, h * 2, 1, skin); }
      for (let k = -10; k <= 10; k++) P(cx + k, 66 + Math.floor(k * k / 14), '#f0d060');
      P(cx, 71, '#f8f0a0'); P(cx, 72, '#f0d060');
    } else {
      // gola
      for (let k = 0; k < 8; k++) { R(cx - 12 + k, 62 + k, 3, 1, '#ffffff'); R(cx + 9 - k, 62 + k, 3, 1, shade(shirt, 0.88)); }
      // gravata
      R(cx - 4, 66, 8, 6, tie); R(cx - 4, 66, 8, 1, shade(tie, 1.3)); R(cx + 1, 66, 3, 6, shade(tie, 0.78));
      for (let j = 72; j < 94; j++) {
        const w = Math.round(5 + Math.sin((j - 72) / 22 * Math.PI * 0.8) * 4) - (j > 90 ? j - 90 : 0);
        R(cx - w, j, w * 2, 1, tie); R(cx + Math.floor(w / 3), j, w - Math.floor(w / 3), 1, shade(tie, 0.78)); R(cx - w, j, 2, 1, shade(tie, 1.25));
        if ((j % 6) < 2) R(cx - w + 2, j, w * 2 - 4, 1, shade(tie, 0.9));
      }
    }
    // lapelas
    for (let j = 64; j < 94; j++) {
      const inner = Math.max(1, 11 - Math.floor((j - 62) * 0.42));
      const lw = j < 80 ? 9 : Math.max(0, 9 - (j - 80));
      if (lw > 0) {
        R(cx - inner - lw, j, lw, 1, suitL); R(cx - inner - lw, j, 1, 1, shade(suit, 0.55));
        R(cx + inner, j, lw, 1, suit); R(cx + inner + lw - 1, j, 1, 1, shade(suit, 0.55));
      }
      P(cx - inner - 1, j, suitD); P(cx + inner, j, suitD);
    }
    // botões e bolso
    if (!female) { P(cx - 1, 90, '#d8c878'); R(cx - 2, 90, 4, 3, shade(suit, 0.6)); R(cx - 1, 91, 2, 1, '#d8c878'); }
    R(cx + 14, 76, 9, 2, suitD); R(cx + 14, 74, 6, 2, '#f4f4f4');
  } else {
    // costas: gola e costura
    for (let k = 0; k < 18; k++) { const w = 12 + k; if (74 + k > 95) break; }
    R(cx - 14, 74, 28, 3, '#f4f4f4'); R(cx - 14, 76, 28, 1, '#c8c8d0');
    R(cx - 1, 77, 2, 19, suitD);
    R(cx - 30, 78, 14, 1, suitD); R(cx + 16, 78, 14, 1, suitD);
    // ombros destacados
    for (let k = 0; k < 6; k++) P(cx - 32 + k, 76 + k, suitL);
  }

  // ----- cabeça (sombreada em 3 tons + contorno interno) -----
  headBox((i, j) => {
    const nx = (i + 0.5 - cx) / (rx + 0.5), ny = (j + 0.5 - cy) / (ry + 0.5);
    const edge = !inHead(i - 1, j) || !inHead(i + 1, j) || !inHead(i, j + 1) || !inHead(i, j - 1);
    const v = nx * 0.65 + ny * 0.35;
    let col = skin;
    if (v > 0.5) col = skD; else if (v < -0.5) col = skL;
    if (edge) col = skDD;
    P(i, j, col);
  });
  // orelhas
  const ear = (sx) => {
    const ex = cx + sx * (rx + 1), ey = cy + (back ? 2 : 3);
    Eg(x, ex, ey, 3, 6, (i, j, nx, ny) => (Math.abs(nx) < 0.35 && Math.abs(ny) < 0.5) ? skDD : (sx > 0 ? skD : skin));
  };
  ear(-1); ear(1);

  // ----- cabelo -----
  const hairPx = (pred) => {
    for (let j = cy - ry - 8; j <= cy + ry + 22; j++) for (let i = cx - rx - 10; i <= cx + rx + 10; i++) {
      if (!pred(i, j)) continue;
      const nx = (i - cx) / rx, ny = (j - cy) / ry;
      let col = hc;
      const n = hash2(i, j, 3);
      const strand = (i * 2 + (j >> 2)) % 5 === 0;
      if (nx + ny * 0.6 > 0.55) col = hcD; else if (nx + ny * 0.6 < -0.5) col = hcL;
      if (strand && n > 0.35) col = col === hcD ? shade(hc, 0.6) : (col === hcL ? hc : hcD);
      else if (n > 0.93) col = hcL;
      P(i, j, col);
    }
  };
  const vol = (i, j, m = 2) => inE(i, j, cx, cy - 2, rx + m, ry + m - 1);
  const hairline = (i) => cy - 12 + Math.round(6 * ((i - cx) / rx) ** 2);
  const sideburn = (i, j, to) => inHead(i, j) && Math.abs(i - cx) > rx - 4 && j < cy + to;
  if (!back) {
    switch (a.hair) {
      case 'short': hairPx((i, j) => (vol(i, j) && j < hairline(i)) || (vol(i, j) && sideburn(i, j, 1))); break;
      case 'side':
        hairPx((i, j) => (vol(i, j, 3) && j < hairline(i) + (i < cx - 2 ? -2 : 0)) || (vol(i, j) && sideburn(i, j, 1)));
        for (let j = cy - 22; j < cy - 10; j++) P(cx - 7 + Math.floor((j - cy + 22) / 4), j, hcD);
        break;
      case 'slick':
        hairPx((i, j) => (vol(i, j) && j < hairline(i) + 1) || (vol(i, j) && sideburn(i, j, 0)));
        for (let k = 0; k < 4; k++) R(cx - 12 + k * 2, cy - 22 + k * 3, 14 - k, 1, shade(hc, 1.5));
        break;
      case 'wavy':
        hairPx((i, j) => (vol(i, j, 4) && j < hairline(i) + 2 + Math.round(2 * Math.sin(i / 2.5))) || (vol(i, j, 3) && sideburn(i, j, 3)));
        break;
      case 'receding':
        hairPx((i, j) => (vol(i, j) && j < cy - 14 && Math.abs(i - cx) > 12 && j < hairline(i) + 6) || (vol(i, j) && sideburn(i, j, 0) && j > cy - 16));
        R(cx - 8, cy - 22, 5, 2, skL); R(cx - 6, cy - 20, 3, 1, skL); // brilho da testa
        break;
      case 'long':
        hairPx((i, j) => (vol(i, j, 3) && j < hairline(i) + 1) || (j >= cy - 10 && j < cy + ry + 14 && Math.abs(i - cx) > rx - 4 && Math.abs(i - cx) <= rx + 5 && vol(i, j, 9)) || (vol(i, j, 3) && j < cy - 4 && i < cx - 4));
        break;
      case 'bob':
        hairPx((i, j) => (vol(i, j, 3) && j < cy - 8 + Math.round(3 * ((i - cx) / rx) ** 2)) || (j >= cy - 10 && j < cy + 12 && Math.abs(i - cx) > rx - 4 && Math.abs(i - cx) <= rx + 4 && vol(i, j, 8)));
        break;
      case 'bald': default:
        if (a.sides) hairPx((i, j) => vol(i, j, 1) && Math.abs(i - cx) > rx - 4 && j > cy - 12 && j < cy + 4 && inHead(i, j));
        else { R(cx - 10, cy - 22, 6, 2, skL); R(cx - 8, cy - 20, 3, 1, skL); }
        break;
    }
    // ----- rosto -----
    const ey = cy + 1;
    const brow = (hc === HC_WHITE_FIX(hc)) ? '#7a7a7a' : shade(hc, 0.75);
    // sobrancelhas (direita levantada = ar de deboche)
    for (let k = 0; k < 11; k++) {
      R(cx - 16 + k, ey - 9 + (k > 6 ? 1 : 0), 1, 3, brow);
      R(cx + 5 + k, ey - 10 - (k < 5 ? 1 - (k >> 2) : 0) + (k > 8 ? 2 : 0), 1, 3, brow);
    }
    // olhos
    const eye = (ex, dx) => {
      Eg(x, ex, ey, 5, 4, (i, j, nx, ny) => ny < -0.3 ? null : '#f6f6f6');
      R(ex - 5, ey - 2, 11, 1, '#2a1a14'); // pálpebra caída
      R(ex - 5, ey - 4, 11, 2, skD); R(ex - 3, ey - 5, 7, 1, skDD);
      Eg(x, ex + dx, ey + 1, 2, 2, (i, j, nx, ny) => (Math.abs(nx) < 0.4 && Math.abs(ny) < 0.4) ? '#0c0c10' : '#4a3020');
      P(ex + dx - 1, ey, '#ffffff');
      R(ex - 5, ey + 3, 11, 1, skD);
    };
    eye(cx - 10, 1); eye(cx + 10, 1);
    // nariz
    const nT = ey + 12;
    R(cx + 1, ey - 2, 3, 12, skD); R(cx - 2, ey + 4, 2, 6, skin);
    R(cx - 5, nT - 3, 11, 4, skin); R(cx - 5, nT + 1, 11, 2, skD);
    R(cx - 5, nT - 1, 3, 3, skL); R(cx + 3, nT - 1, 3, 3, skD);
    R(cx - 4, nT + 1, 2, 2, skDD); R(cx + 3, nT + 1, 2, 2, skDD); R(cx - 3, nT - 3, 3, 1, skL);
    // boca (sorriso debochado)
    const my = cy + 17;
    const lipC = female ? '#c83048' : '#c07070';
    R(cx - 10, my - 2, 20, 2, lipC); R(cx - 10, my - 2, 20, 1, shade(lipC, 1.2));
    R(cx - 9, my, 18, 4, '#5a1c1c');
    R(cx - 8, my, 16, 2, '#fafafa'); for (let k = -8; k < 8; k += 4) R(cx + k, my, 1, 2, '#d8d8e0');
    R(cx - 8, my + 2, 16, 1, '#8a2c2c');
    R(cx - 8, my + 4, 16, 2, lipC); R(cx - 6, my + 6, 12, 1, shade(lipC, 0.8));
    R(cx + 10, my - 3, 2, 3, skDD); R(cx + 12, my - 4, 1, 2, skDD); R(cx - 11, my - 1, 1, 3, skDD); // covinhas
    R(cx - 5, my + 8, 10, 1, skD); // sombra do queixo
    if (female) { R(cx - 14, ey + 8, 5, 3, '#f09a90'); R(cx + 10, ey + 8, 5, 3, '#e88a80'); }
    // barba / bigode
    const bc = (typeof HC !== 'undefined' && HC[a.bc]) || a.bc || hc;
    const bcD = shade(bc, 0.72), bcL = shade(bc, 1.25);
    const bpx = (i, j) => P(i, j, hash2(i, j, 8) > 0.8 ? bcL : ((i * 2 + j) % 5 === 0 ? bcD : bc));
    if (a.beard === 'full') {
      for (let j = my - 8; j <= cy + ry; j++) for (let i = cx - rx - 1; i <= cx + rx + 1; i++) {
        if (!inHead(i, j)) continue;
        const insideMouth = j >= my - 2 && j <= my + 6 && Math.abs(i - cx) < 11;
        const nose = j < my - 3 && Math.abs(i - cx) < 14;
        const cheekTop = j < my - 8 + Math.abs(i - cx) * 0.5;
        if (insideMouth || nose || cheekTop) continue;
        bpx(i, j);
      }
      R(cx - 12, my - 6, 24, 4, bc); R(cx - 9, my - 3, 18, 1, bcD);
      R(cx - 11, my - 2, 22, 1, bc);
      R(cx - 9, my - 2, 18, 2, lipC); R(cx - 8, my, 16, 2, '#fafafa'); R(cx - 9, my + 2, 18, 2, '#5a1c1c'); R(cx - 8, my + 4, 16, 2, lipC);
    }
    if (a.beard === 'stubble') {
      for (let j = my - 6; j <= cy + ry; j++) for (let i = cx - rx; i <= cx + rx; i++) {
        if (inHead(i, j) && (i + j) % 2 === 0 && hash2(i, j, 4) > 0.3 && !(j >= my - 1 && j <= my + 6 && Math.abs(i - cx) < 11)) P(i, j, shade(skDD, 0.7));
      }
    }
    if (a.beard === 'mustache') { R(cx - 13, my - 8, 26, 5, bc); R(cx - 11, my - 3, 22, 1, bcD); R(cx - 14, my - 6, 3, 6, bc); R(cx + 11, my - 6, 3, 6, bc); R(cx - 1, my - 8, 2, 1, bcD); R(cx - 12, my - 8, 8, 1, bcL); }
    // óculos
    if (a.glasses) {
      const fr = '#1e1e28';
      for (const ex of [cx - 10, cx + 10]) {
        R(ex - 8, ey - 7, 17, 2, fr); R(ex - 8, ey + 5, 17, 2, fr); R(ex - 8, ey - 7, 2, 14, fr); R(ex + 7, ey - 7, 2, 14, fr);
        R(ex - 5, ey - 4, 3, 1, '#ffffff'); R(ex - 4, ey - 3, 2, 1, '#cfe8ff');
      }
      R(cx - 2, ey - 3, 4, 2, fr);
      R(cx - rx, ey - 5, rx - 18, 2, fr); R(cx + 18, ey - 5, rx - 18, 2, fr);
    }
  } else {
    // ----- costas da cabeça: cabelo -----
    switch (a.hair) {
      case 'bald': if (a.sides) hairPx((i, j) => inHead(i, j) && j > cy - 6 && j < cy + 18 && Math.abs(i - cx) > 6); else { R(cx - 12, cy - 22, 7, 2, skL); R(cx - 10, cy - 20, 4, 1, skL); } break;
      case 'long': hairPx((i, j) => (vol(i, j, 3) && j < cy + ry - 2) || (j >= cy && j < cy + ry + 22 && Math.abs(i - cx) <= rx + 4 && vol(i, j, 14))); break;
      case 'bob': hairPx((i, j) => (vol(i, j, 3) && j < cy + 18) || (j >= cy && j < cy + 20 && Math.abs(i - cx) <= rx + 3 && vol(i, j, 8))); break;
      case 'receding': hairPx((i, j) => vol(i, j, 2) && j > cy - 14 && j < cy + 16 && inHead(i, j)); R(cx - 14, cy - 12, 8, 2, skL); break;
      case 'wavy': hairPx((i, j) => vol(i, j, 5) && j < cy + 14 + Math.round(2 * Math.sin(i / 2.5))); break;
      default: hairPx((i, j) => vol(i, j, 3) && j < cy + 14 - Math.round(3 * (1 - Math.abs(i - cx) / rx) ** 2 * 3));
    }
    // risca/redemoinho
    for (let k = 0; k < 8; k++) P(cx + 4 + k, cy - 20 + k, hcD);
    if (a.beard === 'full' || a.beard === 'mustache') { for (let k = 0; k < 6; k++) { P(cx - rx + 1, cy + 4 + k, hc); P(cx + rx - 1, cy + 4 + k, hc); } }
  }

  // ----- chapéus (visíveis de frente e de costas) -----
  if (acc === 'guardanapo') {
    const gy = cy - ry - 3;
    Eg(x, cx, gy + 8, rx + 4, 10, (i, j, nx, ny) => ny > 0.4 ? null : (nx > 0.4 ? '#c8c8d4' : (((i + j) % 11 === 0) ? '#e0e0e8' : '#fafafa')), 'top');
    R(cx - rx - 4, gy + 8, 2 * rx + 9, 3, '#e8e8f0'); R(cx - rx - 4, gy + 10, 2 * rx + 9, 1, '#a8a8b8');
    R(cx - 8, gy + 1, 2, 7, '#d0d0dc'); R(cx + 6, gy + 2, 2, 6, '#d0d0dc');
    for (let k = 0; k < 4; k++) P(cx - 12 + k * 7, gy + 5 + (k % 2), '#c0c0cc');
    R(cx - 4, gy - 3, 8, 4, '#fafafa');
  }
  if (acc === 'bone') {
    const gy = cy - ry + 1;
    Eg(x, cx, gy + 10, rx + 2, 12, (i, j, nx, ny) => ny > 0 ? null : (nx > 0.4 ? '#a01818' : (nx < -0.5 ? '#e04040' : '#c82828')), 'top');
    if (!back) {
      R(cx - rx - 8, gy + 10, 2 * rx + 12, 3, '#a01818'); R(cx - rx - 8, gy + 10, 2 * rx + 12, 1, '#d83838');
      R(cx - 5, gy + 2, 10, 4, '#f4f4f4'); R(cx - 4, gy + 3, 8, 1, '#c82828');
    } else {
      R(cx - rx - 2, gy + 10, 2 * rx + 5, 3, '#a01818');
      R(cx - 6, gy + 11, 12, 3, '#8a1010'); for (let k = 0; k < 6; k++) P(cx - 5 + k * 2, gy + 12, '#4a0808');
    }
    P(cx, gy - 1, '#a01818'); R(cx - 1, gy, 3, 1, '#c82828');
  }

  // ----- acessórios (só de frente) -----
  const hand = (hx, hy) => {
    Eg(x, hx + 6, hy + 5, 7, 6, (i, j, nx, ny) => (nx > 0.4 || ny > 0.5) ? skD : (nx < -0.5 ? skL : skin));
    for (let k = 1; k < 4; k++) R(hx + 1, hy + 1 + k * 2, 6, 1, skDD);
    R(hx + 9, hy + 3, 2, 4, skD);
  };
  if (!back) switch (acc) {
    case 'faixa':
      for (let k = 0; k < 40; k++) {
        const sx = cx - 28 + Math.round(k * 1.1), sy = 63 + Math.round(k * 0.78);
        R(sx, sy, 8, 6, '#2a9a3a'); R(sx, sy, 8, 1, '#4cc45c'); R(sx + 2, sy + 4, 6, 1, '#1e7a2c');
        if (k % 6 === 0) P(sx + 4, sy + 3, '#f4d030');
      }
      R(cx + 8, 90, 7, 6, '#f4d030'); P(cx + 11, 92, '#2a9a3a');
      break;
    case 'cash':
      for (let k = 0; k < 3; k++) { bx(x, 66 + k, 66 + k * 3, 26, 14, k === 1 ? '#5aaa5a' : '#4a9a4a'); R(x, 0, 0, 0, 0, '#000'); }
      R(70, 70, 18, 8, '#7ac87a'); Eg(x, 79, 74, 4, 3, () => '#4a9a4a'); R(78, 72, 2, 5, '#c8f0c8');
      R(66, 79, 26, 2, '#c8a838');
      hand(72, 78);
      break;
    case 'mala':
      R(74, 62, 2, 8, '#3a2210'); R(84, 62, 2, 8, '#3a2210'); R(74, 60, 12, 3, '#3a2210'); R(76, 62, 8, 1, '#7a4a24');
      bx(x, 62, 68, 32, 24, '#7a4a24');
      R(62, 78, 32, 2, '#4a2a14'); R(62, 68, 32, 3, '#9a6a3c'); R(76, 77, 4, 5, '#f4d030'); R(77, 78, 2, 2, '#a08010');
      for (const sx of [66, 88]) R(sx, 68, 2, 24, '#5a3418');
      hand(72, 56);
      break;
    case 'malas':
      for (const mx of [1, 71]) {
        R(mx + 8, 60, 2, 8, '#3a2210'); R(mx + 14, 60, 2, 8, '#3a2210'); R(mx + 8, 58, 8, 3, '#3a2210');
        bx(x, mx, 66, 24, 22, '#7a4a24'); R(mx, 75, 24, 2, '#4a2a14'); R(mx + 9, 74, 4, 5, '#f4d030');
        R(mx + 2, 70, 20, 3, '#4a9a4a'); R(mx + 4, 69, 8, 2, '#78c878');
      }
      break;
    case 'granada':
      R(76, 56, 12, 4, '#8a8a92'); R(88, 56, 6, 2, '#c8c8d0'); ring(x, 91, 54, 3, 1, '#f4d030');
      Eg(x, 82, 70, 9, 10, (i, j, nx, ny) => (nx * 0.6 + ny * 0.5 > 0.35) ? '#34582a' : (nx + ny < -0.7 ? '#88b868' : '#4a7a34'));
      for (let k = 62; k < 80; k += 5) R(74, k, 16, 1, '#2a4a20'); for (let k = 74; k < 90; k += 5) R(k, 62, 1, 18, '#2a4a20');
      hand(76, 76);
      break;
    case 'arma':
      bx(x, 60, 66, 32, 9, '#4a4a52'); R(62, 68, 28, 2, '#7a7a86'); R(60, 66, 4, 9, '#34343c'); R(70, 71, 12, 1, '#2a2a30');
      bx(x, 78, 74, 10, 18, '#34343c'); R(80, 76, 1, 12, '#52525c'); R(72, 76, 6, 5, '#34343c'); R(73, 77, 3, 3, '#0e0e14');
      hand(76, 78);
      break;
    case 'celular':
      bx(x, 70, 56, 18, 32, '#222228'); R(72, 60, 14, 22, '#58b8f8'); R(72, 60, 14, 8, '#88d4ff'); R(72, 78, 14, 4, '#3a98e0');
      R(73, 62, 10, 2, '#ffffff'); R(73, 66, 7, 1, '#e0f4ff'); R(73, 70, 10, 5, '#2a78c0'); P(79, 85, '#555'); R(76, 57, 6, 1, '#555');
      hand(72, 80);
      break;
    case 'gravador':
      bx(x, 66, 54, 22, 34, '#333338'); R(68, 56, 18, 14, '#222226');
      Eg(x, 73, 63, 3, 3, () => '#aaaab4'); Eg(x, 81, 63, 3, 3, () => '#aaaab4'); P(73, 63, '#222'); P(81, 63, '#222');
      R(68, 72, 18, 8, '#58585f'); R(70, 74, 14, 1, '#7a7a84'); R(70, 77, 14, 1, '#7a7a84'); R(69, 82, 7, 3, '#d03030'); R(78, 82, 7, 3, '#7a7a84');
      hand(70, 82);
      break;
    case 'papel':
      bx(x, 62, 52, 30, 36, '#f6f6ee'); R(63, 53, 28, 1, '#ffffff');
      for (let j = 60; j < 80; j += 3) R(66, j, 20 - (j % 7), 1, '#8888a0');
      R(66, 55, 12, 3, '#c03030'); R(76, 80, 10, 6, '#c03030'); R(77, 81, 8, 4, '#f6d0d0'); R(66, 82, 8, 1, '#4858a8');
      hand(70, 82);
      break;
    case 'chocolate':
      bx(x, 64, 56, 28, 26, '#5a3418');
      for (let j = 58; j < 80; j += 6) for (let i = 66; i < 90; i += 8) { R(i, j, 7, 5, '#7a4a24'); R(i, j, 7, 1, '#9a6a3c'); }
      R(64, 76, 28, 10, '#d03030'); R(64, 76, 28, 1, '#f06060'); miniText(x, 'CAT', 70, 78, '#f4f4f4');
      R(64, 86, 28, 2, '#a02020');
      hand(72, 82);
      break;
    case 'boi':
      R(68, 80, 4, 8, '#e8e0c8'); R(84, 80, 4, 8, '#e8e0c8');
      bx(x, 64, 62, 30, 20, '#f4f0e8'); R(68, 66, 8, 7, '#3a2a1a'); R(82, 70, 7, 6, '#3a2a1a');
      bx(x, 52, 56, 16, 16, '#f4f0e8'); R(50, 54, 4, 4, '#e8e0c8'); R(66, 54, 4, 4, '#e8e0c8'); R(48, 52, 3, 4, '#fafafa'); R(69, 52, 3, 4, '#fafafa');
      R(53, 64, 14, 7, '#e8a8a0'); R(55, 66, 2, 2, '#333'); R(61, 66, 2, 2, '#333'); P(57, 58, '#111'); P(63, 58, '#111');
      R(92, 64, 2, 8, '#3a2a1a');
      hand(74, 82);
      break;
    case 'aviao':
      R(60, 8, 30, 6, '#e8e8f0'); R(60, 8, 30, 1, '#ffffff'); R(60, 13, 30, 1, '#a8a8b8'); R(88, 9, 4, 4, '#e8e8f0');
      R(70, 2, 8, 20, '#d8d8e4'); R(70, 2, 8, 2, '#f4f4f8'); R(82, 6, 8, 3, '#e8e8f0'); R(82, 16, 8, 3, '#d8d8e4');
      R(60, 9, 6, 3, '#4870c0'); R(64, 9, 22, 1, '#88a8d8'); for (let i = 68; i < 86; i += 4) P(i, 11, '#3a3a4a');
      R(60, 9, 2, 4, '#58b8f8');
      break;
    case 'bone':
      R(60, 8, 30, 6, '#e8e8f0'); R(60, 8, 30, 1, '#ffffff'); R(60, 13, 30, 1, '#a8a8b8');
      R(70, 2, 8, 20, '#d8d8e4'); R(60, 9, 6, 3, '#4870c0'); R(82, 6, 8, 3, '#e8e8f0');
      break;
    case 'medalha':
      R(cx - 22, 66, 5, 6, '#d03030'); R(cx - 17, 66, 5, 6, '#3060c0'); R(cx - 12, 66, 5, 6, '#f4d030');
      for (const mx of [cx - 21, cx - 16, cx - 11]) { Eg(x, mx + 2, 76, 3, 3, (i, j, nx, ny) => (nx + ny < -0.3) ? '#fff2a0' : '#d8a818'); }
      R(cx - 7, 70, 4, 3, '#d03030'); R(cx - 4, 70, 2, 3, '#f4d030');
      R(cx + 10, 68, 10, 8, '#f4d030'); R(cx + 12, 70, 6, 4, '#2a9a3a'); R(cx + 11, 69, 8, 1, '#fff2a0');
      R(cx - 2, 62, 4, 2, '#f4d030');
      break;
    case 'bike':
      ring(x, 68, 82, 9, 2, '#2a2a30'); ring(x, 88, 82, 9, 2, '#2a2a30');
      P(68, 82, '#c8c8d0'); P(88, 82, '#c8c8d0');
      line(x, 68, 82, 76, 70, '#c03030', 2); line(x, 76, 70, 88, 82, '#c03030', 2); line(x, 68, 82, 82, 82, '#c03030', 2);
      line(x, 76, 70, 82, 82, '#c03030', 2); line(x, 74, 66, 78, 66, '#2a2a30', 3);
      line(x, 86, 72, 88, 82, '#c8c8d0', 2); line(x, 84, 71, 90, 71, '#2a2a30', 2);
      break;
    case 'carro':
      bx(x, 58, 80, 38, 12, '#c8c8d0'); bx(x, 66, 68, 24, 13, '#d8d8e0');
      R(68, 70, 9, 9, '#88b8e8'); R(79, 70, 9, 9, '#88b8e8'); R(68, 70, 9, 3, '#b8d8f8'); R(79, 70, 9, 3, '#b8d8f8'); R(77, 70, 2, 9, '#a8a8b4');
      R(58, 84, 38, 2, '#8a8a98'); R(92, 82, 4, 3, '#f8e878'); R(58, 82, 3, 3, '#d03030');
      for (const wx of [68, 88]) { E_(x, wx, 92, 5, 5, '#222228'); E_(x, wx, 92, 2, 2, '#c8c8d0'); }
      break;
  }
  outline(c);
  return (polCache[key] = c);
}
// pequena ajuda: devolve a própria cor se for "branca"/clara (para sobrancelhas legíveis)
function HC_WHITE_FIX(col) {
  const n = parseInt(col.slice(1), 16);
  const l = (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3;
  return l > 170 ? col : '#000000-none';
}

function silhouette(src) {
  const [c, x] = mkCanvas(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#3a3a48'; x.fillRect(0, 0, c.width, c.height);
  return c;
}

// Ícone do mandado (24x24): bola/pergaminho branco com faixa azul-marinho e selo amarelo.
let _mandado = null;
function mandadoSprite() {
  if (_mandado) return _mandado;
  const [c, x] = mkCanvas(24, 24);
  Eg(x, 12, 12, 11, 11, (i, j, nx, ny) => {
    const v = nx * 0.6 + ny * 0.7;
    return v > 0.45 ? '#b8bccc' : v > -0.05 ? '#e4e6f0' : '#fafafe';
  });
  // faixa marinho
  for (let j = 8; j <= 15; j++) for (let i = 0; i < 24; i++) {
    if (!inE(i, j, 12, 12, 11, 11)) continue;
    const nx = (i - 12) / 11;
    P_(x, i, j, j === 8 ? '#3a5cae' : (nx > 0.4 ? '#142a5c' : '#1e3a78'));
  }
  R_(x, 3, 10, 18, 1, '#3a5cae');
  // linhas de texto no topo
  R_(x, 8, 4, 8, 1, '#8a90a8'); R_(x, 9, 6, 6, 1, '#8a90a8'); R_(x, 9, 18, 6, 1, '#8a90a8'); R_(x, 8, 20, 8, 1, '#a0a6b8');
  // selo amarelo
  Eg(x, 12, 12, 4, 4, (i, j, nx, ny) => (Math.abs(nx) < 0.4 && Math.abs(ny) < 0.4) ? '#c89a14' : ((nx + ny < -0.4) ? '#fbe070' : '#f4c430'));
  P_(x, 12, 12, '#1e3a78'); P_(x, 11, 11, '#1e3a78'); P_(x, 12, 11, '#1e3a78'); P_(x, 11, 12, '#1e3a78');
  outline(c);
  return (_mandado = c);
}

// =====================================================================
// Arte baseada em tilesets/sprites de licença aberta (ver assets/CREDITOS.md)
// Procedural acima = fallback síncrono; ao carregar os PNGs, tudo é refeito no lugar.
// =====================================================================
let _tilesBuilt = false, _art = null, _fan = null;
const _builtList = [];
const _hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const _key = (r, g, b) => ((r << 16) | (g << 8) | b);

function drawBuilding(b) {
  const c = drawBuildingProc(b);
  const rec = { b, c };
  _builtList.push(rec);
  if (_art) { try { _artBuilding(rec); } catch (e) { console.warn('art building', e); } }
  if (_fan) { try { _fanBuilding(rec); } catch (e) { console.warn('fan building', e); } }
  return c;
}

function _loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('falha ao carregar ' + src)); i.src = src; });
}
function _toCanvas(img) { const [c, x] = mkCanvas(img.width, img.height); x.drawImage(img, 0, 0); return c; }
function _rect(sheet, sx, sy, w, h) { const [c, x] = mkCanvas(w, h); x.drawImage(sheet, sx, sy, w, h, 0, 0, w, h); return c; }
function _slice(sheet, col, row) { return _rect(sheet, col * 16, row * 16, 16, 16); }
// remapeia pixels: fn(r,g,b,a,x,y) -> [r,g,b,a] | null (mantém)
function _remap(c, fn) {
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    const k = (j * c.width + i) * 4;
    if (a[k + 3] === 0) continue;
    const o = fn(a[k], a[k + 1], a[k + 2], a[k + 3], i, j);
    if (o) { a[k] = o[0]; a[k + 1] = o[1]; a[k + 2] = o[2]; a[k + 3] = o[3] === undefined ? 255 : o[3]; }
  }
  x.putImageData(d, 0, 0);
  return c;
}
function _mode(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, m = {};
  let best = 0, bk = 0;
  for (let k = 0; k < d.length; k += 4) { const kk = _key(d[k], d[k + 1], d[k + 2]); m[kk] = (m[kk] || 0) + 1; if (m[kk] > best) { best = m[kk]; bk = kk; } }
  return [(bk >> 16) & 255, (bk >> 8) & 255, bk & 255];
}

const _ART_OLD_READY = Promise.all([
  _loadImg('assets/tiles/redvoxel_tilemap.png'),
  _loadImg('assets/tiles/xerogrunt_sprite.png'),
  _loadImg('assets/tiles/tuxemon_water_sand.png'),
  _loadImg('assets/tiles/tuxemon_outdoor_atlas.png'),
]).then(([rv, xg, ws, at]) => {
  _art = { rv: _toCanvas(rv), xg: _toCanvas(xg), ws: _toCanvas(ws), at: _toCanvas(at) };
  _art.xg.getContext('2d').getImageData(0, 0, 1, 1); // falha cedo se o canvas estiver "tainted" (file://)
  for (const k in personCache) delete personCache[k];
  if (_tilesBuilt) _applyTiles();
  for (const rec of _builtList) { try { _artBuilding(rec); } catch (e) { console.warn('art building', e); } }
}).catch(e => { _art = null; console.warn('Arte aberta indisponível, usando fallback procedural:', e); });

// ---------- Tiles 16x16 ----------
// Atlas (tuxemon_outdoor_atlas.png, células 16x16): 0 grama menta, 1 grama menta clara, 2-5 pinheiro 2x2 (TL,TR,BL,BR),
// 6 moita folhosa, 7 cerca, 8-10 flores vermelhas, 11 grama verde viva, 12 moita (variante), 13 moita roxa, 14-15 cerca (extras)
function _applyTiles() {
  try {
    const rv = _art.rv, ws = _art.ws, at = _art.at;
    const cell = (i) => _rect(at, (i % 8) * 16, (i >> 3) * 16, 16, 16);
    const put = (name, arr) => { const t = Tiles[name] || (Tiles[name] = []); arr.forEach((c, f) => { t[f] = c; }); t.length = arr.length; };
    const grass = cell(0);
    const clone = (src) => { const [c, x] = mkCanvas(16, 16); x.drawImage(src, 0, 0); return [c, x]; };
    const onGrass = (...layers) => { const [c, x] = clone(grass); for (const l of layers) x.drawImage(l, 0, 0); return c; };
    const px = (x, i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
    put('grass', [grass]);
    { const [c, x] = clone(cell(1)); for (let j = 0; j < 16; j += 8) { x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(0, j, 16, 4); } put('lawn', [c]); }
    // pinheiro 2x2: quartos TL, TR, BL, BR (índice = (x & 1) + (y & 1) * 2), sobre grama
    put('tree', [onGrass(cell(2)), onGrass(cell(3)), onGrass(cell(4)), onGrass(cell(5))]);
    // mato alto: moitas folhosas, 2 frames (a segunda espelhada e 1px acima)
    const tall = [];
    for (let f = 0; f < 2; f++) {
      const [c, x] = clone(grass);
      x.fillStyle = 'rgba(0,70,50,0.22)'; x.fillRect(0, 0, 16, 16);
      x.save(); if (f) { x.translate(16, 0); x.scale(-1, 1); } x.drawImage(cell(6), 0, f ? -1 : 0); x.restore();
      tall.push(c);
    }
    put('tall', tall);
    // flores vermelhas
    put('flower', [cell(8)]);
    // cerca branca de estacas (recolore o azul-acinzentado para branco)
    { const f = cell(7);
      _remap(f, (r, g, b) => (r + g + b > 330 ? [r + ((255 - r) * 0.8 | 0), g + ((255 - g) * 0.8 | 0), b + ((255 - b) * 0.75 | 0), 255] : null));
      put('fence', [onGrass(f)]); }
    // areia e caminho claro
    const sandT = _rect(ws, 32, 0, 16, 16), sm = _mode(sandT);
    _remap(sandT, (r, g, b) => (b > r + 8 ? sm : null));
    put('sand', [sandT]);
    { const c = _rect(ws, 32, 0, 16, 16); _remap(c, (r, g, b) => (b > r + 8 ? sm : null));
      _remap(c, (r, g, b) => [Math.min(255, r + 12), Math.min(255, g * 0.97 + 6 | 0), b * 0.85 | 0, 255]);
      const x = c.getContext('2d');
      for (const [i, j] of [[3, 4], [11, 2], [7, 10], [13, 12], [1, 13]]) { px(x, i, j, '#c9a86c'); px(x, i + 1, j, '#dcc088'); px(x, i, j - 1, '#f0e0b0'); }
      put('path', [c]); }
    const w0 = _rect(ws, 0, 0, 16, 16);
    const shifted = (src, dx) => { const [c, x] = mkCanvas(16, 16); x.drawImage(src, dx, 0); x.drawImage(src, dx - 16, 0); return c; };
    put('water', [w0, shifted(w0, 8)]);
    const pool = [];
    for (let f = 0; f < 2; f++) {
      const [c, x] = clone(f ? shifted(w0, 8) : w0);
      x.fillStyle = 'rgba(170,230,255,0.45)'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(7, 0, 1, 16); x.fillRect(0, 7, 16, 1);
      x.fillStyle = 'rgba(60,140,210,0.6)'; x.fillRect(8, 0, 1, 16); x.fillRect(0, 8, 16, 1);
      pool.push(c);
    }
    put('pool', pool);
    { const [c, x] = clone(grass);
      x.fillStyle = '#222034'; x.fillRect(1, 2, 14, 9); x.fillStyle = '#d9a066'; x.fillRect(2, 3, 12, 7);
      x.fillStyle = '#efc08a'; x.fillRect(2, 3, 12, 1); x.fillStyle = '#8f563b';
      x.fillRect(4, 5, 8, 1); x.fillRect(4, 7, 6, 1);
      x.fillStyle = '#222034'; x.fillRect(7, 11, 2, 4); x.fillStyle = '#8f563b'; x.fillRect(7, 11, 1, 3);
      put('sign', [c]); }
  } catch (e) { console.warn('art tiles', e); }
}

// ---------- Prédios com peças do tilemap ----------
function _roofPal(col) {
  if (!col || col === '#c84848') return { l: '#ffb15e', m: '#f08030', d: '#a8501c' };
  if (col === '#4878c8') return { l: '#f0705a', m: '#d03c2c', d: '#8a2418' };
  return { l: shade(col, 1.3), m: col, d: shade(col, 0.6) };
}
function _brick(x, X, Y, W, H, bg, br) {
  R_(x, X, Y, W, H, bg);
  for (let j = 0, r = 0; j + 2 <= H; j += 4, r++) for (let i = -(r % 2) * 4; i < W; i += 8) {
    const a = Math.max(0, i), b = Math.min(W, i + 7);
    if (b > a) R_(x, X + a, Y + j + 1, b - a, 2, br);
  }
}
function _roofArt(x, rv, X, Y, W, H, pal, hip) {
  const tex = _rect(rv, 32, 32, 8, 16);
  _remap(tex, (r, g, b) => { const k = _key(r, g, b); return k === 0x99e550 ? _hex(pal.l) : k === 0x6abe30 ? _hex(pal.m) : null; });
  for (let j = 0; j < H; j++) {
    const ins = Math.max(0, hip - j), w = W - ins * 2;
    for (let xx = 0; xx < w; xx += 8) x.drawImage(tex, 0, j % 16, Math.min(8, w - xx), 1, X + ins + xx, Y + j, Math.min(8, w - xx), 1);
    if (j % 6 === 5) R_(x, X + ins, Y + j, w, 1, pal.d);
  }
  R_(x, X, Y + H, W, 2, pal.d); R_(x, X, Y + H, W, 1, shade(pal.m, 1.2));
}
function _artBuilding(rec) {
  const { b, c } = rec, rv = _art.rv;
  if (b.kind !== 'pf' && b.kind !== 'casa' && b.kind !== 'guanabara') return;
  const SW = b.w * 16, SH = b.h * 16, [s, x] = mkCanvas(SW, SH);
  const dcol = b.w >> 1, dx = dcol * 16;
  const door = () => x.drawImage(rv, 48, 80, 16, 13, dx, SH - 13, 16, 13);
  const win = (X, Y) => x.drawImage(rv, 21, 80, 19, 9, X, Y, 19, 9);
  if (b.kind === 'casa') {
    const hs = _rect(rv, 0, 32, 80, 64);
    const hx = hs.getContext('2d');
    const tex = _rect(rv, 32, 32, 8, 16);
    for (let X = 6; X < 29; X += 8) hx.drawImage(tex, 0, 0, Math.min(8, 29 - X), 22, X, 0, Math.min(8, 29 - X), 22);
    hx.clearRect(0, 48, 80, 16);
    hx.drawImage(rv, 0, 80, 16, 16, 0, 48, 16, 16);
    hx.drawImage(rv, 64, 80, 16, 16, 64, 48, 16, 16);
    _brick(hx, 14, 48, 52, 11, '#7d8aa0', '#c4ccd8');
    R_(hx, 14, 59, 52, 1, '#222034');
    hx.drawImage(rv, 21, 80, 10, 9, 18, 49, 10, 9); hx.drawImage(rv, 21, 80, 10, 9, 52, 49, 10, 9);
    hx.drawImage(rv, 48, 80, 16, 16, 32, 48, 16, 16);
    const pal = _roofPal(b.roof);
    _remap(hs, (r, g, bb, a, i, j) => {
      const k = _key(r, g, bb), grn = k === 0x99e550 || k === 0x6abe30 || k === 0x4b692f;
      if (k === 0xd9a066) return [196, 204, 216];   // tijolo -> parede cinza clara
      if (k === 0x8a6f30) return [125, 138, 160];   // argamassa -> cinza médio
      if (!grn) return null;
      if (j >= 48) return [0, 0, 0, 0];
      return _hex(k === 0x99e550 ? pal.l : k === 0x6abe30 ? pal.m : pal.d);
    });
    x.drawImage(hs, 0, 0, 80, 64, 0, 0, SW, SH);
  } else if (b.kind === 'pf') {
    _brick(x, 0, 24, SW, SH - 24, '#7d8aa0', '#c4ccd8');
    R_(x, 0, SH - 5, SW, 4, '#4a5262'); R_(x, 0, SH - 5, SW, 1, '#7a8698');
    for (const wy of [34, 54]) for (const wx of [6, 28]) { win(wx, wy); win(SW - wx - 19, wy); }
    R_(x, dx - 6, SH - 24, 28, 3, '#1e3a78'); R_(x, dx - 6, SH - 24, 28, 1, '#4a6cbc'); R_(x, dx - 6, SH - 21, 28, 1, '#f4c430');
    door();
    _roofArt(x, rv, 0, 0, SW, 26, _roofPal(null), 8);
    const sx = (SW >> 1) - 25;
    R_(x, sx - 1, 5, 52, 16, '#15295c'); R_(x, sx, 6, 50, 14, '#f4c430'); R_(x, sx, 6, 50, 1, '#fbe070'); R_(x, sx, 19, 50, 1, '#c89a14');
    miniText(x, 'PF', sx + 3, 8, '#1e3a78', 2);
    miniText(x, 'POLICIA', sx + 20, 8, '#1e3a78'); miniText(x, 'FEDERAL', sx + 20, 14, '#1e3a78');
  } else { // guanabara
    R_(x, 0, 20, SW, SH - 20, '#f0e0b8');
    for (let j = 28; j < SH - 6; j += 6) R_(x, 0, j, SW, 1, '#e4d4a4');
    R_(x, 0, SH - 5, SW, 5, '#c8b684'); R_(x, 0, SH - 5, SW, 1, '#e0d0a0');
    for (const wy of [28, 42]) for (const wx of [6, 27]) { win(wx, wy); win(SW - wx - 19, wy); }
    const cxm = dx + 8;
    R_(x, cxm - 22, 22, 44, SH - 22, '#e8dcb4');
    for (const cc of [cxm - 21, cxm - 11, cxm + 7, cxm + 18]) { R_(x, cc, 24, 4, SH - 29, '#fffaf0'); R_(x, cc + 3, 24, 1, SH - 29, '#c8bea4'); }
    for (let j = 10; j < 24; j++) { const hw = Math.round((j - 10) * 1.7 + 2); R_(x, cxm - hw, j, hw * 2, 1, j < 12 ? '#fffaf0' : '#f6ecd0'); }
    R_(x, cxm - 26, 23, 52, 2, '#fffaf0'); R_(x, cxm - 26, 25, 52, 1, '#c8bea4');
    E_(x, cxm, 19, 2, 2, '#f4d030');
    door();
    _roofArt(x, rv, 0, 0, SW, 14, _roofPal(null), 6);
  }
  outline(s, '#222034');
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, c.width, c.height);
  cx.drawImage(s, 0, 0, c.width, c.height);
}

// ---------- Personagens (xerogrunt, CC-BY-SA 4.0, recolorido por paleta) ----------
// frame 0 = parado, 1 = pé esquerdo à frente, 2 = pé direito à frente (colunas 1, 0, 2 da folha).
// Passos sobem 1px (balanço do corpo) em relação ao parado.
function _artPerson(look, dir, frame) {
  const sheet = _art.xg;
  const row = { down: 0, left: 1, right: 2, up: 3 }[dir] || 0;
  const col = frame === 1 ? 0 : frame === 2 ? 2 : 1;
  const cell = _rect(sheet, col * 16, row * 32, 16, 32);
  const agent = look === AGENT_LOOK || look.cap === '#14141a';
  const skin = look.skin ? _hex(look.skin) : null;
  const shirt = _hex(look.shirt || '#3a6ab0'), pants = _hex(look.pants || '#2a2a3a');
  const hairc = _hex(look.cap || look.hair || '#2a2220');
  const acc = _hex(look.stripe || '#f4c430');
  const sh = (a, f) => a.map(v => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
  const od = cell.getContext('2d').getImageData(0, 0, 16, 32).data;
  const isSkin = (i, j) => { if (i < 0 || i > 15) return false; const q = (j * 16 + i) * 4; const kk = _key(od[q], od[q + 1], od[q + 2]); return od[q + 3] > 0 && (kk === 0xf6b68a || kk === 0xffd1ad || kk === 0xda8a68); };
  _remap(cell, (r, g, b, a, i, j) => {
    const k = _key(r, g, b);
    if (skin) {
      if (k === 0xf6b68a) return skin;
      if (k === 0xffd1ad) return sh(skin, 1.15);
      if (k === 0xda8a68) return sh(skin, 0.85);
      if (k === 0x703838) return sh(skin, 0.6);
    }
    if (agent) {
      // boné preto com distintivo amarelo, cabelo castanho escuro, colete azul-marinho com listras amarelas,
      // calça cinza-escura, botas pretas; pele e olhos mantidos da folha
      const hair = [74, 48, 32];
      if (k === 0x3c3cde) {
        if (j < 19) return (dir === 'down' && i >= 6 && i <= 9 && j >= 12 && j <= 15) ? acc : [44, 44, 60];
        return j < 29 ? acc : [60, 60, 76];
      }
      if (k === 0x000000 || k === 0x030000) {
        if (j < 19) return [26, 26, 34];
        if (j < 24) return (isSkin(i - 1, j) || isSkin(i + 1, j)) ? null : hair;
        if (j < 29) return [30, 40, 76];
        return j < 31 ? [66, 66, 78] : null;
      }
      if (k === 0x332e2b && j >= 24) return j < 29 ? [20, 28, 56] : [50, 50, 62];
      return null;
    }
    if (k === 0x000000 || k === 0x030000) {
      if (j < 19) return hairc;
      if (j < 24) return null;
      return j < 29 ? shirt : pants;
    }
    if (k === 0x332e2b && j >= 24) return j < 29 ? sh(shirt, 0.7) : sh(pants, 0.7);
    return null;
  });
  // 16x32 -> 32x32 (escala 1.5, recorta o topo vazio)
  const [c, x] = mkCanvas(32, 32);
  const src = cell.getContext('2d').getImageData(0, 0, 16, 32).data, out = x.createImageData(32, 32);
  const bob = frame === 0 ? 1 : 0;
  for (let oy = 0; oy < 32; oy++) for (let ox = 0; ox < 24; ox++) {
    const ty = oy - bob; if (ty < 0) continue;
    const sx = Math.min(15, Math.floor(ox / 1.5)), sy = Math.min(31, 11 + Math.floor(ty / 1.5));
    const si = (sy * 16 + sx) * 4, oi = (oy * 32 + ox + 4) * 4;
    out.data[oi] = src[si]; out.data[oi + 1] = src[si + 1]; out.data[oi + 2] = src[si + 2]; out.data[oi + 3] = src[si + 3];
  }
  x.putImageData(out, 0, 0);
  outline(c);
  return c;
}

// =====================================================================
// Arte "fan game" (RPG Maker XP, 32x32) - ver assets/fan/CREDITOS.md
// Tileset/autotiles/porta: gonvalhector (CC-BY 4.0). Personagens: ninjaconor (uso livre com crédito).
// Sobrepõe a arte anterior quando os PNGs carregam; sem eles, tudo cai no fallback.
// =====================================================================
const AUTOTILE_KINDS = new Set(['path', 'water', 'sand', 'pool']);
const _atCache = {};

function _fanKeyWhite(c) { return _remap(c, (r, g, b) => (r === 255 && g === 255 && b === 255 ? [0, 0, 0, 0] : null)); }
// verdes saturados -> verde-menta mais suave (estilo Pokémon)
function _soft(r, g, b) { return (g > r && g > b + 50) ? [r, Math.round(g + (255 - g) * 0.1), Math.round(b + (g - b) * 0.42)] : null; }
const _mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * Math.max(0, Math.min(1, t))));

function _fanLoad() {
  const base = 'assets/fan/';
  return Promise.all(['gonvalhector_outdoors_tileset', 'gonvalhector_autotile_sand', 'gonvalhector_autotile_water', 'gonvalhector_animated_door',
    'ninjaconor_human-m-5-2-3', 'ninjaconor_human-f-0-3-7'].map(n => _loadImg(base + n + '.png'))).then(([ts, sand, water, door, chA, chB]) => {
    const f = { ts: _fanKeyWhite(_toCanvas(ts)), door: _fanKeyWhite(_toCanvas(door)), ch: [_toCanvas(chA), _toCanvas(chB)], at: {} };
    f.ts.getContext('2d').getImageData(0, 0, 1, 1); // falha cedo se "tainted"
    const sandC = _remap(_toCanvas(sand), _soft);
    const waterC = _toCanvas(water);
    // caminho de terra clara; areia mais clara/amarelada
    f.at.path = { c: sandC, frames: 1 };
    f.at.sand = { c: _remap(_rect(sandC, 0, 0, 96, 128), (r, g, b) => (r > b + 40 && r >= g ? [Math.min(255, r + 12), Math.min(255, g + 18), Math.min(255, b + 34)] : null)), frames: 1 };
    // lagoa azul Pokémon (a água cinza-azulada vira azul vivo; margem de terra/grama mantida)
    f.at.water = { c: _remap(_remap(_rect(waterC, 0, 0, 192, 128), _soft), (r, g, b) => (b >= r + 20 && b >= g ? _mix([48, 112, 224], [104, 176, 248], (((r + g + b) / 3) - 80) / 20) : null)), frames: 2 };
    // piscina: água turquesa, borda de pedra clara em vez de barranco
    f.at.pool = { c: _remap(_rect(waterC, 0, 0, 192, 128), (r, g, b) => {
      if (r === 255 && g === 255 && b === 255) return null;
      const l = (r + g + b) / 3;
      if (b >= r + 20 && b >= g) return _mix([64, 172, 228], [140, 224, 252], (l - 80) / 20);
      if (g > r && g > b + 40) return _mix([176, 180, 196], [236, 238, 246], (l - 90) / 90);
      return [120, 126, 150];
    }), frames: 2 };
    _fan = f;
    for (const k in personCache) delete personCache[k];
    for (const k in _atCache) delete _atCache[k];
  }).catch(e => { _fan = null; console.warn('Arte fan indisponível, usando fallback:', e); });
}

// Autotile RMXP: composição por mini-tiles 16x16 (folha 96x128 = 6x8 minis, ids 1..48).
// mask: N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128 (bit = vizinho do mesmo tipo)
function autotileFor(kind, mask, frame = 0) {
  if (!_fan || !AUTOTILE_KINDS.has(kind)) return null;
  const set = _fan.at[kind]; if (!set) return null;
  const f = set.frames > 1 ? ((frame % set.frames) + set.frames) % set.frames : 0;
  const key = kind + '|' + (mask & 255) + '|' + f;
  if (_atCache[key]) return _atCache[key];
  const N = !!(mask & 1), NE = !!(mask & 2), E = !!(mask & 4), SE = !!(mask & 8), S = !!(mask & 16), SW = !!(mask & 32), W = !!(mask & 64), NW = !!(mask & 128);
  let q;
  if (!N && !E && !S && !W) q = [1, 2, 7, 8]; // isolado
  else q = [
    N && W ? (NW ? 27 : 5) : (!N && !W) ? 13 : !N ? 15 : 25,
    N && E ? (NE ? 28 : 6) : (!N && !E) ? 18 : !N ? 16 : 30,
    S && W ? (SW ? 33 : 11) : (!S && !W) ? 43 : !S ? 45 : 31,
    S && E ? (SE ? 34 : 12) : (!S && !E) ? 48 : !S ? 46 : 36,
  ];
  const [c, x] = mkCanvas(TILE, TILE);
  q.forEach((id, i) => x.drawImage(set.c, f * 96 + ((id - 1) % 6) * 16, (((id - 1) / 6) | 0) * 16, 16, 16, (i & 1) * 16, (i >> 1) * 16, 16, 16));
  return (_atCache[key] = c);
}

function _flip(src, fx, fy) {
  const [c, x] = mkCanvas(src.width, src.height);
  x.translate(fx ? src.width : 0, fy ? src.height : 0); x.scale(fx ? -1 : 1, fy ? -1 : 1); x.drawImage(src, 0, 0);
  return c;
}

function _applyFan() {
  try {
    const ts = _fan.ts;
    const put = (name, arr) => { const t = Tiles[name] || (Tiles[name] = []); arr.forEach((c, i) => { t[i] = c; }); t.length = arr.length; };
    const cl = (src) => { const [c, x] = mkCanvas(src.width, src.height); x.drawImage(src, 0, 0); return [c, x]; };
    const grass = _remap(_rect(ts, 0, 0, 32, 32), _soft), dark = _remap(_rect(ts, 0, 32, 32, 32), _soft);
    put('grass', [grass, _flip(grass, 1, 0), _flip(grass, 0, 1), _flip(grass, 1, 1)]);
    const onGrass = () => cl(grass);
    // gramado listrado
    { const [c, x] = onGrass(); x.fillStyle = 'rgba(255,255,255,0.13)'; for (let j = 0; j < 32; j += 16) x.fillRect(0, j, 32, 8); put('lawn', [c]); }
    // mato alto: grama escura + tufos (2 frames, balanço de 1px)
    const tuft = (sx, sy, w, h) => _remap(_rect(ts, sx, sy, w, h), _soft);
    const tufts = [tuft(168, 10, 18, 18), tuft(196, 5, 20, 20), tuft(210, 16, 20, 20), tuft(230, 8, 28, 26)];
    const tallF = [];
    for (let f = 0; f < 2; f++) {
      const [c, x] = cl(dark);
      const spots = [[2, 4, 0], [15, 2, 1], [1, 17, 2], [14, 15, 3], [9, 9, 0], [22, 20, 1]];
      for (const [a, b, k] of spots) { const t = tufts[k]; x.drawImage(t, a + (f ? ((a + b) % 3 === 0 ? 1 : -1) : 0), b, Math.min(t.width, 32), t.height); }
      tallF.push(c);
    }
    put('tall', tallF);
    // flores
    { const [c, x] = onGrass(); const fl = _rect(ts, 130, 4, 28, 24);
      x.drawImage(fl, 2, 2); x.drawImage(_flip(fl, 1, 0), 8, 10);
      put('flower', [c]); }
    // cerca de estacas
    { const [c, x] = onGrass();
      R_(x, 0, 24, 32, 3, '#5fa24c');
      R_(x, 0, 12, 32, 4, '#c08850'); R_(x, 0, 12, 32, 1, '#e8b070'); R_(x, 0, 15, 32, 1, '#7a4a24');
      R_(x, 0, 19, 32, 4, '#c08850'); R_(x, 0, 19, 32, 1, '#e8b070'); R_(x, 0, 22, 32, 1, '#7a4a24');
      for (const a of [3, 21]) { R_(x, a, 6, 7, 21, '#a87040'); R_(x, a, 6, 2, 21, '#d09860'); R_(x, a + 5, 6, 2, 21, '#6a3e1e'); R_(x, a + 1, 5, 5, 1, '#d09860'); }
      put('fence', [c]); }
    // placa
    { const [c, x] = onGrass();
      R_(x, 14, 17, 5, 13, '#7a4a24'); R_(x, 14, 17, 1, 13, '#9a6a3c'); R_(x, 18, 17, 1, 13, '#5a3418');
      R_(x, 3, 4, 26, 15, '#c08850'); R_(x, 3, 4, 26, 1, '#e0a870'); R_(x, 3, 18, 26, 1, '#7a4a24');
      R_(x, 3, 4, 1, 15, '#e0a870'); R_(x, 28, 4, 1, 15, '#7a4a24'); R_(x, 5, 6, 22, 11, '#d0a068');
      for (let j = 8; j < 16; j += 3) R_(x, 7, j, 12 + (j % 2) * 5, 1, '#5a3418');
      put('sign', [c]); }
    // terreno autotile (tile sem vizinhos de outro tipo = miolo)
    put('path', [autotileFor('path', 255, 0)]);
    put('sand', [autotileFor('sand', 255, 0)]);
    put('water', [autotileFor('water', 255, 0), autotileFor('water', 255, 1)]);
    const pool = [];
    for (let f = 0; f < 2; f++) {
      const [c, x] = cl(autotileFor('pool', 255, f));
      x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(15, 0, 1, 32); x.fillRect(0, 15, 32, 1);
      x.fillStyle = 'rgba(30,110,190,0.45)'; x.fillRect(16, 0, 1, 32); x.fillRect(0, 16, 32, 1);
      pool.push(c);
    }
    put('pool', pool);
    // árvore 2x2 (quartos TL, TR, BL, BR = (x&1) + (y&1)*2), copa + tronco sem a sombra do tileset
    { const src = _remap(_rect(ts, 0, 330, 100, 150), (r, g, b) => (b > g ? [0, 0, 0, 0] : null));
      const d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
      let x0 = 999, y0 = 999, x1 = -1, y1 = -1;
      for (let j = 0; j < src.height; j++) for (let i = 0; i < src.width; i++) if (d[(j * src.width + i) * 4 + 3] > 0) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
      const [big, bx_] = mkCanvas(64, 64);
      bx_.drawImage(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, 64, 64);
      hardAlpha(big);
      const [bg, bgx] = mkCanvas(64, 64);
      for (let q = 0; q < 4; q++) bgx.drawImage(grass, (q & 1) * 32, (q >> 1) * 32);
      bgx.drawImage(big, 0, 0);
      put('tree', [0, 1, 2, 3].map(q => _rect(bg, (q & 1) * 32, (q >> 1) * 32, 32, 32)));
      _fan.treeBig = bg; }
  } catch (e) { console.warn('fan tiles', e); }
}

// ---------- Casas (peças do tileset: telhado, parede, janela, porta) ----------
function _fanRoofTex(pal) {
  // telhado marrom do tileset -> rampa de 4 tons da paleta (laranja p/ casas)
  const ramp = [_hex(pal.d), _hex(pal.m), _hex(pal.l), _hex(shade(pal.l, 1.18))];
  const r = _rect(_fan.ts, 160, 783, 96, 148);
  return _remap(r, (rr, g, b) => { const l = rr * 0.3 + g * 0.59 + b * 0.11; return ramp[Math.max(0, Math.min(3, Math.floor((l - 66) / 11)))]; });
}
function _fanBuilding(rec) {
  const { b, c } = rec;
  if (b.kind !== 'pf' && b.kind !== 'casa') return;
  const ts = _fan.ts, W = b.w * TILE, H = b.h * TILE;
  const [s, x] = mkCanvas(W, H);
  const pal = b.kind === 'pf' ? { l: '#5a7cc8', m: '#2c4e9a', d: '#15295c' } : _roofPal(b.roof);
  const roofH = Math.max(48, Math.round(H * 0.5 / 8) * 8), wallTop = roofH - 6;
  const tex = _fanRoofTex(pal);
  // parede: miolo creme + vigas laterais + rodapé
  const wallC = _rect(ts, 169, 931, 78, 107), beamL = _rect(ts, 160, 931, 9, 107), beamR = _rect(ts, 247, 931, 9, 107), foot = _rect(ts, 160, 1040, 96, 16);
  for (let yy = wallTop; yy < H; yy += 107) for (let xx = 13; xx < W - 13; xx += 78) x.drawImage(wallC, 0, 0, Math.min(78, W - 13 - xx), Math.min(107, H - yy), xx, yy, Math.min(78, W - 13 - xx), Math.min(107, H - yy));
  for (let yy = wallTop; yy < H; yy += 107) { x.drawImage(beamL, 0, 0, 9, Math.min(107, H - yy), 4, yy, 9, Math.min(107, H - yy)); x.drawImage(beamR, 0, 0, 9, Math.min(107, H - yy), W - 13, yy, 9, Math.min(107, H - yy)); }
  for (let xx = 4; xx < W - 4; xx += 96) x.drawImage(foot, 0, 0, Math.min(96, W - 4 - xx), 16, xx, H - 16, Math.min(96, W - 4 - xx), 16);
  // janelas
  const win = _rect(ts, 67, 964, 26, 24), winF = _rect(ts, 65, 996, 30, 37);
  const dw = 33, dx = ((W - dw) >> 1);
  const nWin = Math.max(2, Math.floor((W - 24) / 52));
  for (let k = 0; k < nWin; k++) {
    const cx = 8 + Math.round((k + 0.5) * (W - 16) / nWin);
    if (Math.abs(cx - W / 2) < dw / 2 + 16) continue;
    const wy = wallTop + 8;
    x.drawImage(k % 2 ? win : winF, cx - 13, wy);
  }
  // porta
  x.drawImage(_rect(_fan.door, 0, 8, 33, 56), dx, H - 56 - 2);
  // telhado em trapézio: faixa de cumeeira + corpo + beiral
  const top = _rect(tex, 0, 0, 96, 12), body = _rect(tex, 0, 12, 96, 116), eave = _rect(tex, 0, 140, 96, 8);
  const [rf, rx] = mkCanvas(W, roofH);
  for (let xx = 0; xx < W; xx += 96) {
    const w = Math.min(96, W - xx);
    rx.drawImage(top, 0, 0, w, 12, xx, 0, w, 12);
    for (let yy = 12; yy < roofH - 8; yy += 116) rx.drawImage(body, 0, 0, w, Math.min(116, roofH - 8 - yy), xx, yy, w, Math.min(116, roofH - 8 - yy));
    rx.drawImage(eave, 0, 0, w, 8, xx, roofH - 8, w, 8);
  }
  for (let j = 0; j < 14; j++) { const ins = (14 - j) * 2; rx.clearRect(0, j, ins, 1); rx.clearRect(W - ins, j, ins, 1); }
  x.drawImage(rf, 0, 0);
  R_(x, 0, roofH, W, 2, pal.d); R_(x, 0, roofH, W, 1, shade(pal.m, 1.2));
  if (b.kind === 'pf') {
    const pw = 62, px0 = ((W - pw) >> 1), py = roofH - 30;
    R_(x, px0 - 2, py - 2, pw + 4, 24, '#15295c'); R_(x, px0, py, pw, 20, '#f4c430'); R_(x, px0, py, pw, 1, '#fbe070'); R_(x, px0, py + 19, pw, 1, '#c89a14');
    miniText(x, 'PF', px0 + 3, py + 3, '#1e3a78', 3);
    R_(x, px0 + 26, py + 2, 1, 16, '#c89a14');
    miniText(x, 'POLICIA', px0 + 30, py + 4, '#1e3a78'); miniText(x, 'FEDERAL', px0 + 30, py + 11, '#1e3a78');
  }
  hardAlpha(s);
  outline(s, '#222034');
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, c.width, c.height);
  cx.drawImage(s, 0, 0, c.width, c.height);
}

// ---------- Pessoas: charsets RMXP 128x192 (4x4 de 32x48), recoloridos por paleta ----------
const _FP = {
  skin: { [_key(255, 203, 156)]: 1, [_key(239, 162, 140)]: 0.88, [_key(255, 235, 206)]: 1.08, [_key(173, 113, 99)]: 0.75 },
  pants: new Set([[181, 190, 115], [156, 162, 90], [132, 138, 66], [214, 214, 140], [82, 89, 33], [87, 90, 39], [129, 136, 66], [154, 162, 90], [209, 215, 136], [49, 52, 8], [53, 53, 15]].map(a => _key(...a))),
  hairA: new Set([[115, 44, 24], [49, 8, 8], [107, 12, 8], [156, 40, 33], [181, 52, 49]].map(a => _key(...a))),
  hairB: new Set([[89, 45, 0], [55, 28, 0], [119, 60, 0], [169, 96, 27], [132, 71, 22], [112, 61, 20], [94, 50, 17]].map(a => _key(...a))),
  band: new Set([[123, 121, 132], [201, 207, 210]].map(a => _key(...a))),
};
function _fanPerson(look, dir, frame) {
  const agent = look === AGENT_LOOK || look.cap === '#14141a';
  const bi = agent ? 0 : (hash2(look.shirt ? parseInt(look.shirt.slice(1), 16) : 1, 7) < 0.5 ? 0 : 1);
  const sheet = _fan.ch[bi];
  const row = { down: 0, left: 1, right: 2, up: 3 }[dir] || 0, col = frame === 1 ? 1 : frame === 2 ? 3 : 0;
  const cell = _rect(sheet, col * 32, row * 48, 32, 48);
  const scale = (rgb, t) => rgb.map(v => Math.max(0, Math.min(255, Math.round(t < 1 ? v * t : v + (255 - v) * (t - 1)))));
  const skin = look.skin ? _hex(look.skin) : null;
  const acc = _hex(look.stripe || look.capMark || '#f4c430');
  const shirt = agent ? [30, 32, 44] : _hex(look.shirt || '#3a6ab0');
  const pants = agent ? [38, 42, 58] : _hex(look.pants || '#2e2e3a');
  const hairBase = agent ? [28, 28, 38] : _hex(look.cap || look.hair || '#4a3020');
  const hairSet = bi === 0 ? _FP.hairA : _FP.hairB;
  let sMinX = 99, sMaxX = 0, sMinY = 99, sMaxY = 0;
  _remap(cell, (r, g, b, a, i, j) => {
    const k = _key(r, g, b);
    if (skin && _FP.skin[k]) return scale(skin, _FP.skin[k]);
    if (bi === 0 ? (g > r + 60 && g > b + 60) : (r > g + 60 && b > g + 60 && Math.abs(r - b) < 40)) {
      sMinX = Math.min(sMinX, i); sMaxX = Math.max(sMaxX, i); sMinY = Math.min(sMinY, j); sMaxY = Math.max(sMaxY, j);
      return scale(shirt, (bi === 0 ? g : r) / 156);
    }
    if (_FP.pants.has(k)) return scale(pants, g / 138);
    if (hairSet.has(k)) return scale(hairBase, (r * 0.3 + g * 0.59 + b * 0.11) / (bi === 0 ? 55 : 58));
    if (_FP.band.has(k)) return agent ? scale(acc, r > 150 ? 1.05 : 0.8) : (look.cap ? scale(_hex(look.cap), 1.25) : scale(hairBase, 1.3));
    return null;
  });
  if (agent && sMaxX >= sMinX) {
    const x = cell.getContext('2d'), mx = (sMinX + sMaxX) >> 1;
    x.fillStyle = '#f4c430';
    if (dir === 'down') { x.fillRect(sMinX + 2, sMinY + 1, 3, 3); x.fillRect(sMinX, sMaxY - 1, sMaxX - sMinX + 1, 1); x.fillStyle = '#c89a14'; x.fillRect(sMinX + 2, sMinY + 3, 3, 1); }
    else if (dir === 'up') miniText(x, 'PF', mx - 3, sMinY + 1, '#f4c430');
    else { x.fillRect(sMinX, sMaxY - 1, sMaxX - sMinX + 1, 1); x.fillRect(mx - 1, sMinY + 1, 3, 1); }
  }
  hardAlpha(cell);
  return cell;
}

// ART_READY: arte aberta antiga + arte fan; ambas nunca rejeitam
const ART_READY = Promise.all([_ART_OLD_READY, _fanLoad()]).then(() => {
  if (!_fan) return;
  if (_tilesBuilt) { if (_art) _applyTiles(); _applyFan(); }
  for (const rec of _builtList) { try { if (_art) _artBuilding(rec); _fanBuilding(rec); } catch (e) { console.warn('fan building', e); } }
});
