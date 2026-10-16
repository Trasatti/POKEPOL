// POKÉPOL — zonas de treinamento: empresas de casos famosos de corrupção.
// O empresário luta com os políticos ligados ao caso dele (dados e fontes em data/empresas.json).
// Primeira vitória: o dinheiro do esquema volta ao cofre público. Revanches: treino com recompensa menor.

let EMPRESAS = [];

function loadEmpresas() {
  const src = location.protocol === 'file:' && window.EMPRESAS_DATA ? Promise.resolve(window.EMPRESAS_DATA)
    : fetch('data/empresas.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : window.EMPRESAS_DATA || []).catch(() => window.EMPRESAS_DATA || []);
  return src.then(d => { EMPRESAS = Array.isArray(d) ? d : []; });
}

const empresaById = id => EMPRESAS.find(e => e.id === id);
const partyAvgLevel = () => Math.round(G.party.reduce((a, m) => a + m.lvl, 0) / Math.max(1, G.party.length));

async function empresaSequence(b) {
  const E = empresaById(b.empresa || (b.id || '').replace(/^empresa_/, ''));
  if (!E) return talk([`${b.label || 'Empresa'}: portas fechadas. Parece que todo mundo saiu para "almoçar".`]);
  G.empresas = G.empresas || {};
  const st = G.empresas[E.id] || (G.empresas[E.id] = { wins: 0 });
  const owner = E.owner || {}, first = !st.wins;
  await say(`${E.label || E.empresa}. ${owner.name || 'O dono'} está na sala de reuniões.`);
  await say(first ? 'Enfrentar o empresário e recuperar o dinheiro do esquema?' : 'Treinar de novo contra o empresário? (revanche)', { wait: false });
  if (!(await yesNo())) { closeDlg(); return; }
  closeDlg();
  // primeira luta: nível da região; revanches: acompanham o nível da sua equipe
  const city = cityById(E.city), area = city ? cityArea(city) : { levels: [10, 14] };
  const base = first ? area.levels[1] + 2 : partyAvgLevel() + 1;
  const ids = (E.team || []).map(t => typeof t === 'string' ? t : t.id).filter(id => POL[id]);
  if (!ids.length) return talk(['A diretoria fugiu antes da operação.']);
  const team = ids.map((id, i) => makeMon(id, Math.max(3, base + Math.round(3 * i / Math.max(1, ids.length - 1)))));
  await transition();
  const res = await battle({ team, boss: { name: owner.name || E.empresa, title: E.empresa, intro: E.intro || [] } });
  if (res !== 'win') { if (res === 'lose') await whiteout(); return; }
  st.wins++;
  if (E.lose) await say(`${owner.name}: "${E.lose}"`);
  sfx(523, 0.12); await sleep(130); sfx(784, 0.12); await sleep(130); sfx(1046, 0.3);
  if (first) {
    const v = E.caseValue || 1e9;
    G.recovered = (G.recovered || 0) + v;
    G.money += v;
    await say(`Dinheiro recuperado! ${fmtMoney(v)} voltaram para o Cofre Público.`);
    if (E.caseValueLabel) await say(`(Valor inspirado no caso real: ${E.caseValueLabel}.)`);
    await say('Com o cofre cheio, o almoxarifado da PF agradece. Combater a corrupção compensa!');
  } else {
    const m = 15000 * partyAvgLevel();
    G.money += m; G.recovered = (G.recovered || 0) + m;
    await say(`Treino concluído. Mais ${fmtMoney(m)} do caixa 2 da empresa foram para o Cofre Público.`);
  }
  saveGame();
  closeDlg();
}
