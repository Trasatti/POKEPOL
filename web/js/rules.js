// POKÉPOL — regras de combate no modelo da 3ª geração (Fire Red):
// status com IV, dano físico/especial, PP, estados, habilidades e "evolução" por cargo político.

// Habilidades suportadas pelo motor (nomes podem ser sobrescritos por data/balance.json).
const ABILITIES = {
  foro:        { name: 'Foro Privilegiado',  desc: 'Mais difícil de prender.' },
  carteirada:  { name: 'Carteirada',         desc: 'Ao entrar, baixa o Ataque do adversário.' },
  imunidade:   { name: 'Imunidade Parlamentar', desc: 'Não sofre estados.' },
  blindagem:   { name: 'Blindagem',          desc: 'Recebe metade do dano com a vida cheia.' },
  contato:     { name: 'Rabo Preso',         desc: 'Quem bate nele pode virar INVESTIGADO.' },
  fujao:       { name: 'Passaporte Pronto',  desc: 'Pode fugir da batalha a qualquer momento.' },
  verba:       { name: 'Verba de Gabinete',  desc: 'Recupera um pouco de vida a cada turno.' },
  pressao:     { name: 'Pressão do Centrão', desc: 'Os golpes do adversário gastam 2 PP.' },
  especialista:{ name: 'Especialista',       desc: 'Golpes do próprio tipo ficam ainda mais fortes.' },
  recurso:     { name: 'Recurso Infinito',   desc: 'Com a vida cheia, aguenta um golpe fatal com 1 de vida.' },
  acelera:     { name: 'Fuga Rápida',        desc: 'Fica mais rápido a cada turno.' },
  delator:     { name: 'Delação',            desc: 'Ao ser derrotado, baixa a Defesa de quem o derrotou.' },
};

const STATUS_INFO = {
  investigado: { tag: 'INV', color: '#a040a0', name: 'INVESTIGADO' },
  preso:       { tag: 'PRE', color: '#d8b030', name: 'PRESO PREVENTIVO' },
  vista:       { tag: 'VIS', color: '#8890a0', name: 'PEDIDO DE VISTA' },
};

// Golpes "especiais" (usam Ataque/Defesa Especial) quando o golpe não declara categoria.
const SPECIAL_TYPES = new Set(['FAKE', 'DELACAO', 'LAVAGEM', 'CENTRAO']);
const moveCat = mv => mv.cat || (!mv.pow ? 'status' : SPECIAL_TYPES.has(mv.type) ? 'esp' : 'fis');
const movePP = mv => mv.pp || (!mv.pow ? 20 : mv.pow >= 90 ? 5 : mv.pow >= 75 ? 10 : mv.pow >= 55 ? 15 : 25);

// Golpe usado quando acabam todos os PP (como o Struggle).
MOVES.desespero = { name: 'Desespero', type: 'NORMAL', cat: 'fis', pow: 50, acc: 100, pp: 1, eff: 'recoil', chance: 100 };

// ---------- Base, carreira e status ----------
function base6(p) {
  const b = p.base;
  return b.length >= 6 ? b : [b[0], b[1], b[2], b[1], b[2], b[3]]; // [hp, atk, def, spa, spd, spe]
}

// Estágio de carreira (a "evolução"): cada cargo novo aumenta os status base.
function careerStage(p, lvl) {
  const c = p.career || [];
  let s = 0;
  c.forEach((r, i) => { if (lvl >= r.lvl) s = i; });
  return s;
}
function rankName(m) {
  const c = POL[m.id].career;
  return c && c.length ? c[careerStage(POL[m.id], m.lvl)].rank : '';
}
// Primeiro cargo = 70% dos status base; último cargo = 100% (como a evolução final).
function stageBoost(p, lvl) {
  const n = (p.career || []).length;
  return n < 2 ? 1 : 0.7 + 0.3 * careerStage(p, lvl) / (n - 1);
}

function stats(m) {
  const p = POL[m.id], L = m.lvl, iv = m.iv || [15, 15, 15, 15, 15, 15];
  // stageBase: status base próprios de cada cargo; senão, base escalada pelo cargo atual.
  const sb = p.stageBase && p.stageBase[Math.min(careerStage(p, L), p.stageBase.length - 1)];
  const b = sb || base6(p).map(v => v * stageBoost(p, L));
  const o = i => Math.floor((2 * b[i] + iv[i]) * L / 100) + 5;
  return { hp: Math.floor((2 * b[0] + iv[0]) * L / 100) + L + 10, atk: o(1), def: o(2), spa: o(3), spd: o(4), spe: o(5) };
}

function movesAt(id, lvl) {
  return [...new Set(POL[id].learn.filter(([l]) => l <= lvl).map(([, m]) => m))].filter(k => MOVES[k]).slice(-4);
}

function makeMon(id, lvl) {
  const m = { id, lvl, xp: lvl ** 3, moves: movesAt(id, lvl), iv: Array.from({ length: 6 }, () => Math.floor(Math.random() * 32)), status: null };
  m.pp = Object.fromEntries(m.moves.map(k => [k, movePP(MOVES[k])]));
  m.hp = stats(m).hp;
  return m;
}

// Garante campos novos em políticos de saves antigos.
function upgradeMon(m) {
  if (!POL[m.id]) return false;
  m.iv = m.iv || Array.from({ length: 6 }, () => 15);
  m.moves = (m.moves || []).filter(k => MOVES[k]);
  if (!m.moves.length) m.moves = movesAt(m.id, m.lvl);
  m.pp = m.pp || {};
  for (const k of m.moves) if (m.pp[k] == null) m.pp[k] = movePP(MOVES[k]);
  m.status = m.status || null;
  m.hp = Math.min(m.hp, stats(m).hp);
  return true;
}

function restoreMon(m) {
  m.hp = stats(m).hp; m.status = null; m.sleep = 0;
  for (const k of m.moves) m.pp[k] = movePP(MOVES[k]);
}

const expYield = p => p.exp || p.xp || Math.floor(base6(p).reduce((a, b) => a + b, 0) / 5);
const abilityOf = m => POL[m.id].ability;
const hasAb = (m, a) => abilityOf(m) === a;

// Multiplicador de estágio da 3ª geração (-6..+6).
const stageMul = s => Math.max(2, 2 + s) / Math.max(2, 2 - s);
const accMul = s => Math.max(3, 3 + s) / Math.max(3, 3 - s);

// Dano da 3ª geração. Retorna { dmg, eff, crit }.
function calcDamage(att, def, mv, stA, stD) {
  const sa = stats(att), sd = stats(def);
  const cat = moveCat(mv);
  const critStage = (mv.eff === 'critico' ? 1 : 0);
  const crit = Math.random() < [1 / 16, 1 / 8][critStage] ? 2 : 1;
  // no crítico, ignora quedas do atacante e aumentos do defensor
  const aS = cat === 'esp' ? stA.spa : stA.atk, dS = cat === 'esp' ? stD.spd : stD.def;
  const A = (cat === 'esp' ? sa.spa : sa.atk) * stageMul(crit > 1 ? Math.max(0, aS) : aS);
  const D = (cat === 'esp' ? sd.spd : sd.def) * stageMul(crit > 1 ? Math.min(0, dS) : dS);
  const pow = mv.eff === 'fixo' ? 0 : mv.pow;
  if (mv.eff === 'fixo') return { dmg: att.lvl, eff: 1, crit: 1 };
  let dmg = Math.floor(Math.floor(Math.floor(2 * att.lvl / 5 + 2) * pow * A / D) / 50) + 2;
  const eff = typeMult(mv.type, POL[def.id].types);
  const stab = POL[att.id].types.includes(mv.type) ? (hasAb(att, 'especialista') ? 2 : 1.5) : 1;
  dmg = Math.floor(dmg * crit * stab * eff * (85 + Math.floor(Math.random() * 16)) / 100);
  if (hasAb(def, 'blindagem') && def.hp >= sd.hp) dmg = Math.floor(dmg / 2);
  return { dmg: eff === 0 ? 0 : Math.max(1, dmg), eff, crit };
}

// Captura da 3ª geração: retorna nº de balançadas (4 = preso).
function catchShakes(foe, ballRate) {
  const p = POL[foe.id], max = stats(foe).hp;
  let rate = p.catch || (p.cr ? Math.round(p.cr * 255) : p.w >= 7 ? 190 : p.w >= 4 ? 120 : 45);
  if (hasAb(foe, 'foro')) rate = Math.floor(rate / 2);
  const sb = foe.status === 'vista' ? 2 : foe.status ? 1.5 : 1;
  const a = Math.floor((3 * max - 2 * foe.hp) * rate * ballRate / (3 * max) * sb);
  if (a >= 255) return 4;
  const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a))));
  let n = 0;
  while (n < 4 && Math.floor(Math.random() * 65536) < b) n++;
  return n;
}

// Dados de balanceamento opcionais (gerados em docs/balanceamento.json e copiados para web/data/).
function loadBalance() {
  const src = location.protocol === 'file:' && window.BALANCE_DATA ? Promise.resolve(window.BALANCE_DATA)
    : fetch('data/balance.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : window.BALANCE_DATA || null).catch(() => window.BALANCE_DATA || null);
  return src.then(d => {
    if (!d) return;
    Object.assign(MOVES, d.moves || {});
    Object.assign(ABILITIES, d.abilities || {});
    for (const [id, v] of Object.entries(d.politicos || {})) {
      const p = POL[id]; if (!p) continue;
      for (const k of ['base', 'exp', 'career', 'ability', 'catch', 'stageBase']) if (v[k] != null) p[k] = v[k];
      if (v.learn) p.learn = v.learn.filter(([, mk]) => MOVES[mk]);
    }
    if (d.zoneLevels) for (const z in d.zoneLevels) ZONE_LEVELS[z] = d.zoneLevels[z];
    if (d.bosses) for (const k in d.bosses) if (BOSSES[k]) BOSSES[k].team = d.bosses[k].filter(([id]) => POL[id]);
  });
}
