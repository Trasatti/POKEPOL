// POKÉPOL — viagem rápida no "jatinho do Vorcaro": pista em cada capital, menu de destinos
// (cidades já visitadas, como o "Voar" do Pokémon) e animação de decolagem, voo e pouso.

let JET_IMG = null;

// Pista (tile 16x16) e jato (48x32, 3x2 tiles), em pixel art.
function addTravelArt() {
  const [r, rx] = mkCanvas(16, 16);
  rx.fillStyle = '#5a5e66'; rx.fillRect(0, 0, 16, 16);
  rx.fillStyle = '#4c5058'; for (let i = 0; i < 10; i++) rx.fillRect((i * 7) % 16, (i * 5) % 16, 1, 1);
  rx.fillStyle = '#f2f2ea'; rx.fillRect(2, 7, 6, 2); rx.fillRect(11, 7, 3, 2);
  Tiles.runway = [r];

  const [c, x] = mkCanvas(48, 32);
  const R = (i, j, w, h, col) => { x.fillStyle = col; x.fillRect(i, j, w, h); };
  R(4, 14, 38, 8, '#f4f4f0');          // fuselagem
  R(2, 15, 3, 6, '#f4f4f0'); R(1, 16, 2, 4, '#e4e4e0'); // nariz
  R(42, 15, 4, 5, '#e8e8e4');          // cauda
  R(40, 4, 5, 11, '#f4f4f0'); R(41, 3, 4, 2, '#e8e8e4'); // leme vertical
  R(4, 19, 38, 3, '#d8d8d4');          // sombra da barriga
  R(4, 18, 38, 1, '#c8a040');          // faixa dourada
  for (let i = 9; i < 36; i += 4) R(i, 15, 2, 2, '#2a3a5a'); // janelas
  R(3, 15, 3, 2, '#2a3a5a');           // cabine
  R(16, 21, 14, 3, '#cfcfca'); R(18, 24, 10, 2, '#bdbdb8'); // asa
  R(34, 12, 6, 4, '#d8d8d4');          // turbina
  R(41, 6, 3, 2, '#c8a040');           // detalhe dourado no leme
  R(10, 26, 2, 3, '#333'); R(32, 26, 2, 3, '#333'); R(9, 29, 4, 2, '#222'); R(31, 29, 4, 2, '#222'); // trem de pouso
  R(14, 15, 3, 5, '#d0d0cc');          // porta
  outline(c);
  JET_IMG = c;
  for (const b of World.buildings || []) if (b.kind === 'jato') b.img = JET_IMG;
}

function markVisited() {
  const c = typeof cityAt === 'function' && cityAt(G.x, G.y);
  if (c) (G.visited = G.visited || {})[c.id] = true;
}

function airportSpot(id) {
  if (World.airports && World.airports[id]) return World.airports[id];
  const pf = (World.buildings || []).find(b => b.kind === 'pf' && b.city === id);
  if (pf && pf.door) return { x: pf.door.x, y: pf.door.y + 1 };
  const c = cityById(id);
  return c ? { x: c.x + (c.w >> 1), y: c.y + (c.h >> 1) } : startPos();
}

async function flyMenu(b) {
  markVisited();
  await say('Um jatinho particular, de portas abertas. Ninguém sabe de quem é.', { wait: false });
  const i = await choose(['ANDAR NO JATINHO DO VORCARO', 'DEIXAR PRA LÁ']);
  closeDlg();
  if (i !== 0) return;
  const here = b.city || (cityAt(G.x, G.y) || {}).id;
  const dest = (World.cities || []).filter(c => G.visited && G.visited[c.id] && c.id !== here);
  if (!dest.length) return talk(['Você ainda não visitou outra capital.', 'O jatinho só voa para cidades onde você já esteve.']);
  const k = await listScreen('PARA ONDE VOAR?', dest, c => `<span class="grow">${c.name}</span><span class="dim">${c.uf || ''}</span>`, { foot: 'Só aparecem as capitais que você já visitou.' });
  if (k < 0) return;
  await flyTo(dest[k]);
}

// Cena do voo, desenhada em 480x270 (área 16:9).
function drawCutscene() {
  const c = S.cut, t = performance.now() / 1000;
  const sky = ctx.createLinearGradient(0, 0, 0, SH);
  sky.addColorStop(0, '#5aa0e8'); sky.addColorStop(1, '#bfe2ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 9; i++) {
    const cx = ((i * 97 - t * (c.phase === 'cruise' ? 160 : 30)) % (SW + 120) + SW + 120) % (SW + 120) - 60, cy = 30 + (i * 53) % 150;
    ctx.beginPath(); ctx.ellipse(cx, cy, 34, 11, 0, 0, 7); ctx.ellipse(cx + 20, cy - 6, 22, 10, 0, 0, 7); ctx.fill();
  }
  if (c.phase !== 'cruise') {
    ctx.fillStyle = '#6aae4a'; ctx.fillRect(0, 222, SW, 48);
    ctx.fillStyle = '#5a5e66'; ctx.fillRect(0, 214, SW, 22);
    ctx.fillStyle = '#f2f2ea'; for (let i = 0; i < SW; i += 40) ctx.fillRect(i + ((c.dash || 0) % 40), 224, 22, 3);
  }
  ctx.save();
  // o desenho aponta para a esquerda; espelha para voar para a direita
  ctx.translate(c.x, c.y); ctx.rotate(c.rot || 0); ctx.scale(-1, 1);
  ctx.drawImage(JET_IMG, -72, -48, 144, 96);
  ctx.restore();
  ctx.fillStyle = 'rgba(14,28,72,.75)'; ctx.fillRect(0, 0, SW, 24);
  ctx.fillStyle = '#f4c430'; ctx.font = '800 13px Nunito, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(c.label || '', SW / 2, 16); ctx.textAlign = 'left';
}

async function flyTo(city) {
  const from = (cityAt(G.x, G.y) || {}).name || 'aqui';
  S.mode = 'cutscene';
  S.cut = { phase: 'takeoff', x: 120, y: 205, rot: 0, label: `Decolando de ${from}...` };
  sfx(140, 0.6, 'sawtooth', 0.03);
  await anim(1700, k => {
    S.cut.x = 120 + 260 * k * k; S.cut.dash = -k * 900;
    const lift = Math.max(0, (k - 0.45) / 0.55);
    S.cut.y = 205 - 230 * lift * lift; S.cut.rot = -0.35 * lift;
  });
  S.cut = { phase: 'cruise', x: SW / 2, y: SH / 2, rot: 0, label: `Voando para ${city.name}...` };
  await anim(1500, k => { S.cut.y = SH / 2 + Math.sin(k * Math.PI * 2) * 6; });
  S.cut = { phase: 'landing', x: -80, y: -40, rot: 0.3, label: `Pousando em ${city.name}` };
  sfx(120, 0.6, 'sawtooth', 0.03);
  await anim(1800, k => {
    const e = 1 - (1 - k) * (1 - k);
    S.cut.x = -80 + 300 * e; S.cut.y = -40 + 245 * Math.min(1, k * 1.25);
    S.cut.rot = 0.3 * (1 - Math.min(1, k * 1.4)); S.cut.dash = -e * 500;
  });
  const spot = airportSpot(city.id);
  G.x = spot.x; G.y = spot.y; G.dir = 'down'; S.moving = false;
  S.region = ''; S.mode = 'world';
  markVisited(); saveGame();
  showRegion();
  await reporterScene();
}

// Respostas do agente ao repórter (uma sorteada por pouso).
const JET_EXCUSES = [
  ['Vorcaro? Que Vorcaro?', 'Nunca ouvi falar desse cidadão.'],
  ['Dani? Não conheço nenhum Dani.', 'Conheço um Daniel... da padaria.'],
  ['Andei uma vez só.', 'E foi de olho fechado, então não vi de quem era.'],
  ['Eu achei que era Uber.', 'Uber Black Jato. Bem caro, inclusive.'],
  ['O avião estava ali parado, de porta aberta...', 'Seria falta de educação não entrar.'],
  ['Foi carona.', 'Carona não conta como voo, todo mundo sabe disso.'],
  ['Não sei de quem é esse avião.', 'Nem quero saber. Não me pergunte de novo.'],
  ['Voei a trabalho.', 'Não lembro qual trabalho. Nem de quem era o trabalho.'],
  ['Esse jatinho é de um amigo de um amigo...', '...de um primo de um conhecido. Mal conheço.'],
  ['Eu só embarquei porque tinha lanche de graça.', 'O pão de queijo estava ótimo, aliás.'],
  ['Tinha um nome escrito na porta, mas eu não li.', 'Estava sem óculos. Juro.'],
  ['Pergunte ao meu advogado.', 'Que também nunca andou nesse avião.'],
  // ecos de negativas reais e públicas (ver docs/frases-jatinho.md), ditas pelo agente como paródia
  ['Nunca entrei em avião do Vorcaro.', '...pelo menos não que eu me lembre agora.'],
  ['Fui só por causa da agenda.', 'De quem era o avião eu só fiquei sabendo depois.'],
  ['Não sabia quem era o Vorcaro.', 'Nem que ele estava no voo comigo.'],
  ['Ainda bem que o avião era de outra pessoa.', 'Se fosse de outra outra pessoa, aí sim seria um problema.'],
];
const REPORTER_ASK = ['De quem é esse avião, agente?', 'O senhor voou no jatinho do Vorcaro?', 'Quem pagou esse voo, agente?', 'Esse jato não é do Banco Master?'];

// Um repórter corre até o agente depois do pouso, pergunta do avião e vai embora.
async function reporterScene() {
  const look = { skin: '#d8a078', hair: '#5b3a24', shirt: '#e85030', pants: '#2a2a3a', cap: '#f4f4f4' };
  const start = [[3, 0], [-3, 0], [0, 3], [3, 1], [-3, 1]].map(([dx, dy]) => ({ x: G.x + dx, y: G.y + dy })).find(p => !isSolid(p.x, p.y)) || { x: G.x + 1, y: G.y };
  const rep = { id: 'reporter', x: start.x, y: start.y, dir: 'left', look, lines: [] };
  World.npcs.push(rep);
  const stepTo = async (tx, ty) => {
    for (let k = 0; k < 6 && (rep.x !== tx || rep.y !== ty); k++) {
      const dx = Math.sign(tx - rep.x), dy = dx ? 0 : Math.sign(ty - rep.y);
      rep.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if (rep.x + dx === G.x && rep.y + dy === G.y) break;
      rep.x += dx; rep.y += dy;
      await sleep(170);
    }
  };
  sfx(660, 0.05); await sleep(150); sfx(660, 0.05);
  await stepTo(G.x, G.y);
  G.dir = rep.x > G.x ? 'right' : rep.x < G.x ? 'left' : rep.y > G.y ? 'down' : 'up';
  const ex = pick(JET_EXCUSES);
  await say(`Repórter: "${pick(REPORTER_ASK)}"`);
  for (const l of ex) await say(`${G.name}: "${l}"`);
  await say(pick(['O repórter anota tudo e vai embora desconfiado.', 'O repórter balança a cabeça: "Sei..."', 'O repórter já está ao vivo: "Ele nega tudo!"']));
  closeDlg();
  await stepTo(start.x, start.y);
  World.npcs.splice(World.npcs.indexOf(rep), 1);
}
