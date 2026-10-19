// POKÉPOL — ginásios (um por capital, dentro do palácio do governo), insígnias,
// bloqueios de rota e a "Elite" do Congresso. Chefões e capangas são personagens fictícios.

let GYMS = {};
// Onde o dinheiro do capanga estava escondido (sorteado a cada vitória).
const LOOT_PLACES = ['Na cueca dele tinha', 'Dentro de uma caixa de sapato:', 'No fundo falso da mala:', 'Atrás do armário do gabinete:',
  'Numa conta em nome da avó:', 'Num envelope pardo escrito "lanche":', 'Enrolado em panos de prato:', 'Na meia, dentro da bota:'];

function loadGyms() {
  const src = location.protocol === 'file:' && window.GYMS_DATA ? Promise.resolve(window.GYMS_DATA)
    : fetch('data/gyms.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : window.GYMS_DATA || {}).catch(() => window.GYMS_DATA || {});
  return src.then(d => { GYMS = d || {}; });
}

const cityById = id => (World.cities || []).find(c => c.id === id);
const cityAt = (x, y) => (World.cities || []).find(c => x >= c.x - 3 && x < c.x + c.w + 3 && y >= c.y - 3 && y < c.y + c.h + 3);
const TOTAL_GYMS = () => (World.cities || []).filter(c => c.id !== 'brasilia').length;
const gymState = id => (G.gyms = G.gyms || {})[id] || (G.gyms[id] = { beaten: 0, badge: false, teams: null });
const badgeCount = () => Object.values(G.gyms || {}).filter(s => s.badge).length;

// Nível do político na carreira: 0 = municipal/estadual, 1 = federal, 2 = cúpula (senado, ministério, governo, presidência).
function politicianTier(p) {
  const r = (p.career || []).map(c => c.rank).join(' ');
  if (/Presidente|Senador|Ministr|Governador/i.test(r)) return 2;
  if (/Deputad[oa] Federal|Prefeit[oa] de (São Paulo|Rio)/i.test(r)) return 1;
  if (r) return 0;
  return base6(p).reduce((a, b) => a + b, 0) > 420 ? 2 : 0;
}
// Longe de Brasília (começo da viagem) aparecem mais vereadores e estaduais; perto, mais federais e senadores.
function tierWeight(p, progress) {
  const t = politicianTier(p);
  return t === 0 ? 1.6 - progress * 1.2 : t === 1 ? 0.8 + progress * 0.6 : 0.4 + progress * 1.4;
}
function areaProgress(area) {
  const [lo, hi] = area.levels || [5, 5];
  return Math.max(0, Math.min(1, ((lo + hi) / 2 - 4) / 44));
}

function cityArea(city) {
  return (World.areas || {})['cidade_' + city.id] || Object.values(World.areas || {}).find(a => a.name && a.name.includes(city.name)) || { levels: [5, 8], pool: [] };
}

function weightedPick(pool) {
  const tot = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * tot;
  for (const [id, w] of pool) { r -= w; if (r <= 0) return id; }
  return pool[pool.length - 1][0];
}

// Equipe de um capanga (k) ou do chefão: políticos do estado, preferindo o tipo do ginásio.
function buildGymTeam(city, k, leader) {
  const area = cityArea(city), g = GYMS[city.id] || {}, focus = new Set(g.typeFocus || []);
  const prog = areaProgress(area);
  let pool = (area.pool || []).filter(([id]) => POL[id] && id !== 'golpenaro' && !STARTERS.includes(id))
    .map(([id, w]) => [id, w * tierWeight(POL[id], prog) * (POL[id].types.some(t => focus.has(t)) ? 3 : 1)]);
  if (pool.length < 2) pool = POLITICOS.filter(p => p.id !== 'golpenaro' && !STARTERS.includes(p.id)).map(p => [p.id, 1]);
  const [lo, hi] = area.levels;
  const order = city.order || 1;
  const size = leader ? Math.min(6, 2 + Math.ceil(order / 6)) : 1 + Math.min(3, Math.ceil(order / 8)) + (k % 2);
  const team = [];
  let left = pool.slice();
  for (let i = 0; i < size; i++) {
    if (!left.length) left = pool.slice(); // estado com poucos políticos: só repete depois de usar todos
    const id = weightedPick(left);
    left = left.filter(([x]) => x !== id);
    const lvl = leader ? hi + 1 + Math.round(3 * i / Math.max(1, size - 1)) : rand(lo, hi);
    team.push([id, Math.max(2, lvl)]);
  }
  if (leader) { // o mais forte por último, como os líderes de ginásio
    team.sort((a, b) => base6(POL[a[0]]).reduce((s, v) => s + v, 0) - base6(POL[b[0]]).reduce((s, v) => s + v, 0));
    team.forEach((t, i) => { t[1] = hi + 1 + Math.round(3 * i / Math.max(1, team.length - 1)); });
  }
  return team;
}

// Dados padrão quando data/gyms.json não tem a cidade.
function gymData(city) {
  const g = GYMS[city.id] || {};
  return {
    badge: g.badge || `Insígnia de ${city.name}`,
    boss: Object.assign({ name: 'Chefão Local', title: `Chefão do esquema de ${city.name}`, intro: ['Aqui quem manda sou eu.', 'Meus políticos estão todos na folha!'], lose: 'Vou ter que arrumar outros laranjas...' }, g.boss || {}),
    trainers: (g.trainers && g.trainers.length ? g.trainers : [
      { name: 'Laranja Júnior', title: 'Capanga', line: 'Meu nome está em sete empresas. Nenhuma é minha!' },
      { name: 'Operador Fulano', title: 'Capanga', line: 'O chefe não recebe visita. Só depósito.' },
    ]),
  };
}

// Sequência do ginásio: capangas um a um, depois o chefão. Dá para sair e voltar (o progresso fica salvo).
async function gymSequence(b) {
  const city = cityById(b.city) || cityAt(b.x, b.y);
  if (!city) return talk([`${b.label}.`]);
  const st = gymState(city.id), g = gymData(city);
  if (st.badge) return talk([`${b.label}: o esquema daqui já foi desarticulado.`, `Você tem a ${g.badge}.`]);
  const req = gymRequired(city);
  if (badgeCount() < req) return talk([`Agente da PF: "Alto lá! Esse esquema é grande demais pra você ainda."`, `"Para entrar aqui você precisa de ${req} insígnia(s). Você tem ${badgeCount()}."`]);
  if (!st.teams) {
    st.teams = g.trainers.map((t, k) => buildGymTeam(city, k, false)).concat([buildGymTeam(city, 0, true)]);
    saveGame();
  }
  await say(`${b.label}. Aqui funciona o QG de ${g.boss.name}, ${g.boss.title}.`);
  await say(st.beaten ? `Você já desarticulou ${st.beaten} capanga(s). Continuar a operação?` : 'Iniciar a operação neste ginásio?', { wait: false });
  if (!(await yesNo())) { closeDlg(); return; }
  closeDlg();
  while (st.beaten < g.trainers.length) {
    const t = g.trainers[st.beaten];
    const team = st.teams[st.beaten].map(([id, l]) => makeMon(id, l));
    await transition();
    const res = await battle({ team, boss: { name: t.name, title: t.title || 'Capanga', intro: [t.line || 'Você não vai passar!'] } });
    if (res !== 'win') { if (res === 'lose') await whiteout(); return; }
    st.beaten++;
    const prize = Math.round((8000 + rand(0, 6000)) * (city.order || 1) * (1 + Math.random()));
    G.money += prize; G.recovered = (G.recovered || 0) + prize; saveGame();
    await say(`${t.name}: "${t.lose || 'O chefe não vai gostar nada disso...'}"`);
    sfx(988, 0.08); await sleep(90); sfx(1318, 0.12);
    await say(`${pick(LOOT_PLACES)} ${fmtMoney(prize)} do esquema. Direto para o Cofre Público!`);
    const left = g.trainers.length - st.beaten;
    await say(left ? `Faltam ${left} capanga(s) antes do chefão. Seguir em frente?` : `Agora só falta ${g.boss.name}. Enfrentar o chefão?`, { wait: false });
    if (!(await yesNo())) { closeDlg(); return; }
    closeDlg();
  }
  const team = st.teams[st.teams.length - 1].map(([id, l]) => makeMon(id, l));
  await transition();
  const res = await battle({ team, boss: { name: g.boss.name, title: g.boss.title, intro: g.boss.intro || [] } });
  if (res !== 'win') { if (res === 'lose') await whiteout(); return; }
  st.badge = true;
  const prize = Math.round((250000 + rand(0, 150000)) * (city.order || 1));
  G.money += prize; G.recovered = (G.recovered || 0) + prize;
  G.badges = G.badges || [];
  if (!G.badges.includes(g.badge)) G.badges.push(g.badge);
  refreshGates();
  saveGame();
  await say(`${g.boss.name}: "${g.boss.lose || 'Isso não vai ficar assim...'}"`);
  sfx(523, 0.12); await sleep(130); sfx(659, 0.12); await sleep(130); sfx(784, 0.3);
  await say(`Operação concluída! Você recebeu a ${g.badge}.`);
  await say(`O cofre do chefão tinha ${fmtMoney(prize)}. Tudo foi para o Cofre Público. O crime não compensa... mas combater o crime compensa!`);
  await say(`A rota saindo de ${city.name} está liberada. (${badgeCount()}/${TOTAL_GYMS()} insígnias)`);
  closeDlg();
}

// Congresso: a "Elite dos Lobbies" (4 lutas seguidas, sem sair) e depois a equipe do Cunha.
async function congressoSequence() {
  const need = TOTAL_GYMS();
  if (badgeCount() < need) return talk(['Segurança do Congresso: "Acesso restrito."', `Só entra quem tem as ${need} insígnias. Você tem ${badgeCount()}.`]);
  const st = gymState('congresso');
  if (st.badge) return talk(['O Congresso está sob intervenção da PF. A Elite dos Lobbies já caiu.']);
  const elite = ((GYMS.brasilia || {}).elite || []).slice(0, 4);
  while (elite.length < 4) elite.push({ name: `Lobista ${elite.length + 1}`, title: 'Elite dos Lobbies', intro: ['Aqui tudo se resolve no cafezinho.'] });
  const bsb = cityById('brasilia') || { id: 'brasilia', name: 'Brasília', order: 27 };
  if (!st.teams) { st.teams = elite.map(() => buildGymTeam(bsb, 0, true)); saveGame(); }
  await say('Congresso Nacional. Você vai enfrentar a Elite dos Lobbies, uma luta atrás da outra.', { wait: false });
  if (!(await yesNo())) { closeDlg(); return; }
  closeDlg();
  for (let i = st.beaten; i < elite.length; i++) {
    const e = elite[i];
    await transition();
    const res = await battle({ team: st.teams[i].map(([id, l]) => makeMon(id, l)), boss: { name: e.name, title: e.title || 'Elite dos Lobbies', intro: e.intro || [] } });
    if (res !== 'win') { st.beaten = 0; saveGame(); if (res === 'lose') await whiteout(); return; }
    st.beaten = i + 1; saveGame();
    if (e.lose) await say(`${e.name}: "${e.lose}"`);
  }
  await bossBattle('cunha');
  if (G.badges.includes(BOSSES.cunha.badge)) { st.badge = true; refreshGates(); saveGame(); }
}

// Esconde os guardas de rota das cidades já conquistadas e o guarda do Planalto depois do Congresso.
// Mapa aberto: os guardas de rota ficam fora; quem barra é o guarda da PF na porta de cada ginásio.
function refreshGates() {
  for (const n of World.npcs || []) {
    if (n.id && n.id.startsWith('gate_')) n.hidden = true;
    if (n.id === 'guard') n.hidden = !!(G.badges && G.badges.includes(BOSSES.cunha.badge));
    if (n.gymOf) {
      const c = cityById(n.gymOf), req = gymRequired(c), have = badgeCount(), st = G.gyms && G.gyms[n.gymOf];
      n.lines = st && st.badge ? ['Agente da PF: "Esse ginásio já foi desarticulado. Bom trabalho!"']
        : have >= req ? ['Agente da PF: "Pode entrar, agente. O chefão está lá dentro."']
        : [`Agente da PF: "Para entrar neste ginásio você precisa de ${req} insígnia(s)."`, `"Você tem ${have}. Volte depois de desarticular outros esquemas."`];
    }
  }
}

// Insígnias exigidas: as 3 primeiras capitais não pedem nada; depois, a ordem da viagem menos 3.
function gymRequired(city) { return city ? Math.max(0, (city.order || 1) - 3) : 0; }

// Um agente da PF ao lado da porta de cada palácio (ginásio).
function spawnGymGuards() {
  const look = { skin: '#e8b48a', hair: '#2a2220', shirt: '#1a1a22', pants: '#2e2e3a', cap: '#14141a', capMark: '#f4c430', stripe: '#f4c430', badge: '#f4c430' };
  for (const b of World.buildings || []) {
    if (!(b.kind === 'palacio' || b.id === 'guanabara') || !b.door || !b.city) continue;
    const spot = [[-1, 1], [1, 1], [-2, 1], [2, 1]].map(([dx, dy]) => ({ x: b.door.x + dx, y: b.door.y + dy })).find(p => !isSolid(p.x, p.y));
    if (!spot) continue;
    World.npcs.push({ id: 'pfguard_' + b.city, gymOf: b.city, x: spot.x, y: spot.y, dir: spot.x < b.door.x ? 'right' : 'left', look, lines: [] });
  }
}

// Menu de insígnias: a coleção das 26 capitais + Congresso. Juntar todas e vencer o Planalto encerra o jogo.
function badgeIcon(text, owned, hue) {
  const [c, x] = mkCanvas(32, 32);
  x.fillStyle = owned ? `hsl(${hue},70%,55%)` : '#9a9aa4';
  x.beginPath(); x.moveTo(16, 2); x.lineTo(29, 7); x.lineTo(27, 21); x.lineTo(16, 30); x.lineTo(5, 21); x.lineTo(3, 7); x.closePath(); x.fill();
  x.fillStyle = owned ? `hsl(${hue},80%,78%)` : '#c4c4cc';
  x.beginPath(); x.moveTo(16, 6); x.lineTo(25, 9); x.lineTo(24, 19); x.lineTo(16, 25); x.closePath(); x.fill();
  x.fillStyle = owned ? '#1c1c28' : '#6a6a74'; x.font = 'bold 10px sans-serif'; x.textAlign = 'center';
  x.fillText(text, 16, 20);
  outline(c);
  return c.toDataURL();
}
async function openBadges() {
  const items = (World.cities || []).filter(c => c.id !== 'brasilia').map((c, i) => ({ city: c, g: gymData(c), owned: !!(G.gyms && G.gyms[c.id] && G.gyms[c.id].badge), hue: (i * 37) % 360 }));
  items.push({ city: { name: 'Brasília · Congresso', uf: 'DF' }, g: { badge: BOSSES.cunha.badge }, owned: !!(G.badges || []).includes(BOSSES.cunha.badge), hue: 45 });
  const owned = items.filter(i => i.owned).length;
  await listScreen('INSÍGNIAS', items, it => `<img src="${badgeIcon(it.city.uf || '', it.owned, it.hue)}"><span class="grow">${it.owned ? it.g.badge : '???'}<br><span class="dim">${it.city.name}</span></span>${it.owned ? '🏅' : ''}`,
    { right: `${owned}/${items.length}`, foot: 'Colecione todas as insígnias para entrar no Congresso e chegar ao Planalto.' });
}

// Políticos que ainda não estão em nenhum mato entram no mato do próprio estado:
// capital (cidade_<id>) e as rotas que chegam e saem dela (rota_<ordem-1>, rota_<ordem>).
function seedPoolsByUF() {
  const areas = World.areas || {}, cities = World.cities || [];
  const inPool = new Set();
  for (const a of Object.values(areas)) for (const [id] of a.pool || []) inPool.add(id);
  for (const id of STARTERS) if (!inPool.has(id)) for (const aid of ['cidade_brasilia', 'rota_26']) if (areas[aid]) (areas[aid].pool = areas[aid].pool || []).push([id, 1]);
  for (const p of POLITICOS) {
    if (!p.uf || inPool.has(p.id) || STARTERS.includes(p.id) || p.id === 'golpenaro') continue;
    for (const c of cities.filter(c => c.uf === p.uf)) {
      for (const aid of ['cidade_' + c.id, 'rota_' + c.order, 'rota_' + (c.order - 1)]) {
        const a = areas[aid];
        if (a) (a.pool = a.pool || []).push([p.id, 4]);
      }
    }
  }
  // nenhum mato fica vazio: cidade sem elenco próprio herda os políticos das rotas vizinhas
  for (const c of cities) {
    const a = areas['cidade_' + c.id];
    if (a && !(a.pool || []).length) a.pool = ['rota_' + (c.order - 1), 'rota_' + c.order].flatMap(k => (areas[k] && areas[k].pool) || []).map(([id, w]) => [id, w]);
  }
  // a família e os aliados aparecem bastante no estado deles e em Brasília
  const FREQUENTES = { rachadinho: ['RJ', 'DF'], carluxo: ['RJ', 'DF'], tarifardo: ['SP', 'DF'], lirassauro: ['AL', 'DF'] };
  for (const [id, ufs] of Object.entries(FREQUENTES)) {
    if (!POL[id] || STARTERS.includes(id)) continue;
    for (const c of cities.filter(c => ufs.includes(c.uf)))
      for (const aid of ['cidade_' + c.id, 'rota_' + c.order, 'rota_' + (c.order - 1)]) {
        const a = areas[aid];
        if (a) (a.pool = a.pool || []).push([id, id === 'lirassauro' || id === 'tarifardo' ? 6 : 10]);
      }
  }
}

// Zerar o jogo: todas as insígnias (26 capitais + Congresso), o Planalto vencido e todos os políticos presos.
async function checkGameComplete() {
  if (!G || G.completed) return;
  const caught = Object.keys(G.caught || {}).length, total = POLITICOS.length;
  const allBadges = badgeCount() >= TOTAL_GYMS() && (G.badges || []).includes(BOSSES.cunha.badge) && (G.badges || []).includes(BOSSES.bolsonaro.badge);
  if (!allBadges || caught < total) return;
  G.completed = true; saveGame();
  for (let k = 0; k < 4; k++) { sfx(523 + k * 131, 0.15, 'triangle', 0.06); await sleep(160); }
  await say('PARABÉNS! Todas as insígnias conquistadas e todos os políticos presos!');
  await say(`Ministro Flávio Dino: "Agente ${G.name}, você zerou o POKÉPOL."`);
  await say(`Total devolvido ao cofre público: ${fmtMoney(G.recovered || 0)}.`);
  await say('O Brasil agradece. Pelo menos até a próxima eleição.');
  closeDlg();
}
