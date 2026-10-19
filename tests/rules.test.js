'use strict';
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load');

let ev, POLITICOS;
before(async () => { ({ ev } = await load({ files: ['data.js', 'rules.js'] })); POLITICOS = ev('POLITICOS'); });

const J = JSON.stringify;
const withCareer = () => POLITICOS.filter(p => (p.career || []).length >= 2);
const ids = () => POLITICOS.map(p => p.id);
const ST0 = '{atk:0,def:0,spa:0,spd:0,spe:0,acc:0}';

describe('stats e makeMon', () => {
  test('status nao diminuem com o nivel, para todos os politicos', () => {
    const bad = [];
    for (const id of ids()) {
      let prev = null;
      for (const lvl of [5, 10, 20, 30, 50, 80, 100]) {
        const s = ev(`stats({id:${J(id)},lvl:${lvl}})`);
        if (prev) for (const k of Object.keys(s)) if (s[k] < prev[k]) bad.push(`${id} ${k} cai no nivel ${lvl}: ${prev[k]} -> ${s[k]}`);
        prev = s;
      }
    }
    assert.deepEqual(bad, []);
  });
  test('status do nivel 100 sao maiores que os do nivel 5', () => {
    for (const id of ids()) {
      const a = ev(`stats({id:${J(id)},lvl:5})`), b = ev(`stats({id:${J(id)},lvl:100})`);
      for (const k of Object.keys(a)) assert.ok(b[k] > a[k], `${id}.${k}`);
    }
  });
  test('status sao inteiros positivos', () => {
    for (const id of ids()) {
      const s = ev(`stats({id:${J(id)},lvl:1})`);
      for (const [k, v] of Object.entries(s)) assert.ok(Number.isInteger(v) && v > 0, `${id}.${k}=${v}`);
    }
  });
  test('makeMon: hp = hp maximo, 1..4 golpes, cada um com pp', () => {
    for (const id of ids()) for (const lvl of [1, 5, 25, 60]) {
      const m = ev(`makeMon(${J(id)}, ${lvl})`);
      assert.equal(m.hp, ev(`stats(${J(m)}).hp`), `${id} L${lvl} hp`);
      assert.ok(m.moves.length >= 1 && m.moves.length <= 4, `${id} L${lvl}: ${m.moves.length} golpes`);
      assert.equal(new Set(m.moves).size, m.moves.length, `${id} golpes repetidos`);
      for (const k of m.moves) assert.ok(m.pp[k] > 0, `${id} ${k} pp`);
      assert.equal(m.xp, lvl ** 3);
      assert.equal(m.iv.length, 6);
      assert.ok(m.iv.every(v => v >= 0 && v <= 31));
    }
  });
  test('restoreMon recupera vida, status e PP', () => {
    const m = ev('makeMon(STARTERS[0], 12)');
    m.hp = 1; m.status = 'preso';
    const k = m.moves[0]; m.pp[k] = 0;
    const r = ev(`(function(m){ restoreMon(m); return m; })(${J(m)})`);
    assert.equal(r.status, null);
    assert.equal(r.hp, ev(`stats(${J(r)}).hp`));
    assert.ok(r.pp[k] > 0);
  });
});

describe('carreira', () => {
  test('existem politicos com carreira', () => assert.ok(withCareer().length > 0));
  test('careerStage e monotono no nivel e fica dentro de [0, n-1]', () => {
    for (const p of withCareer()) {
      let prev = -1;
      for (let l = 1; l <= 100; l++) {
        const s = ev(`careerStage(POL[${J(p.id)}], ${l})`);
        assert.ok(s >= prev, `${p.id}: estagio cai no nivel ${l}`);
        assert.ok(s >= 0 && s < p.career.length, `${p.id}: estagio fora do intervalo`);
        prev = s;
      }
    }
  });
  test('careerStage sem carreira = 0 e rankName devolve string', () => {
    for (const p of POLITICOS) {
      if (!(p.career || []).length) assert.equal(ev(`careerStage(POL[${J(p.id)}], 50)`), 0);
      assert.equal(typeof ev(`rankName({id:${J(p.id)},lvl:30})`), 'string');
    }
  });
  test('stageBoost entre 0.7 e 1 e nao decresce', () => {
    for (const p of withCareer()) {
      let prev = 0;
      for (let l = 1; l <= 100; l += 3) {
        const b = ev(`stageBoost(POL[${J(p.id)}], ${l})`);
        assert.ok(b >= 0.7 - 1e-9 && b <= 1 + 1e-9 && b >= prev, `${p.id} L${l}: ${b}`);
        prev = b;
      }
    }
  });
});

describe('dano', () => {
  test('calcDamage positivo para golpes de dano; 0 so quando imune (eff 0)', () => {
    for (let i = 0; i < Math.min(60, POLITICOS.length); i++) {
      const a = POLITICOS[i], d = POLITICOS[(i + 7) % POLITICOS.length];
      const att = ev(`makeMon(${J(a.id)},30)`), def = ev(`makeMon(${J(d.id)},30)`);
      for (const k of att.moves) {
        const mv = ev(`MOVES[${J(k)}]`);
        if (!(mv.pow > 0) || mv.eff === 'fixo') continue;
        const r = ev(`calcDamage(${J(att)}, ${J(def)}, MOVES[${J(k)}], ${ST0}, ${ST0})`);
        const e = ev(`typeMult(${J(mv.type)}, POL[${J(d.id)}].types)`);
        if (e === 0) assert.equal(r.dmg, 0); else assert.ok(r.dmg >= 1, `${a.id}->${d.id} ${k}: dmg=${r.dmg}`);
        assert.equal(r.eff, e);
      }
    }
  });
  test('super efetivo (x2) causa ~2x o dano neutro e resistido (x0.5) ~0.5x', () => {
    const r = ev(`(function(){
      const mv = { name:'t', type:'PROPINA', pow:60, acc:100, cat:'fis' };
      const att = makeMon(STARTERS[0], 40);
      const base = POL[STARTERS[1]];
      POL.__sup = Object.assign({}, base, { types:['DELACAO'], ability: null });   // PROPINA > DELACAO
      POL.__res = Object.assign({}, base, { types:['LAVAGEM'], ability: null });   // PROPINA < LAVAGEM
      POL.__neu = Object.assign({}, base, { types:['NORMAL'], ability: null });
      const mk = id => ({ id, lvl:40, iv:[15,15,15,15,15,15], hp:999, status:null });
      const avg = id => { let s=0; for (let i=0;i<600;i++) s += calcDamage(att, mk(id), mv, ${ST0}, ${ST0}).dmg; return s/600; };
      const r = { sup: avg('__sup'), neu: avg('__neu'), res: avg('__res') };
      delete POL.__sup; delete POL.__res; delete POL.__neu;
      return r;
    })()`);
    assert.ok(r.sup > r.neu * 1.7 && r.sup < r.neu * 2.3, J(r));
    assert.ok(r.res < r.neu * 0.6 && r.res > r.neu * 0.4, J(r));
  });
  test('golpe fixo causa dano igual ao nivel do atacante', () => {
    const r = ev(`calcDamage(makeMon(STARTERS[0], 33), makeMon(STARTERS[1], 33), {name:'x',type:'NORMAL',pow:1,acc:100,eff:'fixo'}, ${ST0}, ${ST0})`);
    assert.equal(r.dmg, 33);
  });
  test('typeMult reproduz a CHART real e e neutro fora dela', () => {
    for (const [a, row] of Object.entries(ev('CHART'))) for (const [d, m] of Object.entries(row)) {
      assert.equal(ev(`typeMult(${J(a)}, [${J(d)}])`), m, `${a}->${d}`);
    }
    assert.equal(ev("typeMult('NORMAL', ['PROPINA'])"), 1);
  });
  test('stageMul/accMul: neutros em 0 e crescentes', () => {
    assert.equal(ev('stageMul(0)'), 1); assert.equal(ev('accMul(0)'), 1);
    for (let s = -6; s < 6; s++) { assert.ok(ev(`stageMul(${s + 1})`) > ev(`stageMul(${s})`)); assert.ok(ev(`accMul(${s + 1})`) > ev(`accMul(${s})`)); }
  });
});

describe('captura e XP', () => {
  const foeAt = (id, frac) => ev(`(function(){const m=makeMon(${J(id)},20); m.hp=Math.max(1,Math.floor(stats(m).hp*${frac})); return m;})()`);
  test('catchShakes sempre inteiro em 0..4 (varios HPs e bolas)', () => {
    for (const id of ids().slice(0, 60)) for (const ball of [1, 1.8, 3.5]) for (const frac of [1, 0.5, 0.01]) {
      const foe = foeAt(id, frac);
      for (let i = 0; i < 3; i++) {
        const n = ev(`catchShakes(${J(foe)}, ${ball})`);
        assert.ok(Number.isInteger(n) && n >= 0 && n <= 4, `${id}: ${n}`);
      }
    }
  });
  test('catchShakes: vida baixa + bola forte prende mais que vida cheia + bola fraca', () => {
    const id = ev('POLITICOS.find(p => p.ability !== "foro" && !STARTERS.includes(p.id)).id');
    const avg = (frac, ball) => {
      const foe = foeAt(id, frac);
      let s = 0; for (let i = 0; i < 300; i++) s += ev(`catchShakes(${J(foe)}, ${ball})`); return s / 300;
    };
    assert.ok(avg(0.05, 3.5) > avg(1, 1), 'captura nao responde a vida/bola');
  });
  test('expYield positivo para todos', () => {
    for (const p of POLITICOS) assert.ok(ev(`expYield(POL[${J(p.id)}])`) > 0, p.id);
  });
  test('curva de XP: makeMon usa lvl^3 e a curva e estritamente crescente', () => {
    assert.equal(ev('makeMon(STARTERS[0], 17)').xp, 17 ** 3);
    for (let l = 1; l < 100; l++) assert.ok((l + 1) ** 3 > l ** 3);
  });
});

describe('equilibrio (apenas documenta, nunca falha)', () => {
  test('ordem de turno: % de vezes que um selvagem aleatorio do mesmo nivel e mais rapido que cada inicial', () => {
    const N = 1500, lines = [];
    for (const lvl of [5, 15, 30]) for (const sid of ev('STARTERS')) {
      let faster = 0, tie = 0;
      for (let i = 0; i < N; i++) {
        const wid = POLITICOS[Math.floor(Math.random() * POLITICOS.length)].id;
        const a = ev(`stats(makeMon(${J(sid)}, ${lvl})).spe`), b = ev(`stats(makeMon(${J(wid)}, ${lvl})).spe`);
        if (b > a) faster++; else if (b === a) tie++;
      }
      lines.push(`L${String(lvl).padEnd(2)} ${sid.padEnd(12)} selvagem mais rapido em ${(100 * faster / N).toFixed(1)}% (empate ${(100 * tie / N).toFixed(1)}%)`);
    }
    console.log('[INFO] Velocidade: selvagem x inicial (mesmo nivel)\n  ' + lines.join('\n  '));
    assert.ok(lines.length > 0);
  });
});
