'use strict';
// Carrega os scripts do navegador (web/js) num contexto vm com stubs minimos.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const JS = path.join(WEB, 'js');

const readJSON = rel => JSON.parse(fs.readFileSync(path.join(WEB, rel), 'utf8'));

function makeCtx() {
  const noop = () => {};
  const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  const el = () => ({ getContext: () => ctx2d, style: {}, width: 0, height: 0, appendChild: noop, addEventListener: noop, classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop });
  const win = { addEventListener: noop, devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720 };
  const sandbox = {
    window: win, console, Math, Date, JSON, Promise, Set, Map, setTimeout, clearTimeout,
    location: { protocol: 'http:' },
    document: { createElement: el, getElementById: () => el(), addEventListener: noop, body: el(), fonts: null },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    fetch: () => Promise.reject(new Error('sem rede nos testes')),
    Image: function () {},
    G: { party: [], gyms: {} },
  };
  sandbox.globalThis = sandbox;
  win.window = win;
  return vm.createContext(sandbox);
}

function plain(r) {
  if (r && typeof r === 'object' && !ArrayBuffer.isView(r) && !(r instanceof Set) && !(r instanceof Map)) return JSON.parse(JSON.stringify(r));
  return r;
}

// Retorna { ctx, ev(expr), balance, gyms, empresas }.
// opts.files: lista de arquivos de web/js (padrao: data, rules, map). opts.balance: aplica balance.json via loadBalance real.
async function load(opts = {}) {
  const files = opts.files || ['data.js', 'rules.js', 'map.js'];
  const ctx = makeCtx();
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), ctx, { filename: f });
  // Arrays/objetos simples vindos do vm sao clonados (evita falso negativo de deepEqual entre realms).
  const ev = expr => plain(vm.runInContext(expr, ctx));
  const balance = readJSON('data/balance.json');
  if (opts.balance !== false) {
    // usa o proprio loadBalance do jogo (fetch stub falha -> cai em window.BALANCE_DATA)
    ctx.window.BALANCE_DATA = balance;
    await vm.runInContext('loadBalance()', ctx);
  }
  return { ctx, ev, balance };
}

module.exports = { ROOT, WEB, JS, load, readJSON, vm, fs, path };
