'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

let ev, W, H, cities, areas, routes, solidGrid;

before(async () => {
  ({ ev } = await load({ files: ['data.js', 'rules.js', 'map.js', 'gyms.js'] }));
  ev('buildWorld(); if (typeof seedPoolsByUF === "function") seedPoolsByUF();');   // como no boot do jogo
  W = ev('MAP_W'); H = ev('MAP_H');
  cities = ev('World.cities'); areas = ev('World.areas'); routes = ev('World.routes');
  // grade de solidos so por tile (NPCs se movem e nao contam para alcancabilidade)
  const SOLID = new Set(ev('[...SOLID]'));
  const tiles = ev('World.tiles');
  solidGrid = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) solidGrid[y * W + x] = SOLID.has(tiles[y][x]) ? 1 : 0;
});

describe('mundo procedural', () => {
  test('buildWorld e deterministico (mesmas cidades/rotas ao reconstruir)', () => {
    const before = JSON.stringify([ev('World.cities'), ev('World.routes')]);
    ev('buildWorld()');
    assert.equal(JSON.stringify([ev('World.cities'), ev('World.routes')]), before);
  });
  test('grade de tiles tem MAP_W x MAP_H', () => {
    const t = ev('World.tiles');
    assert.equal(t.length, H); assert.ok(t.every(r => r.length === W));
  });
  test('27 cidades, ordens 1..N unicas, ids unicos, dentro do mapa', () => {
    assert.equal(cities.length, 27);
    assert.deepEqual(cities.map(c => c.order).sort((a, b) => a - b), cities.map((_, i) => i + 1));
    assert.equal(new Set(cities.map(c => c.id)).size, cities.length);
    for (const c of cities) {
      assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= H, `${c.id} fora do mapa`);
      assert.ok(c.name && c.uf, c.id);
    }
    assert.ok(cities.some(c => c.id === 'brasilia'));
    assert.ok(cities.some(c => c.id === 'curitiba'));
  });
  test('START esta em tile andavel', () => {
    const s = ev('START');
    assert.ok(s.x > 0 && s.y > 0);
    assert.equal(solidGrid[s.y * W + s.x], 0, `START solido em ${s.x},${s.y}`);
  });
  test('isSolid trata fora do mapa como solido e tile andavel como livre', () => {
    assert.equal(ev('isSolid(-1,-1)'), true);
    assert.equal(ev(`isSolid(${W},${H})`), true);
    const s = ev('START');
    const npcAt = ev('World.npcs').some(n => n.x === s.x && n.y === s.y);
    if (!npcAt) assert.equal(ev(`isSolid(${s.x},${s.y})`), false);
  });
  test('predios e portas dentro do mapa', () => {
    for (const b of ev('World.buildings')) {
      if (b.door) assert.ok(b.door.x >= 0 && b.door.y >= 0 && b.door.x < W && b.door.y < H, `porta fora: ${b.id}`);
    }
  });
});

describe('rotas', () => {
  test('26 rotas ligando cidades consecutivas, sem fallback', () => {
    assert.equal(routes.length, cities.length - 1);
    const byId = Object.fromEntries(cities.map(c => [c.id, c]));
    for (const r of routes) {
      assert.ok(byId[r.from] && byId[r.to], `${r.id}: cidade inexistente`);
      assert.equal(byId[r.to].order, byId[r.from].order + 1, `${r.id}: nao consecutiva`);
      assert.ok(r.length > 0, `${r.id}: vazia`);
    }
    const fb = routes.filter(r => r.fallback).map(r => r.id);
    assert.deepEqual(fb, [], 'rotas em fallback (A* falhou e usou caminho reto)');
  });
  test('toda celula do caminho de cada rota (_M.routeList[].cells) e andavel', () => {
    const list = ev('_M.routeList.map(r => ({ id: r.id, cells: r.cells, ext: r.ext || [] }))');
    assert.equal(list.length, routes.length);
    const tiles = ev('World.tiles');
    const bad = [];
    for (const r of list) {
      assert.ok(r.cells.length > 0, `${r.id}: sem celulas`);
      for (const [x, y] of r.cells) if (solidGrid[y * W + x]) bad.push(`${r.id} em ${x},${y} (${tiles[y][x]})`);
    }
    assert.deepEqual(bad.slice(0, 20), [], `${bad.length} celulas de rota bloqueadas`);
  });
  test('celulas de rota sao 4-conexas (sem buracos no caminho)', () => {
    const list = ev('_M.routeList.map(r => ({ id: r.id, cells: r.cells }))');
    const bad = [];
    for (const r of list) for (let i = 1; i < r.cells.length; i++) {
      const [x0, y0] = r.cells[i - 1], [x1, y1] = r.cells[i];
      if (Math.abs(x0 - x1) + Math.abs(y0 - y1) > 1) bad.push(`${r.id}[${i}]: ${x0},${y0} -> ${x1},${y1}`);
    }
    assert.deepEqual(bad.slice(0, 20), [], `${bad.length} saltos`);
  });
});

describe('alcancabilidade', () => {
  function bfs(sx, sy) {
    const seen = new Uint8Array(W * H), q = new Int32Array(W * H);
    let h = 0, t = 0;
    q[t++] = sy * W + sx; seen[sy * W + sx] = 1;
    while (h < t) {
      const i = q[h++], x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = ny * W + nx;
        if (seen[j] || solidGrid[j]) continue;
        seen[j] = 1; q[t++] = j;
      }
    }
    return seen;
  }
  test('do START da para andar ate cada cidade (BFS 4-direcoes, ignorando NPCs)', () => {
    const s = ev('START'), seen = bfs(s.x, s.y);
    const unreachable = [];
    for (const c of cities) {
      let ok = false;
      for (let y = c.y; y < c.y + c.h && !ok; y++) for (let x = c.x; x < c.x + c.w; x++) if (seen[y * W + x]) { ok = true; break; }
      if (!ok) unreachable.push(c.id);
    }
    assert.deepEqual(unreachable, []);
  });
  test('portas dos predios sao alcancaveis a partir do START', () => {
    const s = ev('START'), seen = bfs(s.x, s.y);
    const bad = [];
    for (const b of ev('World.buildings')) {
      if (!b.door) continue;
      const { x, y } = b.door;
      // porta em si pode ser tile solido de predio; basta um vizinho alcancavel
      const ok = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[(y + dy) * W + x + dx]);
      if (!ok) bad.push(`${b.kind || ''}:${b.id || ''}@${x},${y}`);
    }
    assert.deepEqual(bad.slice(0, 20), [], `${bad.length} portas inalcancaveis`);
  });
  test('todas as celulas de rota sao alcancaveis a partir do START', () => {
    const s = ev('START'), seen = bfs(s.x, s.y);
    const list = ev('_M.routeList.map(r => ({ id: r.id, cells: r.cells }))');
    const bad = new Set();
    for (const r of list) for (const [x, y] of r.cells) if (!seen[y * W + x]) bad.add(r.id);
    assert.deepEqual([...bad], [], 'rotas com celulas desconectadas do START');
  });
});

describe('areas de encontro', () => {
  test('toda area tem levels lo<=hi, pool nao vazio e ids existentes', () => {
    const POL = ev('POL');
    const bad = [];
    const entries = Object.entries(areas);
    assert.ok(entries.length > 0);
    for (const [id, a] of entries) {
      const [lo, hi] = a.levels || [];
      if (!(Number.isInteger(lo) && Number.isInteger(hi) && lo >= 1 && lo <= hi)) bad.push(`${id}: levels ${JSON.stringify(a.levels)}`);
      if (!Array.isArray(a.pool) || !a.pool.length) bad.push(`${id}: pool vazio`);
      else for (const [pid, w] of a.pool) {
        if (!POL[pid]) bad.push(`${id}: ${pid} nao existe`);
        if (!(w > 0)) bad.push(`${id}: peso ${w} de ${pid}`);
      }
    }
    assert.deepEqual(bad, []);
  });
  test('existe area de cidade e de rota para cada cidade/rota', () => {
    for (const c of cities) assert.ok(areas['cidade_' + c.id], `sem area cidade_${c.id}`);
    for (const r of routes) assert.ok(areas[r.id], `sem area ${r.id}`);
  });
  test('niveis das areas de rota nao diminuem ao longo da viagem (documenta progressao)', () => {
    const mids = routes.map(r => (areas[r.id].levels[0] + areas[r.id].levels[1]) / 2);
    const drops = [];
    for (let i = 1; i < mids.length; i++) if (mids[i] < mids[i - 1]) drops.push(`${routes[i - 1].id}->${routes[i].id}: ${mids[i - 1]} -> ${mids[i]}`);
    assert.deepEqual(drops, []);
  });
  test('gymData/cityArea funcionam para todas as cidades (carregando gyms.js)', async () => {
    const l = await load({ files: ['data.js', 'rules.js', 'map.js', 'gyms.js'] });
    l.ev('buildWorld()'); l.ev(`GYMS = ${JSON.stringify(require('./load').readJSON('data/gyms.json'))}`);
    for (const c of l.ev('World.cities')) {
      const team = l.ev(`buildGymTeam(cityById(${JSON.stringify(c.id)}), 0, true)`);
      assert.ok(team.length >= 1, c.id);
      for (const [id, lvl] of team) { assert.ok(l.ev(`!!POL[${JSON.stringify(id)}]`), `${c.id}: ${id}`); assert.ok(lvl >= 2, c.id); }
    }
  });
});
