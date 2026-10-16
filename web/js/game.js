// POKÉPOL — motor: entrada, interface, mundo, batalha, menus e save.

const $ = (s, el = document) => el.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const ui = $('#ui');
const SW = 480, SH = 270;
const SAVE_KEY = 'pokepol-save-v1';
const BUILD = document.querySelector('meta[name=build]') ? document.querySelector('meta[name=build]').content : String(Date.now());

const LEGACY_REGIONS = [
  { test: (x, y) => y < 14, name: 'Brasília' },
  { test: (x, y) => y < 28 && x >= 28, name: 'Rio de Janeiro' },
  { test: (x, y) => y < 28, name: 'Mata Atlântica' },
  { test: (x, y) => y < 42, name: 'BR-116' },
  { test: () => true, name: 'Curitiba' },
];
// O mapa do Brasil exporta regionAt(); o mapa antigo usa as faixas acima.
const regionName = (x, y) => typeof regionAt === 'function' ? regionAt(x, y) : LEGACY_REGIONS.find(r => r.test(x, y)).name;
const startPos = () => typeof START !== 'undefined' ? START : { x: 12, y: 49, dir: 'up' };

let G = null; // estado salvo
const S = { mode: 'title', moving: false, mt: 0, fromX: 0, fromY: 0, frame: 0, tick: 0, region: '' };

// ---------- Utilidades ----------
// R$ 1.500 · R$ 23 mil · R$ 2,3 milhões
function fmtMoney(n) {
  n = Math.round(n || 0);
  const br = (v, d) => v.toLocaleString('pt-BR', { maximumFractionDigits: d });
  if (n >= 1e9) return `R$ ${br(n / 1e9, 1)} ${n >= 2e9 ? 'bilhões' : 'bilhão'}`;
  if (n >= 1e6) return `R$ ${br(n / 1e6, 1)} ${n >= 2e6 ? 'milhões' : 'milhão'}`;
  if (n >= 1e4) return `R$ ${br(n / 1e3, 0)} mil`;
  return `R$ ${br(n, 0)}`;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const imgCache = {};
// Caricatura ilustrada (sprites/<id>.png) quando existe; senão o desenho procedural.
function polImg(p, back = false) {
  return customSprites[p.id + (back ? '_back' : '')] || (!back && customSprites[p.id]) || politicoSprite(p, back);
}
function drawPol(p, back, x, y, size) {
  const img = polImg(p, back);
  ctx.imageSmoothingEnabled = !(img instanceof HTMLCanvasElement);
  ctx.drawImage(img, x, y, size, size);
  ctx.imageSmoothingEnabled = false;
}
// Silhueta para a Polidex; abrindo via file:// o canvas fica "contaminado" e não pode ser lido.
function silURL(p) {
  try { return silhouette(polImg(p)).toDataURL(); }
  catch (e) { return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="5" y="8" font-size="8" text-anchor="middle" fill="#3a3a48">?</text></svg>'); }
}
function spriteURL(p, back = false) {
  const k = p.id + back;
  if (imgCache[k]) return imgCache[k];
  const img = polImg(p, back);
  return (imgCache[k] = img instanceof HTMLImageElement ? img.src : img.toDataURL());
}
function typeChips(types) { return types.map(t => `<span class="chip" style="background:${TYPES[t].color}">${TYPES[t].label}</span>`).join(' '); }

let audio = null;
function sfx(freq = 660, dur = 0.05, type = 'square', vol = 0.04) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(audio.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur); o.stop(audio.currentTime + dur);
  } catch (e) { /* sem áudio */ }
}

// ---------- Monstros (políticos) — fórmulas em rules.js ----------
// Na batalha e no mapa aparece o apelido; na Polidex e na ficha, o nome real.
const monName = m => POL[m.id].name;
const realName = p => p.short || p.real;
const dexName = p => `${realName(p)} <span class="dim">${p.name}</span>`;

// ---------- Save ----------
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; } catch (e) { return false; }
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function newGame(name) {
  G = {
    name, money: 1500, badges: [], party: [], box: [],
    items: { mandado: 5, cafe: 3 }, seen: {}, caught: {}, gyms: {},
    x: startPos().x, y: startPos().y, dir: 'up', lastPF: null, mapVer: 2,
  };
}

// ---------- Entrada ----------
const held = { up: false, down: false, left: false, right: false, b: false };
const handlers = [];
function pushHandler(fn) { handlers.push(fn); return () => { const i = handlers.indexOf(fn); if (i >= 0) handlers.splice(i, 1); }; }
function press(btn) {
  if (btn === 'a') sfx(880, 0.03);
  for (let i = handlers.length - 1; i >= 0; i--) if (handlers[i](btn) !== false) return;
  if (handlers.length) return;
  if (S.mode === 'world') worldPress(btn);
}

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b', Enter: 'start', NumpadEnter: 'start', KeyM: 'start' };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (!$('#boot').classList.contains('hidden')) return;
  if (e.code === 'KeyF') { toggleFullscreen(); return; }
  if (e.code === 'KeyN') { S.minimap = S.minimap === false; return; }
  const k = KEYS[e.code]; if (!k) return;
  e.preventDefault();
  if (k === 'b') held.b = true;
  if (k in held && k !== 'b') { held[k] = true; press(k); }
  else if (!e.repeat) press(k);
});
document.addEventListener('keyup', e => { const k = KEYS[e.code]; if (k in held) held[k] = false; });
window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

(function setupTouch() {
  const dpad = $('#dpad');
  let active = null;
  const setDir = d => {
    if (d === active) return;
    if (active) { held[active] = false; $('#dpad .' + active).classList.remove('on'); }
    active = d;
    if (d) { held[d] = true; $('#dpad .' + d).classList.add('on'); press(d); }
  };
  const dirFrom = e => {
    const r = dpad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return active;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  dpad.addEventListener('pointerdown', e => { dpad.setPointerCapture(e.pointerId); setDir(dirFrom(e)); e.preventDefault(); });
  dpad.addEventListener('pointermove', e => { if (active) setDir(dirFrom(e)); });
  const end = () => setDir(null);
  dpad.addEventListener('pointerup', end); dpad.addEventListener('pointercancel', end);
  for (const [id, b] of [['btnA', 'a'], ['btnB', 'b'], ['btnStart', 'start']]) {
    const e = $('#' + id);
    e.addEventListener('pointerdown', ev => { ev.preventDefault(); e.classList.add('on'); if (b === 'b') held.b = true; press(b); if (navigator.vibrate) navigator.vibrate(8); });
    const up = () => { e.classList.remove('on'); if (b === 'b') held.b = false; };
    e.addEventListener('pointerup', up); e.addEventListener('pointerleave', up); e.addEventListener('pointercancel', up);
  }
  document.addEventListener('contextmenu', e => e.preventDefault());
})();

// ---------- Diálogo e menus ----------
function dlg() {
  let d = $('#dlg');
  if (!d) { d = el('div', 'box'); d.id = 'dlg'; ui.appendChild(d); }
  return d;
}
function closeDlg() { const d = $('#dlg'); if (d) d.remove(); }

let sayIv = null;
function say(text, { wait = true } = {}) {
  return new Promise(res => {
    const d = dlg();
    d.classList.remove('more');
    clearInterval(sayIv);
    let i = 0, done = false, pop = null;
    d.textContent = '';
    const finish = () => {
      clearInterval(sayIv); d.textContent = text; done = true;
      if (wait) d.classList.add('more'); else res();
    };
    sayIv = setInterval(() => { i += 2; d.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 18);
    if (!wait) return;
    const act = () => {
      if (!done) { finish(); return; }
      pop(); d.classList.remove('more'); d.onclick = null; res();
    };
    pop = pushHandler(b => { if (b === 'a' || b === 'b') { act(); return true; } return false; });
    d.onclick = act;
  });
}
async function talk(lines) { for (const l of lines) await say(l); closeDlg(); }

function choose(opts, { cls = 'menu-right', cols = 1, cancel = true, start = 0, onMove } = {}) {
  return new Promise(res => {
    const m = el('div', 'box menu ' + cls);
    if (cols > 1) m.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    let idx = start;
    const items = opts.map((o, i) => {
      const lab = typeof o === 'string' ? o : o.label;
      const e = el('div', 'opt' + (o.disabled ? ' dis' : ''), lab);
      e.onclick = () => { idx = i; render(); done(i); };
      m.appendChild(e);
      return e;
    });
    const render = () => { items.forEach((e, i) => e.classList.toggle('sel', i === idx)); if (onMove) onMove(idx); };
    const done = v => { pop(); m.remove(); res(v); };
    const pop = pushHandler(b => {
      const n = opts.length;
      if (b === 'up') idx = (idx - cols + n) % n;
      else if (b === 'down') idx = (idx + cols) % n;
      else if (b === 'left' && cols > 1) idx = (idx - 1 + n) % n;
      else if (b === 'right' && cols > 1) idx = (idx + 1) % n;
      else if (b === 'a') { if (!(opts[idx] && opts[idx].disabled)) done(idx); return; }
      else if (b === 'b' && cancel) { done(-1); return; }
      render();
    });
    ui.appendChild(m);
    render();
  });
}
const yesNo = () => choose(['SIM', 'NÃO'], { cls: 'menu-yesno' }).then(i => i === 0);

// Lista em tela cheia (Polidex, equipe, loja...). render(item, i) -> HTML da linha.
function listScreen(title, items, render, { right = '', foot = '', start = 0 } = {}) {
  return new Promise(res => {
    const p = el('div', 'panel');
    p.appendChild(el('h2', '', `<span>${title}</span><span>${right}</span>`));
    const list = el('div', 'list');
    p.appendChild(list);
    if (foot) p.appendChild(el('div', 'foot', foot));
    let idx = Math.min(start, items.length - 1);
    const rows = items.map((it, i) => {
      const r = el('div', 'row', render(it, i));
      r.onclick = () => { idx = i; draw(); done(i); };
      list.appendChild(r);
      return r;
    });
    if (!items.length) list.appendChild(el('div', 'row', '<span class="dim">(vazio)</span>'));
    const draw = () => { rows.forEach((r, i) => r.classList.toggle('sel', i === idx)); if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' }); };
    const done = v => { pop(); p.remove(); res(v); };
    const pop = pushHandler(b => {
      if (b === 'up' && items.length) idx = (idx - 1 + items.length) % items.length;
      else if (b === 'down' && items.length) idx = (idx + 1) % items.length;
      else if (b === 'left' && items.length) idx = Math.max(0, idx - 5);
      else if (b === 'right' && items.length) idx = Math.min(items.length - 1, idx + 5);
      else if (b === 'a' && items.length) { done(idx); return; }
      else if (b === 'b') { done(-1); return; }
      draw();
    });
    p.addEventListener('pointerdown', e => { if (e.target === p.firstChild || p.firstChild.contains(e.target)) done(-1); });
    ui.appendChild(p);
    draw();
  });
}

function showDetail(html) {
  return new Promise(res => {
    const d = el('div', 'detail', html);
    const done = () => { pop(); d.remove(); res(); };
    const pop = pushHandler(b => { if (b === 'a' || b === 'b') done(); });
    d.onclick = done;
    ui.appendChild(d);
  });
}

// Ficha da PF: quem é e de que caso é acusado/condenado.
function showFicha(p) {
  return new Promise(res => {
    const f = el('div', 'box ficha', `<div class="ft">FICHA DA PF · Nº ${String(p.dex).padStart(3, '0')}</div>
      <div class="fb"><img src="${spriteURL(p)}"><div><b>${realName(p)}</b> <span class="dim">“${p.name}”</span><br>${typeChips(p.types)}
      <p>${p.fact}</p></div></div><div class="fh">Z para continuar</div>`);
    const done = () => { pop(); f.remove(); res(); };
    const pop = pushHandler(b => { if (b === 'a' || b === 'b') done(); });
    f.onclick = done;
    ui.appendChild(f);
  });
}

function toast(msg) { const t = el('div', 'toast', msg); ui.appendChild(t); setTimeout(() => t.remove(), 1700); }

// ---------- Telas de informação ----------
function hpClass(f) { return f > 0.5 ? '' : f > 0.2 ? 'y' : 'r'; }

function monDetailHTML(p, m) {
  const seen = !m && !G.seen[p.id];
  const st = m ? stats(m) : null;
  const img = seen ? silURL(p) : spriteURL(p);
  return `<h2 style="margin:0;padding:.3em .6em;font-size:1em;color:#fff;background:#1e3a78;display:flex;justify-content:space-between">
    <span>Nº ${String(p.dex).padStart(3, '0')} ${seen ? '?????' : dexName(p)}</span><span>${m ? 'Nv ' + m.lvl : (G.caught[p.id] ? 'PRESO' : '')}</span></h2>
    <div class="body"><div class="pic"><img src="${img}">${seen ? '' : typeChips(p.types)}</div>
    <div class="txt">${seen ? 'Ainda não visto. Procure no mato alto!' :
      `<b>${p.real}</b>${p.poke ? ` <span class="dim">· inspirado em ${p.poke}</span>` : ''}<br>${p.fact}` +
      (m ? `<br><br><b>Cargo:</b> ${rankName(m) || '—'} ${statusChip(m)}<br><b>Vida</b> ${m.hp}/${st.hp} · <b>Atq</b> ${st.atk} · <b>Def</b> ${st.def} · <b>Atq Esp</b> ${st.spa} · <b>Def Esp</b> ${st.spd} · <b>Vel</b> ${st.spe}<br><b>Habilidade:</b> ${p.ability && ABILITIES[p.ability] ? ABILITIES[p.ability].name + ' — ' + ABILITIES[p.ability].desc : '—'}<br><b>Golpes:</b> ${m.moves.map(k => `${MOVES[k].name} (${m.pp[k]}/${movePP(MOVES[k])})`).join(', ')}` : (p.career ? `<br><br><b>Carreira:</b> ${p.career.map(c => c.rank).join(' → ')}` : ''))}
    </div></div><div class="foot" style="padding:.2em .6em;font-size:.65em;color:#555">Paródia. Investigados não condenados são presumidos inocentes.</div>`;
}

async function openPolidex() {
  const nSeen = Object.keys(G.seen).length, nCaught = Object.keys(G.caught).length;
  let start = 0;
  for (;;) {
    const i = await listScreen('POLIDEX', POLITICOS, p => {
      const s = G.seen[p.id];
      const img = s ? spriteURL(p) : silURL(p);
      return `<img src="${img}"><span class="dim">${String(p.dex).padStart(3, '0')}</span><span class="grow">${s ? dexName(p) : '?????'}</span>${G.caught[p.id] ? '🔒' : ''}`;
    }, { right: `Vistos ${nSeen} · Presos ${nCaught}`, start });
    if (i < 0) return;
    start = i;
    await showDetail(monDetailHTML(POLITICOS[i]));
  }
}

function partyRow(m) {
  const st = stats(m), f = m.hp / st.hp;
  return `<img src="${spriteURL(POL[m.id])}"><span class="grow">${monName(m)} <span class="dim">Nv${m.lvl} ${rankName(m)}</span> ${statusChip(m)}</span>
    <div class="hpbar ${hpClass(f)}" style="max-width:35%"><i style="width:${f * 100}%"></i></div><span class="dim">${m.hp}/${st.hp}</span>`;
}

async function openParty() {
  for (;;) {
    const i = await listScreen('EQUIPE', G.party, partyRow, { foot: 'A: opções · B: voltar' });
    if (i < 0) return;
    const m = G.party[i];
    const c = await choose(['RESUMO', 'TORNAR LÍDER', 'VOLTAR'], { cls: 'menu-right' });
    if (c === 0) await showDetail(monDetailHTML(POL[m.id], m));
    if (c === 1 && i > 0) { G.party.splice(i, 1); G.party.unshift(m); toast(`${monName(m)} agora lidera a equipe`); }
  }
}

async function pickPartyMember(title, filter = () => true) {
  const i = await listScreen(title, G.party, (m) => partyRow(m) + (filter(m) ? '' : ' <span class="dim">✕</span>'));
  if (i < 0) return null;
  if (!filter(G.party[i])) { toast('Não dá pra usar nesse.'); return null; }
  return G.party[i];
}

function useHealItem(key, m) {
  const it = ITEMS[key], st = stats(m);
  if (it.cure) { if (!m.status || m.hp <= 0) return false; m.status = null; m.sleep = 0; }
  else if (it.revive) { if (m.hp > 0) return false; m.hp = Math.floor(st.hp / 2); }
  else { if (m.hp <= 0 || m.hp >= st.hp) return false; m.hp = Math.min(st.hp, m.hp + it.heal); }
  G.items[key]--; if (!G.items[key]) delete G.items[key];
  return true;
}

async function openBag(inBattle = false) {
  for (;;) {
    const keys = Object.keys(G.items).filter(k => G.items[k] > 0);
    const i = await listScreen('MOCHILA', keys, k => `<span class="grow">${ITEMS[k].name}</span><span>x${G.items[k]}</span>`,
      { right: 'Cofre: ' + fmtMoney(G.money), foot: 'Mandados e tornozeleiras só funcionam em batalha contra políticos soltos.' });
    if (i < 0) return null;
    const k = keys[i], it = ITEMS[k];
    if (it.ball) { if (inBattle) return { ball: k }; toast('Use em batalha!'); continue; }
    const m = await pickPartyMember('Usar em quem?', mm => it.cure ? mm.hp > 0 && !!mm.status : it.revive ? mm.hp <= 0 : mm.hp > 0 && mm.hp < stats(mm).hp);
    if (!m) continue;
    const before = m.hp;
    if (useHealItem(k, m)) {
      if (inBattle) return { used: k, mon: m, healed: m.hp - before };
      toast(it.cure ? `${monName(m)} está livre!` : `${monName(m)} recuperou ${m.hp - before} de vida`);
    }
  }
}

async function openAgentCard() {
  await showDetail(`<h2 style="margin:0;padding:.3em .6em;font-size:1em;color:#fff;background:#1e3a78">CARTEIRA FUNCIONAL — POLÍCIA FEDERAL</h2>
    <div class="body"><div class="pic"><img src="${personSprite(AGENT_LOOK, 'down', 0).toDataURL()}"></div>
    <div class="txt"><b>Agente:</b> ${G.name}<br><b>Cofre público:</b> ${fmtMoney(G.money)}<br><b>Total já recuperado:</b> ${fmtMoney(G.recovered || 0)}<br><b>Meta:</b> ${badgeCount()}/${TOTAL_GYMS()} insígnias · ${Object.keys(G.caught).length}/${POLITICOS.length} presos<br><b>Polidex:</b> ${Object.keys(G.seen).length} vistos, ${Object.keys(G.caught).length} presos<br><br>
    <b>Insígnias:</b> ${badgeCount()}/${TOTAL_GYMS()}<br>${(G.badges || []).map(x => '🏅 ' + x).join('<br>') || 'Nenhuma ainda.'}</div></div>`);
}

async function startMenu() {
  for (;;) {
    const i = await choose(['POLIDEX', 'EQUIPE', 'MOCHILA', 'INSÍGNIAS', G.name.toUpperCase(), 'SALVAR', 'FECHAR']);
    if (i === 0) await openPolidex();
    else if (i === 1) await openParty();
    else if (i === 2) await openBag();
    else if (i === 3) await openBadges();
    else if (i === 4) await openAgentCard();
    else if (i === 5) { await say(saveGame() ? 'Jogo salvo!' : 'Não foi possível salvar neste navegador.'); closeDlg(); }
    else return;
  }
}

// ---------- Superintendência (centro, loja, carceragem) ----------
async function healAll() {
  for (const m of G.party) restoreMon(m);
}

async function pfHQ() {
  G.lastPF = { x: G.x, y: G.y };
  await say('Superintendência da Polícia Federal. Em que posso ajudar, agente?', { wait: false });
  for (;;) {
    const i = await choose(['CURAR EQUIPE', 'ALMOXARIFADO', 'CARCERAGEM', 'SAIR']);
    if (i === 0) {
      await say('Vou deixar sua equipe novinha em folha. Um momento...');
      for (let k = 0; k < 3; k++) { sfx(523 + k * 130, 0.12, 'triangle', 0.06); await sleep(220); }
      await healAll(); saveGame();
      await say('Pronto! Equipe recuperada. Boa caçada!');
      await say('E agora, agente?', { wait: false });
    } else if (i === 1) await shop();
    else if (i === 2) await carceragem();
    else break;
  }
  closeDlg();
}

async function shop() {
  for (;;) {
    const i = await listScreen('ALMOXARIFADO', SHOP, k => `<span class="grow">${ITEMS[k].name}<br><span class="dim">${ITEMS[k].desc}</span></span><span>${fmtMoney(ITEMS[k].price)}</span>`,
      { right: 'Cofre: ' + fmtMoney(G.money) });
    if (i < 0) return;
    const k = SHOP[i];
    const q = await choose(['x1', 'x5', 'x10', 'VOLTAR'], { cls: 'menu-right' });
    if (q < 0 || q === 3) continue;
    const n = [1, 5, 10][q], cost = n * ITEMS[k].price;
    if (cost > G.money) { toast('Verba insuficiente!'); continue; }
    G.money -= cost; G.items[k] = (G.items[k] || 0) + n;
    toast(`Comprou ${n}x ${ITEMS[k].name}`);
  }
}

async function carceragem() {
  for (;;) {
    const i = await choose(['RETIRAR PRESO', 'DEPOSITAR ALIADO', 'VOLTAR']);
    if (i === 0) {
      const j = await listScreen('CARCERAGEM', G.box, partyRow);
      if (j < 0) continue;
      const m = G.box[j];
      if (G.party.length < 6) { G.box.splice(j, 1); G.party.push(m); toast(`${monName(m)} entrou na equipe`); }
      else {
        const out = await pickPartyMember('Trocar por quem?');
        if (!out) continue;
        G.party[G.party.indexOf(out)] = m; G.box[j] = out; toast(`${monName(m)} entrou, ${monName(out)} foi pra cela`);
      }
    } else if (i === 1) {
      if (G.party.length <= 1) { toast('Você precisa de pelo menos um aliado.'); continue; }
      const m = await pickPartyMember('Depositar quem?');
      if (!m) continue;
      G.party.splice(G.party.indexOf(m), 1); G.box.push(m); toast(`${monName(m)} foi pra carceragem`);
    } else return;
  }
}

// ---------- Mundo ----------
function worldPress(btn) {
  if (S.moving) return;
  if (btn === 'start') { runScript(startMenu); return; }
  if (btn === 'a') {
    const [dx, dy] = DIRS[G.dir];
    const tx = G.x + dx, ty = G.y + dy;
    const npc = World.npcs.find(n => n.x === tx && n.y === ty && !n.hidden);
    if (npc) { npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[G.dir]; runScript(() => talk(npc.lines)); return; }
    const sign = World.signs[`${tx},${ty}`];
    if (sign) { runScript(() => talk([sign])); return; }
    const b = buildingAtDoor(tx, ty);
    if (b) { runScript(() => enterBuilding(b)); return; }
    const lm = World.buildings.find(o => o.kind === 'landmark' && tx >= o.x && tx < o.x + o.w && ty >= o.y && ty < o.y + o.h);
    if (lm) runScript(() => talk([`Cartão-postal: ${lm.label}.`]));
  }
}

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let scriptRunning = false;
async function runScript(fn) {
  if (scriptRunning) return;
  scriptRunning = true;
  try { await fn(); } catch (e) { console.error(e); }
  scriptRunning = false;
}

function updateWorld(dt) {
  if (S.moving) {
    S.mt += dt / (held.b ? 0.12 : 0.21);
    if (S.mt >= 1) {
      S.moving = false; S.mt = 0;
      onStep();
    }
    return;
  }
  if (handlers.length || scriptRunning) return;
  const d = ['up', 'down', 'left', 'right'].find(k => held[k]);
  if (!d) { S.turnAt = 0; return; }
  // Toque rápido só vira o personagem; segurar anda.
  const now = performance.now();
  if (d !== G.dir) { G.dir = d; S.turnAt = now; return; }
  if (S.turnAt && now - S.turnAt < 90) return;
  const [dx, dy] = DIRS[d];
  const nx = G.x + dx, ny = G.y + dy;
  const b = buildingAtDoor(nx, ny);
  if (b && d === 'up') { runScript(() => enterBuilding(b)); return; }
  if (isSolid(nx, ny)) { if (S.tick % 16 === 0) sfx(110, 0.04, 'square', 0.03); return; }
  S.fromX = G.x; S.fromY = G.y; G.x = nx; G.y = ny;
  S.moving = true; S.mt = 0; S.frame++;
  updateWorld(dt);
}

function showRegion() {
  if (G) { markVisited(); if (!S.gatesOk) { refreshGates(); S.gatesOk = true; } }
  const r = regionName(G.x, G.y);
  if (r !== S.region) {
    // uma placa por vez: a nova substitui a anterior
    S.region = r;
    document.querySelectorAll('#ui .location').forEach(e => e.remove());
    const l = el('div', 'box location', r); ui.appendChild(l); setTimeout(() => l.remove(), 2400);
  }
}

function onStep() {
  showRegion();
  const zone = tileAt(G.x, G.y) === 'tall' && zoneAt(G.x, G.y);
  if (zone && Math.random() < 0.12) {
    runScript(() => wildEncounter(zone));
  }
}

function playerPixel() {
  const t = S.moving ? S.mt : 1;
  const x = (S.moving ? S.fromX + (G.x - S.fromX) * t : G.x) * TILE;
  const y = (S.moving ? S.fromY + (G.y - S.fromY) * t : G.y) * TILE;
  return [x, y];
}

// Zoom do mapa: ~20 tiles na largura, sempre com escala inteira de pixel (nítido).
// Tamanho do tile na tela: fixo (4x a arte de 16 px no PC, 3x em tela de toque), multiplicado pela densidade da tela.
const TILE_CSS = matchMedia('(pointer: coarse)').matches ? 48 : 64;
function drawWorld() {
  const tilePx = Math.max(16, Math.round(TILE_CSS * VIEW.dpr / 16) * 16);
  const Z = tilePx / TILE, VW = cv.width / Z, VH = cv.height / Z, snap = v => Math.round(v * Z) / Z;
  ctx.save(); ctx.setTransform(Z, 0, 0, Z, 0, 0);
  const [px, py] = playerPixel();
  // perto da borda, a câmera para; se a janela for maior que o mapa, centraliza
  const clampCam = (p, view, size) => size <= view ? (size - view) / 2 : Math.max(0, Math.min(size - view, p));
  const camX = snap(clampCam(px - VW / 2 + TILE / 2, VW, MAP_W * TILE));
  const camY = snap(clampCam(py - VH / 2 + TILE / 2, VH, MAP_H * TILE));
  const f = Math.floor(performance.now() / 500) % 2;
  const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
  for (let y = y0 - 1; y <= y0 + Math.ceil(VH / TILE); y++) for (let x = x0; x <= x0 + Math.ceil(VW / TILE); x++) {
    let k = x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? ((x * 3 + y * 5) % 7 ? 'grass' : 'tree') : tileAt(x, y);
    if (k === 'bld') k = y < 14 ? 'lawn' : 'grass';
    const frames = Tiles[k]; if (!frames) continue;
    // árvores grandes 2x2: o quarto do pinheiro depende da posição
    const fi = k === 'tree' && frames.length === 4 ? (x & 1) + (y & 1) * 2 : k === 'grass' && frames.length > 2 ? ((x * 7 + y * 13) % frames.length) : f % frames.length;
    // bordas automáticas (caminho, água, areia...) quando a arte tem autotile
    const at = typeof AUTOTILE_KINDS !== 'undefined' && AUTOTILE_KINDS.has(k) ? autotileFor(k, neighborMask(x, y, k), f) : null;
    ctx.drawImage(biomeTile(at || frames[fi], k, typeof biomeAt === 'function' ? biomeAt(x, y) : null), x * TILE - camX, y * TILE - camY, TILE, TILE);
  }
  for (const b of World.buildings) {
    if (b.x * TILE - camX > VW || (b.x + b.w) * TILE - camX < 0 || b.y * TILE - camY > VH || (b.y + b.h) * TILE - camY < 0) continue;
    const bi = buildingImg(b);
    if (bi) ctx.drawImage(bi, b.x * TILE - camX, b.y * TILE - camY, b.w * TILE, b.h * TILE);
  }
  const actors = World.npcs.filter(n => !n.hidden).map(n => ({ y: n.y * TILE, draw: () => drawActor(personSprite(n.look, n.dir, 0), n.x * TILE - camX, n.y * TILE - camY) }));
  actors.push({ y: py, draw: () => {
    // Ciclo do Fire Red: pé esquerdo / parado / pé direito / parado, com leve balanço.
    const stepping = S.moving && S.mt < 0.6;
    const fr = stepping ? 1 + (S.frame % 2) : 0;
    const bob = stepping ? -TILE / 32 * 2 : 0;
    drawActor(personSprite(AGENT_LOOK, G.dir, fr), px - camX, py - camY + bob);
    if (tileAt(G.x, G.y) === 'tall' && !S.moving) { const img = Tiles.tall[f], k = img.width / TILE, h = TILE * 0.45, o = TILE - h; ctx.drawImage(img, 0, o * k, img.width, h * k, px - camX, py - camY + o, TILE, h); }
  } });
  actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
  ctx.restore();
  // minimapa no canto superior direito da janela
  if (S.minimap !== false && MAP_W > 60) { const k = VIEW.dpr * 2.4; ctx.setTransform(k, 0, 0, k, cv.width - SW * k, 0); drawMinimap(); ctx.setTransform(VIEW.k, 0, 0, VIEW.k, VIEW.ox, VIEW.oy); }
}

// Personagens podem ser mais altos que um tile (32x48 no estilo 4ª/5ª geração): pés na base do tile.
function drawActor(img, x, y) {
  const h = TILE * img.height / img.width;
  ctx.drawImage(img, x, y + TILE - h - (h > TILE ? TILE / 8 : TILE / 4), TILE, h);
}

// Máscara dos 8 vizinhos para as bordas automáticas: N=1 NE=2 L=4 SE=8 S=16 SO=32 O=64 NO=128.
const NB = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
function neighborMask(x, y, k) {
  let m = 0;
  for (let i = 0; i < 8; i++) {
    const nx = x + NB[i][0], ny = y + NB[i][1];
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H || tileAt(nx, ny) === k) m |= 1 << i;
  }
  return m;
}

// Prédios com PNG próprio (palácios e cartões-postais das capitais).
const spriteImgs = {};
function buildingImg(b) {
  if (!b.sprite) return b.img;
  let im = spriteImgs[b.sprite];
  if (!im) { im = spriteImgs[b.sprite] = new Image(); im.src = b.sprite + '?v=' + BUILD; }
  return im.complete && im.naturalWidth ? im : b.img;
}

// Cada bioma muda a cor da vegetação.
const BIOME_FILTER = {
  pampa: 'hue-rotate(-6deg) saturate(0.9) brightness(1.08)',
  cerrado: 'hue-rotate(-12deg) saturate(0.9) brightness(1.03)',
  caatinga: 'hue-rotate(-26deg) saturate(0.7) brightness(1.08)',
  amazonia: 'hue-rotate(8deg) saturate(1.35) brightness(0.8)',
  pantanal: 'hue-rotate(14deg) saturate(1.15) brightness(0.94)',
};
const BIOME_TILES = new Set(['grass', 'tall', 'tree', 'flower', 'lawn']);
const biomeCache = new WeakMap();
function biomeTile(src, kind, biome) {
  const f = biome && BIOME_TILES.has(kind) && BIOME_FILTER[biome];
  if (!f) return src;
  let m = biomeCache.get(src);
  if (!m) biomeCache.set(src, m = {});
  if (!m[biome]) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.filter = f; x.drawImage(src, 0, 0);
    m[biome] = c;
  }
  return m[biome];
}

// Minimapa do Brasil no canto (N liga/desliga).
let miniCanvas = null;
const MINI_COLORS = { runway: '#8a8e96', water: '#3a78c8', tree: '#2f6a2a', tall: '#4f9a3a', sand: '#e8d898', path: '#d8c088', bld: '#c84848', lawn: '#8ad070', pool: '#5aa0e0' };
function drawMinimap() {
  if (!miniCanvas) {
    // contorno do Brasil: terra em verde, mar em azul, vizinhos escuros; capitais como pontos amarelos
    miniCanvas = document.createElement('canvas'); miniCanvas.width = MAP_W; miniCanvas.height = MAP_H;
    const x = miniCanvas.getContext('2d');
    const land = World.landMask;
    for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) {
      const t = tileAt(i, j);
      x.fillStyle = t === 'water' ? '#3a78c8' : land && !(land.length === MAP_W * MAP_H ? land[j * MAP_W + i] : land[j] && land[j][i]) ? '#1e3a24' : (MINI_COLORS[t] && t !== 'tree' ? MINI_COLORS[t] : '#5fae48');
      x.fillRect(i, j, 1, 1);
    }
    if (World.cities) for (const c of World.cities) {
      const r = Math.max(3, Math.round(MAP_W / 90));
      x.fillStyle = '#1a1a1a'; x.fillRect(c.x + c.w / 2 - r - 1, c.y + c.h / 2 - r - 1, 2 * r + 2, 2 * r + 2);
      x.fillStyle = c.id === 'brasilia' ? '#e83030' : '#f4c430'; x.fillRect(c.x + c.w / 2 - r, c.y + c.h / 2 - r, 2 * r, 2 * r);
    }
  }
  const w = 104, h = Math.round(w * MAP_H / MAP_W), x0 = SW - w - 6, y0 = 6;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#0e1c48'; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(miniCanvas, x0, y0, w, h); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  if (Math.floor(performance.now() / 300) % 2) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + G.x / MAP_W * w - 3, y0 + G.y / MAP_H * h - 3, 6, 6);
    ctx.fillStyle = '#1e3a78'; ctx.fillRect(x0 + G.x / MAP_W * w - 2, y0 + G.y / MAP_H * h - 2, 4, 4);
  }
}

const PALACIO_LINES = [
  'O segurança avisa: "O governador está em reunião... desde o começo do mandato."',
  'Na recepção: "Para audiência, traga um ofício. Para emenda, traga um deputado."',
  'Um assessor passa correndo com uma pasta escrito "CONFIDENCIAL".',
  'O porteiro sussurra: "Se for operação da PF, a entrada dos fundos tá aberta."',
];
async function enterBuilding(b) {
  if (b.id === 'pf' || b.kind === 'pf') return pfHQ();
  if (b.kind === 'jato') return flyMenu(b);
  if (b.kind === 'empresa') return empresaSequence(b);
  if (b.kind === 'palacio' || b.id === 'guanabara') return gymSequence(b);
  if (b.id === 'congresso') return congressoSequence();
  if (b.id.startsWith('casa')) return talk([pick(['A porta está trancada. Ninguém atende.', 'Lá de dentro alguém grita: "Não tem ninguém em casa! Muito menos dinheiro!"'])]);
  const key = { planalto: 'bolsonaro' }[b.id];
  if (!key) return talk([`${b.label}.`, pick(PALACIO_LINES)]);
  const boss = BOSSES[key];
  if (G.badges.includes(boss.badge)) return talk([`${b.label}: a ${boss.title} já foi concluída aqui.`]);
  await say(`${b.label}. Iniciar a ${boss.title}?`, { wait: false });
  if (!(await yesNo())) { closeDlg(); return; }
  closeDlg();
  await bossBattle(key);
}

// ---------- Batalha ----------
let B = null;
const freshStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 });
const STAT_NAMES = { atk: 'O Ataque', def: 'A Defesa', spa: 'O Ataque Especial', spd: 'A Defesa Especial', spe: 'A Velocidade', acc: 'A Precisão' };
const sideMon = side => side === 'p' ? G.party[B.pi] : B.team[B.ei];
const otherSide = side => side === 'p' ? 'e' : 'p';

async function wildEncounter(zone) {
  let pool, lo, hi;
  if (zone && typeof zone === 'object') {
    pool = zone.pool.filter(([id]) => POL[id]).map(([id, w]) => Object.assign({}, POL[id], { w: w * tierWeight(POL[id], areaProgress(zone)) }));
    [lo, hi] = zone.levels;
    if ((G.badges || []).includes(BOSSES.bolsonaro.badge) && /bras/i.test(zone.name || '')) pool.push(Object.assign({}, POL.golpenaro, { w: 1 }));
  } else {
    pool = POLITICOS.filter(p => p.zone === zone && p.w > 0);
    if (zone === 3 && G.badges.length >= 3) pool = pool.concat([Object.assign({}, POL.golpenaro, { w: 1 })]);
    [lo, hi] = ZONE_LEVELS[zone];
  }
  if (!pool.length) return;
  const tot = pool.reduce((a, p) => a + p.w, 0);
  let r = Math.random() * tot, p = pool[0];
  for (const q of pool) { r -= q.w; if (r <= 0) { p = q; break; } }
  const mon = makeMon(p.id, rand(lo, hi));
  await transition();
  const res = await battle({ team: [mon], wild: true });
  if (res === 'lose') await whiteout();
  if (res === 'caught') await checkGameComplete();
}

async function bossBattle(key) {
  const boss = BOSSES[key];
  const team = boss.team.map(([id, l]) => makeMon(id, l));
  await transition();
  const res = await battle({ team, boss: key });
  if (res === 'win') {
    G.badges.push(boss.badge);
    G.money += boss.prize * 500;
    await say(`${boss.name}: "${boss.lose}"`);
    await say(`${boss.title} concluída! Você recebeu o ${boss.badge} e ${fmtMoney(boss.prize * 500)} em bens apreendidos.`);
    refreshGates();
    saveGame();
    closeDlg();
    if (key === 'bolsonaro') await ending();
    await checkGameComplete();
  } else if (res === 'lose') await whiteout();
}

async function whiteout() {
  S.mode = 'world';
  await say('Todos os seus aliados foram derrotados...');
  G.money = Math.floor(G.money / 2);
  await say('Você foi afastado e levado de volta à Superintendência. Metade da verba foi bloqueada.');
  healAll(); const back = G.lastPF || startPos(); G.x = back.x; G.y = back.y; G.dir = 'up'; S.moving = false;
  saveGame(); closeDlg();
}

async function transition() {
  S.mode = 'trans';
  for (let k = 0; k < 6; k++) { S.flash = k % 2; await sleep(70); }
  S.flash = 0;
}

function battleName(m, side) {
  if (side === 'p') return monName(m);
  return B.wild ? `${monName(m)} selvagem` : `${monName(m)} inimigo`;
}

function statusChip(m) {
  const s = m.status && STATUS_INFO[m.status];
  return s ? `<span class="chip" style="background:${s.color}">${s.tag}</span>` : '';
}
function hudHTML(m, side) {
  const st = stats(m), f = Math.max(0, m.hp / st.hp);
  const xpNow = m.xp - m.lvl ** 3, xpNeed = (m.lvl + 1) ** 3 - m.lvl ** 3;
  return `<div class="top"><span>${monName(m)}${G.caught[m.id] && side === 'e' ? ' 🔒' : ''}</span><span>Nv${m.lvl}</span></div>
    <div class="rank">${rankName(m)} ${statusChip(m)}</div>
    <div class="hpline"><span>HP</span><div class="hpbar ${hpClass(f)}"><i style="width:${f * 100}%"></i></div></div>
    ${side === 'p' ? `<div class="num">${Math.max(0, m.hp)}/${st.hp}</div><div class="xp"><i style="width:${Math.min(100, xpNow / xpNeed * 100)}%"></i></div>` : ''}`;
}
function updateHud() {
  if (!B) return;
  const e = B.team[B.ei], p = G.party[B.pi];
  let he = $('#hudE'), hp = $('#hudP');
  if (!he) { he = el('div', 'box hud'); he.id = 'hudE'; ui.appendChild(he); }
  if (!hp) { hp = el('div', 'box hud'); hp.id = 'hudP'; ui.appendChild(hp); }
  he.style.display = B.showE ? '' : 'none';
  hp.style.display = B.showP ? '' : 'none';
  // reconstrói só quando muda o político, o nível ou o estado; senão só anima a barra
  const set = (box, m, side) => {
    const st = stats(m), f = Math.max(0, m.hp / st.hp), key = m.id + m.lvl + (m.status || '');
    if (box.dataset.key !== key) { box.innerHTML = hudHTML(m, side); box.dataset.key = key; }
    box.querySelector('.hpbar').className = 'hpbar ' + hpClass(f);
    box.querySelector('.hpbar i').style.width = f * 100 + '%';
    if (side === 'p') {
      box.querySelector('.num').textContent = `${Math.max(0, m.hp)}/${st.hp}`;
      const xpNow = m.xp - m.lvl ** 3, xpNeed = (m.lvl + 1) ** 3 - m.lvl ** 3;
      box.querySelector('.xp i').style.width = Math.min(100, xpNow / xpNeed * 100) + '%';
    }
  };
  set(he, e, 'e'); set(hp, p, 'p');
}

function anim(ms, fn) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });
}

function drawBattle() {
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, '#f8f8e0'); g.addColorStop(0.55, '#d8f0c0'); g.addColorStop(1, '#a8d890');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = '#c8e0a0';
  ctx.beginPath(); ctx.ellipse(368, 118, 92, 20, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(130, 196, 120, 24, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#98c078';
  ctx.beginPath(); ctx.ellipse(368, 121, 80, 13, 0, 0, Math.PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(130, 199, 106, 16, 0, 0, Math.PI); ctx.fill();
  if (!B) return;
  const e = B.team[B.ei], p = G.party[B.pi];
  const A = B.anim;
  if (A.e.vis) {
    ctx.globalAlpha = A.e.alpha;
    drawPol(POL[e.id], false, 312 + A.e.dx, 22 + A.e.dy, 112);
    ctx.globalAlpha = 1;
  }
  if (A.p.vis) {
    ctx.globalAlpha = A.p.alpha;
    drawPol(POL[p.id], true, 34 + A.p.dx, 70 + A.p.dy, 192);
    ctx.globalAlpha = 1;
  }
  if (A.ball) ctx.drawImage(MANDADO(), A.ball.x, A.ball.y, 24, 24);
  if (A.flash) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 0, SW, SH); }
}

async function hitAnim(side) {
  const a = B.anim[side];
  sfx(180, 0.12, 'sawtooth', 0.05);
  for (let k = 0; k < 4; k++) { a.alpha = k % 2 ? 1 : 0.2; await sleep(70); }
  a.alpha = 1;
  await anim(160, t => { a.dx = Math.sin(t * Math.PI * 4) * 8; });
  a.dx = 0;
}

async function battle({ team, wild = false, boss = null }) {
  S.mode = 'battle';
  B = { team, wild, boss, bo: typeof boss === 'string' ? BOSSES[boss] : boss, ei: 0, pi: G.party.findIndex(m => m.hp > 0), st: { p: freshStages(), e: freshStages() }, vol: { p: {}, e: {} },
    runs: 0, anim: { e: { vis: true, alpha: 1, dx: 240, dy: 0 }, p: { vis: false, alpha: 1, dx: 0, dy: 0 } },
    showE: false, showP: false, used: new Set(), fichas: new Set([team[0].id]) };
  G.seen[team[0].id] = true;
  await anim(450, t => { B.anim.e.dx = 240 * (1 - t); });
  B.showE = true; updateHud();
  if (wild) {
    await say(`Um ${monName(team[0])} selvagem apareceu!`);
    await showFicha(POL[team[0].id]);
  } else {
    const bo = B.bo;
    await say(typeof boss === 'string' ? `${bo.title}! ${bo.name} resiste à prisão!` : `${bo.name}, ${bo.title}, quer lutar!`);
    for (const l of bo.intro || []) await say(`${bo.name}: "${l}"`);
    await say(`${bo.name} mandou ${monName(team[0])}!`);
    await showFicha(POL[team[0].id]);
  }
  await sendOut();
  B.used.add(B.pi);
  await onEnter('e'); await onEnter('p');

  for (;;) {
    const me = G.party[B.pi], foe = B.team[B.ei];
    const act = await chooseAction();
    let myMove = null;
    if (act.type === 'run') {
      if (!wild) { await say('Não dá pra abandonar uma operação no meio!'); continue; }
      B.runs++;
      const a = stats(me).spe, b = Math.max(1, stats(foe).spe);
      if (hasAb(me, 'fujao') || a >= b || Math.random() * 256 < a * 128 / b + 30 * B.runs) {
        sfx(440, 0.1); await say('Você saiu de fininho...'); return end('run');
      }
      await say('Não conseguiu fugir!');
    } else if (act.type === 'switch') {
      await say(`${monName(me)}, volta!`);
      B.pi = act.index; B.st.p = freshStages(); B.vol.p = {}; B.used.add(B.pi);
      await sendOut();
      await onEnter('p');
    } else if (act.type === 'item') {
      if (act.ball) {
        const r = await throwBall(act.ball);
        if (r === 'caught') return end('caught');
        if (r === 'blocked') continue;
      } else {
        await say(`${G.name} usou ${ITEMS[act.used].name} em ${monName(act.mon)}!`);
        updateHud();
      }
    } else myMove = act.move;

    const foeMove = enemyChooseMove(B.team[B.ei], G.party[B.pi]);
    const order = [];
    if (myMove) {
      const pr = k => (MOVES[k].prio || 0);
      const sp = side => stats(sideMon(side)).spe * stageMul(B.st[side].spe) * (sideMon(side).status === 'preso' ? 0.25 : 1);
      const meFirst = pr(myMove) !== pr(foeMove) ? pr(myMove) > pr(foeMove) : sp('p') > sp('e') || (sp('p') === sp('e') && Math.random() < 0.5);
      if (meFirst) order.push(['p', myMove], ['e', foeMove]); else order.push(['e', foeMove], ['p', myMove]);
    } else order.push(['e', foeMove]);

    for (const [side, mv] of order) {
      if (sideMon(side).hp <= 0 || sideMon(otherSide(side)).hp <= 0) continue;
      await doMove(side, mv);
      if (sideMon('p').hp <= 0 || sideMon('e').hp <= 0) break;
    }
    B.vol.p.flinch = B.vol.e.flinch = false;

    const fled = await endOfTurn();
    if (fled) return end('fled');
    const r = await handleFaints();
    if (r) return end(r);
  }
}

// Efeitos de fim de turno: investigação, verba de gabinete, fuga rápida, fuga do selvagem.
async function endOfTurn() {
  for (const side of ['p', 'e']) {
    const m = sideMon(side);
    if (!m || m.hp <= 0) continue;
    const max = stats(m).hp, nm = battleName(m, side);
    if (m.status === 'investigado') {
      m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(max / 8))); updateHud();
      await say(`${nm} sofre com a investigação!`);
    }
    if (m.hp > 0 && hasAb(m, 'verba') && m.hp < max) {
      m.hp = Math.min(max, m.hp + Math.max(1, Math.floor(max / 16))); updateHud();
      await say(`${nm} recuperou vida com a Verba de Gabinete.`);
    }
    if (m.hp > 0 && hasAb(m, 'acelera') && B.st[side].spe < 6) {
      B.st[side].spe++;
      await say(`Fuga Rápida! A Velocidade de ${nm} subiu!`);
    }
  }
  const foe = sideMon('e');
  if (B.wild && foe.hp > 0 && hasAb(foe, 'fujao') && Math.random() < 0.15) {
    await say(`${battleName(foe, 'e')} usou o passaporte e fugiu para o exterior!`);
    return true;
  }
  return false;
}

async function handleFaints() {
  const foe = B.team[B.ei], me = G.party[B.pi];
  if (foe.hp <= 0) {
    await faintAnim('e');
    await say(`${battleName(foe, 'e')} foi derrotado!`);
    if (hasAb(foe, 'delator') && me.hp > 0) { B.st.p.def = Math.max(-6, B.st.p.def - 1); await say(`Delação! A Defesa de ${monName(me)} caiu!`); }
    await giveXP(foe);
    const next = B.team.findIndex(m => m.hp > 0);
    if (next < 0) {
      if (B.wild) { const m = foe.lvl * 40 + rand(0, 200); G.money += m; G.recovered = (G.recovered || 0) + m; await say(`Na fuga, o político deixou cair ${fmtMoney(m)}. Apreendido!`); }
      return 'win';
    }
    B.ei = next; B.st.e = freshStages(); B.vol.e = {}; G.seen[B.team[next].id] = true;
    await say(`${B.bo.name} mandou ${monName(B.team[next])}!`);
    if (!B.fichas.has(B.team[next].id)) { B.fichas.add(B.team[next].id); await showFicha(POL[B.team[next].id]); }
    B.anim.e = { vis: true, alpha: 1, dx: 240, dy: 0 };
    await anim(350, t => { B.anim.e.dx = 240 * (1 - t); });
    B.showE = true; updateHud();
    await onEnter('e');
  }
  if (G.party[B.pi].hp <= 0) {
    await faintAnim('p');
    await say(`${monName(G.party[B.pi])} foi nocauteado!`);
    if (!G.party.some(m => m.hp > 0)) return 'lose';
    const idx = await choosePartyInBattle(false);
    B.pi = idx; B.st.p = freshStages(); B.vol.p = {}; B.used.add(B.pi);
    await sendOut();
    await onEnter('p');
  }
  return null;
}

async function onEnter(side) {
  const m = sideMon(side), o = otherSide(side);
  if (hasAb(m, 'carteirada') && sideMon(o).hp > 0 && B.st[o].atk > -6) {
    B.st[o].atk--;
    await say(`Carteirada de ${battleName(m, side)}! O Ataque de ${battleName(sideMon(o), o)} caiu!`);
  }
}

function end(result) {
  closeDlg();
  for (const id of ['hudE', 'hudP']) { const e = $('#' + id); if (e) e.remove(); }
  for (const m of G.party) if (m.status === 'vista') m.status = null;
  B = null;
  S.mode = 'world';
  return result;
}

async function sendOut() {
  const p = G.party[B.pi];
  B.anim.p = { vis: true, alpha: 1, dx: -240, dy: 0 };
  await say(`Vai, ${monName(p)}!`, { wait: false });
  await anim(350, t => { B.anim.p.dx = -240 * (1 - t); });
  B.showP = true; updateHud();
  await sleep(250);
}

async function faintAnim(side) {
  const a = B.anim[side];
  sfx(220, 0.3, 'triangle', 0.06);
  await anim(400, t => { a.dy = t * 80; a.alpha = 1 - t; });
  a.vis = false; a.dy = 0; a.alpha = 1;
  if (side === 'e') B.showE = false; else B.showP = false;
  updateHud();
}

async function chooseAction() {
  for (;;) {
    const me = G.party[B.pi];
    say(`O que ${monName(me)} vai fazer?`, { wait: false });
    const i = await choose(['LUTAR', 'MOCHILA', 'EQUIPE', 'FUGIR'], { cls: 'menu-battle', cols: 2, cancel: false, start: B.lastAct || 0 });
    B.lastAct = i;
    if (i === 0) {
      const mv = await chooseMove(me);
      if (mv) return { type: 'move', move: mv };
    } else if (i === 1) {
      const r = await openBag(true);
      if (r && r.ball) return { type: 'item', ball: r.ball };
      if (r && r.used) return { type: 'item', used: r.used, mon: r.mon };
    } else if (i === 2) {
      const idx = await choosePartyInBattle(true);
      if (idx != null && idx >= 0 && idx !== B.pi) return { type: 'switch', index: idx };
    } else return { type: 'run' };
  }
}

const CAT_LABEL = { fis: 'Físico', esp: 'Especial', status: 'Status' };
async function chooseMove(me) {
  if (me.moves.every(k => !me.pp[k])) {
    await say(`${monName(me)} não tem mais golpes! Vai no desespero!`);
    return 'desespero';
  }
  closeDlg();
  const info = el('div', 'box move-info');
  ui.appendChild(info);
  const opts = me.moves.map(k => ({ label: `${MOVES[k].name} <span class="dim">${me.pp[k]}/${movePP(MOVES[k])}</span>`, disabled: !me.pp[k] }));
  const foe = B.team[B.ei];
  const show = i => {
    const mv = MOVES[me.moves[i]];
    const mult = mv.pow ? typeMult(mv.type, POL[foe.id].types) : 1;
    const tag = !G.seen[foe.id] || mult === 1 ? '' : mult > 1 ? '<span style="color:#c03030">Super efetivo</span>' : '<span style="color:#888">Pouco efetivo</span>';
    info.innerHTML = `<span><span class="chip" style="background:${TYPES[mv.type].color}">${TYPES[mv.type].label}</span> ${CAT_LABEL[moveCat(mv)]}</span>
      <span>${mv.pow ? 'Poder ' + mv.pow : '—'} · Precisão ${mv.acc || '—'}</span>${tag}${mv.desc ? `<span class="dim">${mv.desc}</span>` : ''}`;
  };
  const i = await choose(opts, { cls: 'menu-moves', cols: 2, onMove: show, start: 0 });
  info.remove();
  return i < 0 ? null : me.moves[i];
}

async function choosePartyInBattle(cancel) {
  for (;;) {
    const i = await listScreen(cancel ? 'EQUIPE' : 'Escolha o próximo aliado', G.party, partyRow);
    if (i < 0) { if (cancel) return null; continue; }
    if (G.party[i].hp <= 0) { toast('Esse está fora de combate!'); continue; }
    if (i === B.pi) { toast('Já está em campo!'); continue; }
    return i;
  }
}

function enemyChooseMove(foe, me) {
  const ms = foe.moves.filter(k => foe.pp[k] > 0);
  if (!ms.length) return 'desespero';
  const max = stats(foe).hp;
  const scored = ms.map(k => {
    const mv = MOVES[k];
    let s;
    if (mv.pow) s = mv.pow * typeMult(mv.type, POL[me.id].types) * (POL[foe.id].types.includes(mv.type) ? 1.5 : 1) * (mv.acc || 100) / 100;
    else if (mv.eff === 'heal') s = foe.hp < max * 0.5 ? 120 : 5;
    else if (STATUS_INFO[mv.eff] || mv.eff === 'confuso') s = me.status ? 5 : 45;
    else s = 30;
    return s * (0.7 + Math.random() * 0.6);
  });
  return ms[scored.indexOf(Math.max(...scored))];
}

async function doMove(side, key) {
  const att = sideMon(side), o = otherSide(side), def = sideMon(o), vol = B.vol[side];
  const mv = MOVES[key], nm = battleName(att, side);
  if (vol.flinch) { vol.flinch = false; await say(`${nm} recuou e não agiu!`); return; }
  if (att.status === 'vista') {
    if (--att.sleep > 0) { await say(`${nm} pediu vista e está parado...`); return; }
    att.status = null; updateHud(); await say(`O pedido de vista de ${nm} acabou!`);
  }
  if (att.status === 'preso' && Math.random() < 0.25) { await say(`${nm} está PRESO PREVENTIVO e não conseguiu agir!`); return; }
  if (vol.conf > 0) {
    if (--vol.conf === 0) await say(`${nm} saiu da confusão!`);
    else {
      await say(`${nm} está confuso!`);
      if (Math.random() < 0.5) {
        const { dmg } = calcDamage(att, att, { pow: 40, type: 'CONFUSAO', cat: 'fis' }, B.st[side], B.st[side]);
        await hitAnim(side); att.hp = Math.max(0, att.hp - dmg); updateHud();
        await say('Se enrolou no próprio discurso e se machucou!');
        return;
      }
    }
  }
  if (key !== 'desespero') att.pp[key] = Math.max(0, (att.pp[key] || 0) - (hasAb(def, 'pressao') ? 2 : 1));
  await say(`${nm} usou ${mv.name}!`, { wait: false });
  await sleep(350);
  const cat = moveCat(mv);
  const selfMove = cat === 'status' && /up|heal/.test(mv.eff || '');
  if (!selfMove && mv.acc && Math.random() * 100 >= mv.acc * accMul(B.st[side].acc)) { await say('Mas errou!'); return; }
  if (cat === 'status') { await applyEffect(mv.eff, side, true); return; }

  const hits = mv.eff === 'multi' ? pick([2, 2, 2, 3, 3, 3, 4, 5]) : 1;
  let total = 0, n = 0, eff = 1, crits = 0, survived = false;
  for (; n < hits && def.hp > 0; n++) {
    const r = calcDamage(att, def, mv, B.st[side], B.st[o]);
    let dmg = r.dmg; eff = r.eff; if (r.crit > 1) crits++;
    if (hasAb(def, 'recurso') && def.hp >= stats(def).hp && dmg >= def.hp) { dmg = def.hp - 1; survived = true; }
    if (eff === 0) break;
    await hitAnim(o);
    def.hp = Math.max(0, def.hp - dmg); total += dmg; updateHud();
    await sleep(250);
  }
  if (eff === 0) { await say(`Não afetou ${battleName(def, o)}...`); return; }
  if (crits) await say('Acerto crítico!');
  if (eff > 1) await say('É super efetivo!'); else if (eff < 1) await say('Não foi muito efetivo...');
  if (hits > 1) await say(`Acertou ${n} vez${n > 1 ? 'es' : ''}!`);
  if (survived) await say(`${battleName(def, o)} entrou com Recurso Infinito e aguentou!`);
  if (mv.eff === 'drain' && total) {
    const h = Math.max(1, Math.floor(total / 2));
    att.hp = Math.min(stats(att).hp, att.hp + h); updateHud();
    await say(`${nm} desviou ${h} de vida pra conta dele!`);
  }
  if (mv.eff === 'recoil' && total) {
    att.hp = Math.max(0, att.hp - Math.max(1, Math.floor(total / 4))); updateHud();
    await say(`${nm} também se machucou no processo!`);
  }
  if (cat === 'fis' && hasAb(def, 'contato') && !att.status && !hasAb(att, 'imunidade') && Math.random() < 0.3) {
    att.status = 'investigado'; updateHud();
    await say(`Rabo preso! ${nm} agora está INVESTIGADO!`);
  }
  const passive = ['drain', 'recoil', 'multi', 'critico', 'fixo'];
  const chance = mv.chance != null ? mv.chance : 30;
  if (mv.eff && !passive.includes(mv.eff) && def.hp > 0 && Math.random() * 100 < chance) await applyEffect(mv.eff, side, false);
}

async function applyEffect(eff, side, primary) {
  if (!eff) { if (primary) await say('Nada aconteceu!'); return; }
  const o = otherSide(side), att = sideMon(side), def = sideMon(o);
  const nm = battleName(att, side), dn = battleName(def, o);
  const m = /^(atk|def|spa|spd|spe|acc)(up|down)(2?)$/.exec(eff);
  if (m) {
    const who = m[2] === 'up' ? side : o, d = (m[2] === 'up' ? 1 : -1) * (m[3] ? 2 : 1);
    const cur = B.st[who][m[1]];
    if ((d > 0 && cur >= 6) || (d < 0 && cur <= -6)) { if (primary) await say('Nada aconteceu!'); return; }
    B.st[who][m[1]] = Math.max(-6, Math.min(6, cur + d));
    sfx(d > 0 ? 700 : 300, 0.15, 'triangle', 0.05);
    await say(`${STAT_NAMES[m[1]]} de ${who === side ? nm : dn} ${d > 0 ? (d > 1 ? 'subiu muito' : 'subiu') : (d < -1 ? 'caiu muito' : 'caiu')}!`);
    return;
  }
  if (STATUS_INFO[eff]) {
    if (def.status) { if (primary) await say('Mas não teve efeito!'); return; }
    if (hasAb(def, 'imunidade')) { if (primary) await say(`${dn} tem Imunidade Parlamentar!`); return; }
    def.status = eff;
    if (eff === 'vista') def.sleep = rand(2, 4);
    updateHud();
    sfx(260, 0.2, 'square', 0.05);
    await say({ investigado: `${dn} agora está INVESTIGADO!`, preso: `${dn} foi PRESO PREVENTIVAMENTE!`, vista: `${dn} pediu vista e parou tudo!` }[eff]);
    return;
  }
  switch (eff) {
    case 'confuso':
      if (B.vol[o].conf) { if (primary) await say('Mas não teve efeito!'); return; }
      B.vol[o].conf = rand(2, 5); await say(`${dn} ficou confuso!`); return;
    case 'flinch': B.vol[o].flinch = true; return;
    case 'heal': {
      const max = stats(att).hp;
      if (att.hp >= max) { await say('Mas a vida já estava cheia!'); return; }
      att.hp = Math.min(max, att.hp + Math.floor(max / 2)); updateHud();
      await say(`${nm} se recuperou!`); return;
    }
    case 'nada': await say('Não deu em nada.'); return;
    default: if (primary) await say('Nada aconteceu!');
  }
}

async function learnMove(m, mk) {
  if (m.moves.includes(mk) || !MOVES[mk]) return;
  if (m.moves.length < 4) {
    m.moves.push(mk); m.pp[mk] = movePP(MOVES[mk]);
    await say(`${monName(m)} aprendeu ${MOVES[mk].name}!`);
    return;
  }
  await say(`${monName(m)} quer aprender ${MOVES[mk].name}, mas já sabe 4 golpes. Esquecer um?`, { wait: false });
  if (!(await yesNo())) { await say(`${monName(m)} não aprendeu ${MOVES[mk].name}.`); return; }
  closeDlg();
  const i = await choose(m.moves.map(k => MOVES[k].name).concat(['CANCELAR']));
  if (i < 0 || i >= 4) { await say(`${monName(m)} não aprendeu ${MOVES[mk].name}.`); return; }
  const out = m.moves[i];
  m.moves[i] = mk; delete m.pp[out]; m.pp[mk] = movePP(MOVES[mk]);
  await say(`${monName(m)} esqueceu ${MOVES[out].name} e aprendeu ${MOVES[mk].name}!`);
}

// "Evolução": o político sobe de cargo.
async function promote(m, onField) {
  const rank = rankName(m);
  await say(`O quê? ${monName(m)} está sendo promovido!`);
  if (onField && B) { for (let k = 0; k < 6; k++) { B.anim.flash = k % 2 === 0; await sleep(120); } B.anim.flash = false; }
  sfx(523, 0.12); await sleep(130); sfx(659, 0.12); await sleep(130); sfx(784, 0.25);
  await say(`Parabéns! ${monName(m)} agora é ${rank}!`);
}

async function giveXP(foe) {
  const gain = Math.floor(expYield(POL[foe.id]) * foe.lvl / 7 * (B.wild ? 1 : 1.5));
  const alive = [...B.used].filter(i => G.party[i] && G.party[i].hp > 0);
  const each = Math.max(1, Math.floor(gain / Math.max(1, alive.length)));
  for (const i of alive) {
    const m = G.party[i];
    m.xp += each;
    if (i === B.pi) updateHud();
    await say(`${monName(m)} ganhou ${each} pontos de experiência!`);
    while (m.lvl < 100 && m.xp >= (m.lvl + 1) ** 3) {
      const old = stats(m).hp, oldStage = careerStage(POL[m.id], m.lvl);
      m.lvl++;
      m.hp += stats(m).hp - old;
      if (i === B.pi) updateHud();
      sfx(784, 0.1, 'square', 0.05); await sleep(90); sfx(1046, 0.15, 'square', 0.05);
      await say(`${monName(m)} subiu para o nível ${m.lvl}!`);
      for (const [l, mk] of POL[m.id].learn) if (l === m.lvl) await learnMove(m, mk);
      if (careerStage(POL[m.id], m.lvl) !== oldStage) { await promote(m, i === B.pi); if (i === B.pi) { $('#hudP').dataset.key = ''; updateHud(); } }
    }
  }
  B.used = new Set([B.pi]);
}

async function throwBall(key) {
  if (!B.wild) {
    await say('O alvo tem foro privilegiado! Só dá pra prender com autorização do STF.');
    await say('Derrote a equipe dele para concluir a operação.');
    return 'blocked';
  }
  G.items[key]--; if (!G.items[key]) delete G.items[key];
  const foe = B.team[B.ei];
  await say(`${G.name} cumpriu um ${ITEMS[key].name}!`, { wait: false });
  B.anim.ball = { x: 80, y: 190 };
  await anim(500, t => { B.anim.ball.x = 80 + 276 * t; B.anim.ball.y = 190 - 150 * Math.sin(t * Math.PI) - 80 * t; });
  B.anim.ball = { x: 356, y: 96 };
  B.anim.flash = true; await sleep(80); B.anim.flash = false;
  B.anim.e.vis = false;
  const shakes = catchShakes(foe, ITEMS[key].ball);
  for (let k = 0; k < Math.min(3, shakes); k++) {
    await sleep(350);
    sfx(300, 0.06, 'square', 0.04);
    await anim(240, t => { B.anim.ball.x = 356 + Math.sin(t * Math.PI * 2) * 6; });
  }
  await sleep(300);
  if (shakes >= 4) {
    sfx(660, 0.1); await sleep(110); sfx(880, 0.1); await sleep(110); sfx(1320, 0.2);
    await say(`Pronto! ${monName(foe)} foi preso!`);
    G.caught[foe.id] = true; G.seen[foe.id] = true;
    await say(`${monName(foe)} topou fazer delação premiada e agora vai trabalhar pra PF!`);
    B.anim.ball = null;
    if (G.party.length < 6) G.party.push(foe);
    else { G.box.push(foe); await say(`Sua equipe está cheia. ${monName(foe)} foi para a carceragem da Superintendência.`); }
    return 'caught';
  }
  B.anim.ball = null; B.anim.e.vis = true;
  await say(shakes === 3 ? 'Quase! ' + pick(ESCAPE_LINES) : pick(ESCAPE_LINES));
  return 'escaped';
}

// ---------- Título, introdução e final ----------
function drawTitle() {
  const g = ctx.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, '#0e1c48'); g.addColorStop(1, '#2a4a9a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(Math.floor((k * 53 + S.tick * 0.3) % SW), (k * 37) % 120, 1, 1); }
  ctx.textAlign = 'center';
  ctx.font = '40px "Press Start 2P", monospace';
  ctx.fillStyle = '#0a1430'; ctx.fillText('POKÉPOL', SW / 2 + 4, 66);
  ctx.fillStyle = '#f4c430'; ctx.fillText('POKÉPOL', SW / 2, 62);
  ctx.font = '800 15px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#e8f0ff'; ctx.fillText('EDIÇÃO POLÍCIA FEDERAL', SW / 2, 86);
  const bob = Math.round(Math.sin(S.tick / 20) * 3);
  drawPol(POL.golpenaro, false, 310, 90 + bob, 120);
  { const im = personSprite(AGENT_LOOK, 'right', 0); ctx.drawImage(im, 70, 200 - TILE * 3 * im.height / im.width, TILE * 3, TILE * 3 * im.height / im.width); }
  ctx.drawImage(MANDADO(), 210, 150 + bob, 48, 48);
  ctx.textAlign = 'left';
}

async function titleScreen() {
  S.mode = 'title';
  ui.innerHTML = '';
  ui.appendChild(el('div', 'disclaimer', 'Paródia sem fins lucrativos. Fatos baseados em notícias públicas. Investigados não condenados são presumidos inocentes.'));
  const wrap = el('div', 'title-ui');
  ui.appendChild(wrap);
  const saved = loadGame();
  const opts = saved ? ['CONTINUAR', 'NOVO JOGO'] : ['NOVO JOGO'];
  const i = await new Promise(res => {
    const m = el('div', 'box menu');
    let idx = 0;
    const items = opts.map((o, k) => { const e = el('div', 'opt', o); e.onclick = () => { pop(); res(k); }; m.appendChild(e); return e; });
    const draw = () => items.forEach((e, k) => e.classList.toggle('sel', k === idx));
    const pop = pushHandler(b => {
      if (b === 'up' || b === 'down') { idx = (idx + 1) % opts.length; draw(); }
      if (b === 'a' || b === 'start') { pop(); res(idx); }
    });
    wrap.appendChild(m); draw();
  });
  ui.innerHTML = '';
  if (opts[i] === 'CONTINUAR') {
    G = saved;
    G.gyms = G.gyms || {}; G.badges = G.badges || [];
    for (const k of ['party', 'box']) G[k] = G[k].filter(upgradeMon);
    // save do mapa antigo: volta para o início do mapa do Brasil
    if (G.mapVer !== 2) { const st = startPos(); G.x = st.x; G.y = st.y; G.dir = 'up'; G.lastPF = null; G.mapVer = 2; }
    refreshGates();
    S.mode = 'world';
    S.region = '';
    showRegion();
    return;
  }
  if (saved) {
    await say('Já existe um jogo salvo. Começar do zero vai apagar o progresso. Tem certeza?', { wait: false });
    if (!(await yesNo())) { closeDlg(); return titleScreen(); }
    closeDlg();
  }
  await intro();
}

function askName() {
  return new Promise(res => {
    const b = el('div', 'box name-input', '<label>Seu nome, agente:</label><input maxlength="10" value="Agente" autocomplete="off"><button>CONFIRMAR</button>');
    ui.appendChild(b);
    const inp = $('input', b);
    const ok = () => { const v = inp.value.trim() || 'Agente'; pop(); b.remove(); res(v); };
    $('button', b).onclick = ok;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    const pop = pushHandler(btn => { if (btn === 'a' || btn === 'start') ok(); });
    setTimeout(() => inp.select(), 50);
  });
}

function chooseStarter() {
  return new Promise(res => {
    const w = el('div', 'starters');
    let idx = 0;
    const cards = STARTERS.map((id, k) => {
      const p = POL[id];
      const c = el('div', 'card', `<img src="${spriteURL(p)}"><b>${p.name}</b><span class="dim">${realName(p)}</span>${typeChips(p.types)}`);
      c.onclick = () => { idx = k; draw(); pop(); w.remove(); res(id); };
      w.appendChild(c);
      return c;
    });
    const draw = () => { cards.forEach((c, k) => c.classList.toggle('sel', k === idx)); const p = POL[STARTERS[idx]]; say(`${p.name}, o ${realName(p)}. Tipo ${p.types.map(t => TYPES[t].label).join('/')}. ←/→ escolhe, Z confirma.`, { wait: false }); };
    const pop = pushHandler(b => {
      if (b === 'left') idx = (idx + 2) % 3;
      else if (b === 'right') idx = (idx + 1) % 3;
      else if (b === 'a') { pop(); w.remove(); res(STARTERS[idx]); return; }
      else return;
      draw();
    });
    ui.appendChild(w); draw();
  });
}

async function intro() {
  S.mode = 'intro';
  await say('Olá! Bem-vindo à Força-Tarefa POKÉPOL da Polícia Federal, em Curitiba.');
  await say('Eu sou Flávio Dino, ministro do STF. Sou eu quem autoriza os mandados desta operação.');
  closeDlg();
  const name = await askName();
  newGame(name);
  await say(`Agente ${name}! O Brasil está infestado de POLÍTICOS.`);
  await say('Alguns são honestos... outros, nem tanto.');
  await say('Sua missão: investigar, prender e registrar cada um no POLIDEX.');
  await say('Enfraqueça o alvo em combate e cumpra um MANDADO DE PRISÃO.');
  await say('Quem é preso pode fazer delação premiada e lutar ao seu lado!');
  await say('Para começar, escolha seu primeiro colaborador.');
  for (;;) {
    const id = await chooseStarter();
    await say(`Escolher ${POL[id].name}?`, { wait: false });
    if (await yesNo()) {
      G.party.push(makeMon(id, 5)); G.seen[id] = true; G.caught[id] = true;
      break;
    }
  }
  await say(`${monName(G.party[0])} agora trabalha com você!`);
  await say('Em cada capital, o crime organizado banca políticos a partir do palácio do governo. Desarticule cada ginásio e ganhe a insígnia.');
  await say('Com todas as insígnias, o Congresso e o Planalto, em Brasília, ficam ao seu alcance.');
  await say('Aperte ENTER para abrir o menu. Z confirma e X volta. Boa sorte, agente!');
  closeDlg();
  saveGame();
  S.mode = 'world'; S.region = '';
  showRegion();
}

async function ending() {
  await say('A Força-Tarefa POKÉPOL desmantelou a organização!');
  await say(`Ministro Flávio Dino: "Excelente trabalho, agente ${G.name}!"`);
  await say('"Mas ainda tem muito político solto por aí. Complete o POLIDEX!"');
  await say('Dizem que Golpenaro fugiu da cela e anda escondido no mato da Esplanada...');
  closeDlg();
}

// ---------- Loop principal ----------
// O canvas acompanha a resolução real da tela; o jogo continua pensando em 480x270.
let mandadoImg = null;

const MANDADO = () => mandadoImg || (mandadoImg = mandadoSprite());
// O canvas cobre a janela inteira. Título e batalha usam uma área 16:9 centralizada (480x270 unidades);
// o mapa usa a janela toda com tamanho de tile fixo, então janela maior = mais mapa visível.
const VIEW = { k: 1, ox: 0, oy: 0, dpr: 1 };
function fitCanvas() {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(SW, Math.min(5120, Math.round(r.width * dpr))), h = Math.max(SH, Math.min(2880, Math.round(r.height * dpr)));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; miniCanvas = null; }
  VIEW.dpr = dpr;
  VIEW.k = Math.min(w / SW, h / SH);
  VIEW.ox = Math.round((w - SW * VIEW.k) / 2); VIEW.oy = Math.round((h - SH * VIEW.k) / 2);
  ctx.setTransform(VIEW.k, 0, 0, VIEW.k, VIEW.ox, VIEW.oy);
  ctx.imageSmoothingEnabled = false; // pixel art nítida, como no Fire Red
}
new ResizeObserver(fitCanvas).observe(cv);

let lastT = 0;
function frame(now = 0) {
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
  lastT = now;
  S.tick++;
  fitCanvas();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = S.mode === 'battle' ? '#b8e0a0' : S.mode === 'cutscene' ? '#8cc4f4' : S.mode === 'title' ? '#0e1c48' : S.mode === 'intro' ? '#1e3a78' : '#000';
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(VIEW.k, 0, 0, VIEW.k, VIEW.ox, VIEW.oy);
  if (S.mode === 'world' || S.mode === 'trans') {
    if (S.mode === 'world') updateWorld(dt);
    drawWorld();
    if (S.mode === 'trans' && S.flash) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); }
  } else if (S.mode === 'battle') drawBattle();
  else if (S.mode === 'cutscene') drawCutscene();
  else if (S.mode === 'title') drawTitle();
  else if (S.mode === 'intro') { ctx.fillStyle = '#1e3a78'; ctx.fillRect(0, 0, SW, SH); ctx.fillStyle = '#2c4e9a'; ctx.beginPath(); ctx.ellipse(SW / 2, 172, 110, 18, 0, 0, 7); ctx.fill(); drawPol(MENTOR, false, SW / 2 - 80, 10, 160); }
  requestAnimationFrame(frame);
}

function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else enterFullscreen();
}
function enterFullscreen() {
  const e = document.documentElement;
  const req = e.requestFullscreen || e.webkitRequestFullscreen;
  if (!req) return Promise.resolve();
  return Promise.resolve(req.call(e, { navigationUI: 'hide' })).then(() => {
    if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape').catch(() => {});
  }).catch(() => {});
}

function boot() {
  buildTiles();
  buildWorld();
  addTravelArt();
  spawnGymGuards();
  fitCanvas();
  requestAnimationFrame(frame);
  const ready = Promise.all([loadBalance(), loadGyms(), loadEmpresas(), loadCustomSprites(), document.fonts ? document.fonts.ready : null, document.fonts ? document.fonts.load('700 16px Nunito') : null])
    .then(() => { for (const k in imgCache) delete imgCache[k]; seedPoolsByUF(); });
  const bootEl = $('#boot');
  if (location.protocol === 'file:' && !window.EMBEDDED_ASSETS) { const fh = $('.file-hint'); if (fh) fh.hidden = false; }
  const start = full => {
    if (bootEl.classList.contains('hidden')) return;
    bootEl.classList.add('hidden');
    if (full) enterFullscreen();
    sfx(660, 0.08);
    ready.then(titleScreen);
  };
  $('#bootFull').onclick = () => start(true);
  $('#bootWin').onclick = () => start(false);
  $('#bootFull').focus();
  document.addEventListener('keydown', e => {
    if (bootEl.classList.contains('hidden')) return;
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') { e.preventDefault(); start(document.activeElement !== $('#bootWin')); }
  });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
