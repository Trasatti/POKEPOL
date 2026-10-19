'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { load, readJSON, fs, path, WEB } = require('./load');

let ev, balance, gyms, empresas, sprites, cityIds;
let TYPES, MOVES, POLITICOS, POL, STARTERS, BOSSES, ITEMS, SHOP, ABILITIES;

before(async () => {
  ({ ev, balance } = await load());           // ja com balance.json aplicado por loadBalance()
  gyms = readJSON('data/gyms.json');
  empresas = readJSON('data/empresas.json');
  sprites = new Set(readJSON('sprites/index.json'));
  TYPES = ev('TYPES'); MOVES = ev('MOVES'); POLITICOS = ev('POLITICOS'); POL = ev('POL');
  STARTERS = ev('STARTERS'); BOSSES = ev('BOSSES'); ITEMS = ev('ITEMS'); SHOP = ev('SHOP'); ABILITIES = ev('ABILITIES');
  ev('buildWorld()');
  cityIds = ev('World.cities').map(c => c.id);
});

const nonEmpty = s => typeof s === 'string' && s.trim().length > 0;
const J = JSON.stringify;

describe('tipos e tabela de tipos', () => {
  test('CHART so referencia tipos existentes e multiplicadores validos', () => {
    const CHART = ev('CHART');
    for (const [a, row] of Object.entries(CHART)) {
      assert.ok(TYPES[a], `tipo atacante inexistente: ${a}`);
      for (const [d, m] of Object.entries(row)) {
        assert.ok(TYPES[d], `tipo defensor inexistente: ${a}->${d}`);
        assert.ok([0, 0.25, 0.5, 2, 4].includes(m), `multiplicador estranho ${a}->${d}: ${m}`);
      }
    }
  });
});

describe('golpes', () => {
  test('todo golpe tem nome, tipo valido, pow/acc/pp/cat validos', () => {
    const bad = [];
    for (const [k, m] of Object.entries(MOVES)) {
      if (!nonEmpty(m.name)) bad.push(`${k}: sem nome`);
      if (!TYPES[m.type]) bad.push(`${k}: tipo invalido ${m.type}`);
      if (!Number.isFinite(m.pow) || m.pow < 0) bad.push(`${k}: pow invalido ${m.pow}`);
      if (!Number.isFinite(m.acc) || m.acc <= 0 || m.acc > 100) bad.push(`${k}: acc invalido ${m.acc}`);
      if (m.pp != null && !(Number.isInteger(m.pp) && m.pp > 0)) bad.push(`${k}: pp invalido ${m.pp}`);
      if (m.cat != null && !['fis', 'esp', 'status'].includes(m.cat)) bad.push(`${k}: cat invalida ${m.cat}`);
      if (m.cat === 'status' && m.pow > 0) bad.push(`${k}: cat=status com pow>0`);
    }
    assert.deepEqual(bad, []);
  });
  test('movePP e moveCat sempre devolvem valores validos (inclusive sem pp/cat)', () => {
    for (const k of Object.keys(MOVES)) {
      const pp = ev(`movePP(MOVES[${J(k)}])`), cat = ev(`moveCat(MOVES[${J(k)}])`);
      assert.ok(pp > 0, k);
      assert.ok(['fis', 'esp', 'status'].includes(cat), k);
    }
  });
  test('efeitos (eff) dos golpes sao conhecidos pelo motor (game.js)', () => {
    const game = fs.readFileSync(path.join(WEB, 'js/game.js'), 'utf8');
    const unknown = new Set();
    for (const [k, m] of Object.entries(MOVES)) {
      const e = m.eff;
      if (e == null) continue;
      if (/^(atk|def|spa|spd|spe|acc)(up|down)2?$/.test(e)) continue;
      if (game.includes(`'${e}'`) || game.includes(`"${e}"`) || game.includes(`.${e}`)) continue;
      unknown.add(`${k}:${e}`);
    }
    assert.deepEqual([...unknown], [], 'eff nao tratado em game.js');
  });
});

describe('politicos', () => {
  test('ids unicos', () => {
    const seen = new Set(), dup = [];
    for (const p of POLITICOS) { if (seen.has(p.id)) dup.push(p.id); seen.add(p.id); }
    assert.deepEqual(dup, []);
    assert.equal(Object.keys(POL).length, POLITICOS.length);
  });
  test('campos obrigatorios (name, real, fact, types validos, base)', () => {
    const bad = [];
    for (const p of POLITICOS) {
      if (!nonEmpty(p.name)) bad.push(`${p.id}: name vazio`);
      if (!nonEmpty(p.real)) bad.push(`${p.id}: real vazio`);
      if (!nonEmpty(p.fact)) bad.push(`${p.id}: fact vazio`);
      if (!Array.isArray(p.types) || !p.types.length || p.types.length > 2) bad.push(`${p.id}: types invalido`);
      else for (const t of p.types) if (!TYPES[t]) bad.push(`${p.id}: tipo ${t} nao existe`);
      const b = p.base;
      if (!Array.isArray(b) || ![4, 6].includes(b.length) || b.some(v => !(v > 0))) bad.push(`${p.id}: base invalida ${J(b)}`);
      if (!p.art) bad.push(`${p.id}: sem art`);
    }
    assert.deepEqual(bad, []);
  });
  test('learnsets (apos balance.json) so usam golpes existentes, com ao menos 1 golpe no nivel 1', () => {
    const bad = [];
    for (const p of POLITICOS) {
      if (!Array.isArray(p.learn) || !p.learn.length) { bad.push(`${p.id}: sem learn`); continue; }
      for (const [l, k] of p.learn) {
        if (!MOVES[k]) bad.push(`${p.id}: golpe inexistente ${k}`);
        if (!(Number.isInteger(l) && l >= 1)) bad.push(`${p.id}: nivel invalido ${l} (${k})`);
      }
      if (!p.learn.some(([l, k]) => l <= 1 && MOVES[k])) bad.push(`${p.id}: nenhum golpe no nivel 1`);
    }
    assert.deepEqual(bad, []);
  });
  test('learnsets BRUTOS de balance.json tambem referenciam golpes/politicos existentes', () => {
    const bad = [];
    for (const [id, v] of Object.entries(balance.politicos)) {
      if (!POL[id]) bad.push(`balance: politico desconhecido ${id}`);
      for (const [, k] of v.learn || []) if (!MOVES[k]) bad.push(`balance ${id}: golpe ${k} nao existe`);
    }
    assert.deepEqual(bad, []);
  });
  test('todo politico tem entrada em balance.json (aviso suave)', () => {
    const miss = POLITICOS.filter(p => !balance.politicos[p.id]).map(p => p.id);
    if (miss.length) console.warn(`[AVISO] ${miss.length} politicos sem balanceamento em balance.json: ${miss.join(', ')}`);
  });
  test('habilidades usadas existem em ABILITIES', () => {
    const bad = POLITICOS.filter(p => p.ability && !ABILITIES[p.ability]).map(p => `${p.id}: ${p.ability}`);
    assert.deepEqual(bad, []);
  });
  test('carreira: niveis estritamente crescentes e ranks nao vazios', () => {
    const bad = [];
    for (const p of POLITICOS) {
      (p.career || []).forEach((c, i, a) => {
        if (!nonEmpty(c.rank)) bad.push(`${p.id}: rank vazio`);
        if (i > 0 && !(c.lvl > a[i - 1].lvl)) bad.push(`${p.id}: career fora de ordem`);
      });
      if (p.stageBase && p.career && p.stageBase.length > p.career.length) bad.push(`${p.id}: stageBase maior que career`);
    }
    assert.deepEqual(bad, []);
  });
  test('dex: numeros unicos de 1..N', () => {
    const d = POLITICOS.map(p => p.dex).sort((a, b) => a - b);
    assert.deepEqual(d, d.map((_, i) => i + 1));
  });
  test('DEX_ORDER sem ids inexistentes', () => {
    assert.deepEqual(ev('DEX_ORDER').filter(id => !POL[id]), []);
  });
  test('sprites: PNGs ausentes do index sao so aviso; index listando PNG inexistente e falha', () => {
    const missing = POLITICOS.filter(p => !sprites.has(p.id)).map(p => p.id);
    const missingBack = POLITICOS.filter(p => !sprites.has(p.id + '_back')).map(p => p.id);
    if (missing.length) console.warn(`[AVISO] ${missing.length} politicos sem sprite frontal: ${missing.join(', ')}`);
    if (missingBack.length) console.warn(`[AVISO] ${missingBack.length} politicos sem sprite de costas: ${missingBack.join(', ')}`);
    const gone = [...sprites].filter(n => !fs.existsSync(path.join(WEB, 'sprites', n + '.png')));
    assert.deepEqual(gone, [], 'index.json lista PNGs que nao existem');
  });
});

describe('iniciais, chefoes, itens', () => {
  test('STARTERS existem e sao distintos', () => {
    assert.ok(STARTERS.length >= 1);
    assert.equal(new Set(STARTERS).size, STARTERS.length);
    for (const id of STARTERS) assert.ok(POL[id], `inicial inexistente: ${id}`);
  });
  test('BOSSES: equipes com ids existentes e niveis validos', () => {
    for (const [k, b] of Object.entries(BOSSES)) {
      assert.ok(nonEmpty(b.name) && nonEmpty(b.title), `${k}: name/title`);
      assert.ok(b.team.length >= 1, `${k}: sem equipe`);
      for (const [id, lvl] of b.team) {
        assert.ok(POL[id], `${k}: politico inexistente ${id}`);
        assert.ok(Number.isInteger(lvl) && lvl >= 1 && lvl <= 100, `${k}: nivel ${lvl}`);
      }
      assert.ok(b.prize > 0, `${k}: prize`);
    }
  });
  test('balance.json: bosses referenciam ids existentes', () => {
    for (const [k, team] of Object.entries(balance.bosses || {})) {
      assert.ok(BOSSES[k], `boss desconhecido ${k}`);
      for (const [id] of team) assert.ok(POL[id], `balance boss ${k}: ${id} nao existe`);
    }
  });
  test('ZONE_LEVELS: lo<=hi', () => {
    for (const [z, [lo, hi]] of Object.entries(ev('ZONE_LEVELS'))) assert.ok(lo <= hi && lo >= 1, `zona ${z}`);
  });
  test('ITEMS e SHOP coerentes', () => {
    for (const id of SHOP) assert.ok(ITEMS[id], `SHOP: ${id}`);
    for (const [k, it] of Object.entries(ITEMS)) {
      assert.ok(nonEmpty(it.name) && nonEmpty(it.desc), k);
      assert.ok(it.price > 0, `${k}: price`);
      assert.ok(it.ball || it.heal || it.cure || it.revive, `${k}: sem efeito`);
    }
  });
});

describe('gyms.json', () => {
  test('uma entrada por cidade do mapa (exceto Brasilia) e sem cidades fantasma', () => {
    assert.deepEqual(cityIds.filter(id => id !== 'brasilia' && !gyms[id]), [], 'cidades sem entrada');
    assert.deepEqual(Object.keys(gyms).filter(id => !cityIds.includes(id)), [], 'entradas de cidade inexistente');
  });
  test('campos de cada ginasio', () => {
    for (const [id, g] of Object.entries(gyms)) {
      if (id === 'brasilia') { assert.ok(g.elite && g.champion, 'brasilia: elite/champion'); continue; }
      assert.ok(nonEmpty(g.badge), `${id}: badge`);
      assert.ok(g.boss && nonEmpty(g.boss.name), `${id}: boss`);
      assert.ok(Array.isArray(g.trainers) && g.trainers.length >= 1, `${id}: trainers`);
      for (const t of g.trainers) assert.ok(nonEmpty(t.name), `${id}: trainer sem nome`);
      for (const t of g.typeFocus || []) assert.ok(TYPES[t], `${id}: typeFocus ${t}`);
    }
  });
});

describe('empresas.json', () => {
  test('ids unicos, times com politicos existentes, cidade valida', () => {
    const seen = new Set();
    for (const e of empresas) {
      assert.ok(!seen.has(e.id), `id duplicado ${e.id}`); seen.add(e.id);
      assert.ok(cityIds.includes(e.city), `${e.id}: cidade ${e.city}`);
      assert.ok(e.owner && nonEmpty(e.owner.name), `${e.id}: owner`);
      assert.ok(e.team.length >= 1, `${e.id}: sem time`);
      for (const t of e.team) {
        const id = typeof t === 'string' ? t : t.id;
        assert.ok(POL[id], `${e.id}: politico inexistente ${id}`);
      }
      assert.ok(e.caseValue > 0, `${e.id}: caseValue`);
    }
  });
});
