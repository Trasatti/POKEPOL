// POKÉPOL — mapa-múndi: o Brasil inteiro, 27 capitais ligadas por rotas, na ordem da jornada.
// Tudo é gerado de forma determinística em buildWorld(); nada depende de art.js (exceto drawBuilding, opcional).

const MAP_W = 510, MAP_H = 510;
const SOLID = new Set(['tree', 'water', 'fence', 'sign', 'bld', 'pool']);
const START = { x: 0, y: 0, dir: 'up' };   // preenchido em buildWorld(): em frente à porta da PF de Curitiba

const BIOME_NAMES = { pampa: 'Pampa', mata_atlantica: 'Mata Atlântica', costa: 'Litoral', caatinga: 'Caatinga', amazonia: 'Amazônia', pantanal: 'Pantanal', cerrado: 'Cerrado' };

const World = { tiles: [], buildings: [], npcs: [], signs: {}, cities: [], areas: {}, areaGrid: [], biomeGrid: [], routes: [], landMask: null, airports: {} };
const _M = { routeGrid: null, boxGrid: null, doors: {}, cityList: [] };

// ---------------------------------------------------------------- dados das cidades
const _S = 12.4, _CF = Math.cos(15 * Math.PI / 180);   // tiles por grau de latitude; longitude reduzida por cos(15°)
const _px = lon => (lon + 74) * _S * _CF + 10, _py = lat => (5.4 - lat) * _S + 10;
const _lon = x => (x - 10) / (_S * _CF) - 74, _lat = y => 5.4 - (y - 10) / _S;

// id, nome, UF, "de/do/da Estado", lat, lon, x, y (canto do bloco, já relaxado), palácio, monumento, slogan, falas
const _CITIES = [
  ['curitiba', 'Curitiba', 'PR', 'do Paraná', -25.43, -49.27, 292, 382, 'Palácio Iguaçu', 'Jardim Botânico', 'Cidade Modelo: lagos, flores e muita burocracia.', [
    ['Aqui em Curitiba dá pra ver quatro estações num dia só.', 'Leve guarda-chuva, casaco e café.'],
    ['O Jardim Botânico é o cartão-postal da cidade.', 'Tire foto, mas não pise na grama!'],
    ['Curitiba virou ponto turístico de operação policial.', 'Tem até gente tirando selfie na frente da Superintendência.']]],
  ['florianopolis', 'Florianópolis', 'SC', 'de Santa Catarina', -27.6, -48.55, 302, 410, 'Palácio Cruz e Sousa', 'Ponte Hercílio Luz', 'A Ilha da Magia, com trânsito de ponte.', [
    ['A ponte Hercílio Luz ficou décadas fechada.', 'Mas processo de obra pública no Brasil dura mais ainda.'],
    ['Na Ilha tem 42 praias. Em nenhuma delas cabe a minha delação.'],
    ['Ostra fresquinha! Só não aceito pagamento em mala.']]],
  ['porto_alegre', 'Porto Alegre', 'RS', 'do Rio Grande do Sul', -30.03, -51.22, 270, 440, 'Palácio Piratini', 'Usina do Gasômetro', 'Chimarrão na mão e pôr do sol no Guaíba.', [
    ['Bah, tchê! O pôr do sol no Guaíba é o melhor do país.', 'Político que passa por aqui sempre pede uma cuia.'],
    ['Chimarrão não é bebida, é estilo de vida.', 'Quem recusa a cuia é suspeito.'],
    ['Dizem que churrasco resolve qualquer crise política.', 'Eu duvido, mas é uma boa desculpa.']]],
  ['sao_paulo', 'São Paulo', 'SP', 'de São Paulo', -23.55, -46.63, 324, 358, 'Palácio dos Bandeirantes', 'MASP', 'A maior cidade do país: concreto, café e trânsito.', [
    ['São Paulo não para! Nem o trânsito: ele também não anda.', 'Saí de casa terça e cheguei quinta.'],
    ['O vão livre do MASP é o melhor lugar pra manifestação.', 'E pra tirar foto, claro.'],
    ['Na Paulista tem de tudo: banco, livraria e político de paletó.', 'O paletó é emprestado.'],
    ['Aqui o pastel de feira é o único negócio sem superfaturamento.']]],
  ['rio_de_janeiro', 'Rio de Janeiro', 'RJ', 'do Rio de Janeiro', -22.9, -43.2, 364, 350, 'Palácio Guanabara', 'Cristo Redentor', 'Cidade Maravilhosa. O Guanabara é o palco da Operação Calicute.', [
    ['O Cristo Redentor de braços abertos já viu muita operação da PF.', 'Ele só observa. Nunca dá depoimento.'],
    ['Praia, samba e processo no TJ: o combo carioca.', 'Só não vale furar a fila do mate.'],
    ['No Rio, o Palácio Guanabara já virou ponto turístico de operação.', 'Se for lá, leve muito café.'],
    ['Biscoito Globo e mate gelado: o café da manhã do agente federal.']]],
  ['vitoria', 'Vitória', 'ES', 'do Espírito Santo', -20.3, -40.34, 400, 318, 'Palácio Anchieta', 'Convento da Penha', 'Moqueca capixaba (de dendê, não de delação).', [
    ['Moqueca capixaba é na panela de barro. Moqueca baiana é outra discussão.'],
    ['Subi a escadaria do Convento da Penha de joelhos. Rezei por um orçamento.'],
    ['Vitória é uma ilha! Mas não adianta se esconder aqui.']]],
  ['belo_horizonte', 'Belo Horizonte', 'MG', 'de Minas Gerais', -19.92, -43.94, 358, 314, 'Palácio da Liberdade', 'Igreja da Pampulha', 'Pão de queijo, boteco e muita desconfiança mineira.', [
    ['Uai, sô! Aqui em BH tem mais boteco que delegacia.', 'E tem muita delegacia!'],
    ['Mineiro não fala, sussurra. Política também.'],
    ['A Igreja da Pampulha é obra do Niemeyer.', 'Linda. Só não me pergunte sobre o orçamento da obra.']]],
  ['salvador', 'Salvador', 'BA', 'da Bahia', -12.97, -38.5, 420, 238, 'Palácio de Ondina', 'Elevador Lacerda', 'A primeira capital: acarajé, axé e Pelourinho.', [
    ['Acarajé quente, doutor! Quer com pimenta ou com malas?', 'Brincadeira... só pimenta.'],
    ['O Elevador Lacerda liga a cidade alta à baixa em segundos.', 'Mais rápido que processo no STF.'],
    ['Em Salvador a PF já achou dinheiro até em apartamento.', 'Cuidado onde você abre armário.'],
    ['Axé music e delação premiada: o carnaval baiano.']]],
  ['aracaju', 'Aracaju', 'SE', 'de Sergipe', -10.9, -37.07, 442, 216, 'Palácio Olímpio Campos', 'Passarela do Caranguejo', 'A capital do menor estado do país. Dá pra ir a pé!', [
    ['Sergipe é pequeno, mas o caranguejo é gigante.'],
    ['Aqui todo mundo se conhece. Inclusive os suspeitos.'],
    ['Na Orla de Atalaia o forró rola solto. Traga sanfona.']]],
  ['maceio', 'Maceió', 'AL', 'de Alagoas', -9.67, -35.74, 458, 192, 'Palácio República dos Palmares', 'Praia de Pajuçara', 'Águas verdes e piscinas naturais. A política é mais turva.', [
    ['As piscinas naturais de Pajuçara são cristalinas.', 'Já a política alagoana... bem, é outra história.'],
    ['Alagoas já teve presidente, e aqui ninguém esquece.'],
    ['Tapioca com coco e vista pro mar. Só falta o cafezinho da PF.']]],
  ['recife', 'Recife', 'PE', 'de Pernambuco', -8.05, -34.9, 468, 170, 'Palácio do Campo das Princesas', 'Marco Zero', 'A Veneza brasileira: pontes, frevo e muito caranguejo.', [
    ['O Marco Zero é onde o Recife começa. E o carnaval também.'],
    ['Tem mais ponte aqui que em qualquer lugar. Até pra delação.'],
    ['Frevo, maracatu e bolo de rolo: cultura é o que não falta.']]],
  ['joao_pessoa', 'João Pessoa', 'PB', 'da Paraíba', -7.12, -34.86, 468, 146, 'Palácio da Redenção', 'Farol do Cabo Branco', 'Aqui o sol nasce primeiro nas Américas.', [
    ['A Ponta do Seixas é o ponto mais oriental das Américas.', 'O sol nasce aqui antes de todo mundo.'],
    ['Cuscuz com carne de sol: café da manhã de campeão.'],
    ['João Pessoa é tão tranquila que até o político fica sem pressa.']]],
  ['natal', 'Natal', 'RN', 'do Rio Grande do Norte', -5.79, -35.2, 464, 124, 'Palácio Potengi', 'Forte dos Reis Magos', 'Dunas, camarão e a Cidade do Sol.', [
    ['As dunas de Genipabu são o parque de diversão do sertanejo.'],
    ['O Forte dos Reis Magos é mais antigo que qualquer processo.'],
    ['Aqui o sol brilha 300 dias por ano. Ótimo pra secar roupa e dinheiro... de pastel.']]],
  ['fortaleza', 'Fortaleza', 'CE', 'do Ceará', -3.73, -38.54, 422, 114, 'Palácio da Abolição', 'Theatro José de Alencar', 'Terra do sol, do humor e da tapioca.', [
    ['Fortaleza tem o povo mais engraçado do Brasil.', 'Nem a PF resiste a uma piada cearense.'],
    ['Na Beira-Mar o pôr do sol vale a viagem.'],
    ['Pega um baião de dois e deixa a conta com a minha emenda.']]],
  ['teresina', 'Teresina', 'PI', 'do Piauí', -5.09, -42.8, 370, 130, 'Palácio de Karnak', 'Ponte Estaiada', 'A cidade mais quente do Brasil. Prepare o ventilador.', [
    ['Teresina é tão quente que o asfalto vira sopa.', 'Aqui o ventilador é equipamento oficial.'],
    ['A Ponte Estaiada é bonita, mas é a única coisa de pé neste calor.'],
    ['Dizem que o rio Poti e o Parnaíba se encontram aqui.', 'É o único encontro sem reunião secreta.']]],
  ['sao_luis', 'São Luís', 'MA', 'do Maranhão', -2.53, -44.3, 352, 98, 'Palácio dos Leões', 'Centro Histórico', 'A Ilha do Amor, com azulejos e reggae.', [
    ['São Luís é a capital do reggae no Brasil!', 'Só falta o Bob Marley aparecer.'],
    ['Os azulejos do Centro Histórico são patrimônio da humanidade.'],
    ['Comi o cuxá e a torta de camarão. Agora preciso de uma cama.']]],
  ['belem', 'Belém', 'PA', 'do Pará', -1.46, -48.5, 304, 86, 'Palácio Lauro Sodré', 'Theatro da Paz', 'A porta da Amazônia: açaí, chuva às 15h e Círio.', [
    ['Em Belém, chove todo dia às três da tarde. Dá pra marcar hora!'],
    ['Açaí aqui é comida, com peixe frito e farinha. Nada de granola.'],
    ['O Ver-o-Peso é o maior mercado a céu aberto da América Latina.']]],
  ['macapa', 'Macapá', 'AP', 'do Amapá', 0.03, -51.07, 270, 66, 'Palácio do Setentrião', 'Marco Zero do Equador', 'A cidade cortada ao meio pela linha do Equador.', [
    ['Macapá é cortada ao meio pelo Equador.', 'Dá pra ter um pé em cada hemisfério!'],
    ['A Fortaleza de São José é a maior do país. Resistiu a tudo, menos ao calor.'],
    ['Aqui só se chega de avião ou de barco. Fuga de político é difícil.']]],
  ['boa_vista', 'Boa Vista', 'RR', 'de Roraima', 2.82, -60.67, 156, 32, 'Palácio Senador Hélio Campos', 'Monumento ao Garimpeiro', 'A única capital totalmente acima da linha do Equador.', [
    ['Boa Vista fica no hemisfério norte. Dá pra ver as estrelas de lá!'],
    ['O Monte Roraima é aqui do lado. Fica em cima de três países.'],
    ['Só tem uma estrada pra chegar aqui. Pra fugir também.']]],
  ['manaus', 'Manaus', 'AM', 'do Amazonas', -3.12, -60.02, 164, 106, 'Palácio Rio Negro', 'Teatro Amazonas', 'O Teatro de ópera no meio da floresta.', [
    ['O Teatro Amazonas foi construído no auge da borracha.', 'Dinheiro é o que não faltava... na época.'],
    ['Aqui o Rio Negro encontra o Solimões e não se mistura.', 'Parece comitê de campanha.'],
    ['Peixe frito, tucumã e calor úmido. Bem-vindo à Zona Franca!']]],
  ['porto_velho', 'Porto Velho', 'RO', 'de Rondônia', -8.76, -63.9, 118, 176, 'Palácio Presidente Vargas', 'Estrada de Ferro Madeira-Mamoré', 'A cidade da Ferrovia do Diabo.', [
    ['A Madeira-Mamoré foi chamada de Ferrovia do Diabo.', 'Muita gente morreu pra fazer essa linha.'],
    ['O Rio Madeira é enorme, e a barragem é maior ainda.'],
    ['Aqui a floresta começa na esquina. Leve repelente!']]],
  ['rio_branco', 'Rio Branco', 'AC', 'do Acre', -9.97, -67.8, 72, 190, 'Palácio Rio Branco', 'Gameleira', 'Capital do Acre. Dizem que o Acre não existe. Existe, sim!', [
    ['Dizem que o Acre não existe. Eu moro aqui e garanto: existe!'],
    ['A seringueira é nossa história. Chico Mendes é nosso orgulho.'],
    ['Aqui é o fim do mapa. Pra mim, o início de tudo.']]],
  ['cuiaba', 'Cuiabá', 'MT', 'de Mato Grosso', -15.6, -56.1, 212, 260, 'Palácio Paiaguás', 'Arena Pantanal', 'O centro geodésico da América do Sul.', [
    ['Cuiabá é o centro da América do Sul.', 'Daqui o caminho é longo pra qualquer lado.'],
    ['O Pantanal fica logo ali. Cuidado com a onça!'],
    ['Aqui o calor derrete até mandado de prisão.']]],
  ['campo_grande', 'Campo Grande', 'MS', 'de Mato Grosso do Sul', -20.45, -54.6, 230, 320, 'Palácio do Governo (Parque dos Poderes)', 'Bioparque Pantanal', 'A Cidade Morena, porta de entrada do Pantanal.', [
    ['Campo Grande tem o maior aquário de água doce do mundo!'],
    ['Sobá é prato típico. Veio do Japão, mas é de Campo Grande.'],
    ['Daqui sai a estrada pro Pantanal. Leve pernilongo... e coragem.']]],
  ['goiania', 'Goiânia', 'GO', 'de Goiás', -16.68, -49.25, 294, 284, 'Palácio das Esmeraldas', 'Monumento às Três Raças', 'A capital planejada do Cerrado, art déco e sertanejo.', [
    ['Goiânia é a capital do sertanejo universitário.', 'Daqui sai mais hit que mandado.'],
    ['Pequi com arroz é o prato do goiano. Ou ama, ou chora.'],
    ['Cidade planejada em art déco. Planejaram tudo, menos o trânsito.']]],
  ['palmas', 'Palmas', 'TO', 'do Tocantins', -10.18, -48.33, 304, 194, 'Palácio Araguaia', 'Praça dos Girassóis', 'A capital mais nova do Brasil, no coração do Cerrado.', [
    ['Palmas é a capital mais jovem do país. Ainda tá no cheiro de tinta!'],
    ['A Praça dos Girassóis é a maior praça cívica do mundo. Dizem.'],
    ['Do lado tem o lago e a Ilha do Canto. Lugar perfeito pra pescar.']]],
  ['brasilia', 'Brasília', 'DF', 'Federal', -15.78, -47.93, 300, 250, 'Palácio do Planalto', 'Catedral de Brasília', 'A capital federal: Esplanada, Congresso e Planalto.', [
    ['Bem-vindo a Brasília, agente. Aqui tudo é reto... menos os políticos.'],
    ['A Esplanada dos Ministérios tem tanto ministério que perdi a conta.'],
    ['Quem entra na Catedral sai com a alma lavada. Já o dinheiro...'],
    ['Cuidado: dizem que nas quadras do Plano Piloto o mato esconde mais gente do que parece.'],
    ['Quando os agentes passam, o Congresso inteiro fica quieto. Estranho.']]],
];
// tamanhos dos monumentos e nomes (de assets/landmarks/index.json): [w, h, monumento, palácio]
const _LM = {
  curitiba: [5, 5, "Jardim Botânico", "Palácio Iguaçu"],
  florianopolis: [6, 5, "Ponte Hercílio Luz", "Casa d'Agronômica"],
  porto_alegre: [5, 5, "Usina do Gasômetro", "Palácio Piratini"],
  sao_paulo: [6, 5, "MASP", "Palácio dos Bandeirantes"],
  rio_de_janeiro: [5, 5, "Cristo Redentor", "Palácio Guanabara"],
  vitoria: [5, 5, "Convento da Penha", "Palácio Anchieta"],
  belo_horizonte: [5, 5, "Igreja da Pampulha", "Palácio Tiradentes"],
  salvador: [5, 5, "Elevador Lacerda", "Centro Administrativo da Bahia"],
  aracaju: [6, 5, "Arcos da Orla de Atalaia", "Palácio de Despachos"],
  maceio: [5, 5, "Jangadas de Maceió", "Palácio República dos Palmares"],
  recife: [5, 5, "Marco Zero e Torre de Cristal", "Palácio do Campo das Princesas"],
  joao_pessoa: [5, 5, "Farol do Cabo Branco", "Palácio da Redenção"],
  natal: [5, 5, "Forte dos Reis Magos", "Governadoria"],
  fortaleza: [6, 5, "Ponte dos Ingleses", "Palácio da Abolição"],
  teresina: [6, 5, "Ponte Estaiada", "Palácio de Karnak"],
  sao_luis: [5, 5, "Casarões de Azulejos", "Palácio dos Leões"],
  belem: [6, 5, "Ver-o-Peso", "Palácio dos Despachos"],
  macapa: [5, 5, "Marco Zero do Equador", "Palácio do Setentrião"],
  boa_vista: [5, 5, "Monumento ao Garimpeiro", "Palácio Senador Hélio Campos"],
  manaus: [5, 5, "Teatro Amazonas", "Palácio Rio Negro"],
  porto_velho: [6, 5, "Três Caixas d'Água", "Palácio Rio Madeira"],
  rio_branco: [6, 5, "Passarela Joaquim Macêdo", "Palácio Rio Branco"],
  cuiaba: [5, 5, "Igreja do Bom Despacho", "Palácio Paiaguás"],
  campo_grande: [6, 5, "Morada dos Baís", "Parque dos Poderes"],
  goiania: [5, 5, "Monumento às Três Raças", "Palácio das Esmeraldas"],
  palmas: [5, 5, "Praça dos Girassóis", "Palácio Araguaia"],
  brasilia: [6, 6, "Catedral Metropolitana", ""],
};
const _slug = id => id.replace(/_/g, '');   // nomes dos PNGs em assets/landmarks/
const _BIG = new Set(['sao_paulo', 'rio_de_janeiro', 'salvador']);
const _SMALL = new Set(['aracaju', 'maceio', 'recife', 'joao_pessoa', 'natal']);
const _ROUTE_BR = ['BR-376', 'BR-101', 'BR-116', 'BR-116', 'BR-101', 'BR-262', 'BR-116', 'BR-101', 'BR-101', 'BR-101', 'BR-101', 'BR-101', 'BR-304', 'BR-222', 'BR-135', 'BR-316', 'BR-156', 'BR-210', 'BR-174', 'BR-319', 'BR-364', 'BR-364', 'BR-163', 'BR-060', 'BR-153', 'BR-010'];

// elenco por estado: [id, peso]
const _CAST = {
  PR: [['malaloures', 10]],
  SP: [['boiadeiro', 6], ['zambellina', 5], ['valdemensal', 6], ['mensaleiro', 5], ['temerario', 3], ['malufante', 3], ['friasdark', 6]],
  RJ: [['garotinho', 8], ['pezao', 7], ['witzel', 7], ['silveirao', 7], ['carluxo', 8], ['cabralzao', 1], ['cunhamon', 1], ['sacostenes', 5], ['jordyaluga', 5], ['ceperjao', 6], ['vazacellar', 5]],
  ES: [['dovalento', 10]],
  MG: [['janonudo', 8], ['azeredinho', 6], ['gravecio', 4]],
  BA: [['bunkerddel', 1]],
  AL: [['renanzilla', 5], ['confiscollor', 5]],
  CE: [['machadao', 10]],
  PI: [['ciromaster', 10]],
  MA: [['codevasfo', 8], ['maranhaozito', 6]],
  RR: [['jucazord', 10]],
  AM: [['respiralima', 10]],
  MS: [['delcidiao', 10]],
  GO: [['discalculayer', 10]],
  DF: [['abinzinho', 5], ['minutorres', 5], ['generalzao', 5], ['blitzvinei', 5], ['cidelator', 5], ['granadeiro', 5], ['emprestinho', 5]],
};
const _STARTERS_LATE = [['rachadinho', 1], ['lirassauro', 1], ['tarifardo', 1]];
const _NEIGH = {
  PR: 'SP SC MS', SC: 'PR RS SP', RS: 'SC PR', SP: 'PR RJ MG MS', RJ: 'SP MG ES', ES: 'RJ MG BA', MG: 'SP RJ ES BA GO', BA: 'SE AL PE PI MG ES GO TO',
  SE: 'BA AL', AL: 'SE PE BA', PE: 'AL PB CE PI BA', PB: 'PE RN CE', RN: 'PB CE', CE: 'RN PB PE PI', PI: 'CE MA PE BA TO', MA: 'PI TO PA',
  PA: 'MA AP AM TO MT RR', AP: 'PA', RR: 'AM PA', AM: 'RR PA RO AC MT', RO: 'AM MT AC', AC: 'AM RO', MT: 'RO AM PA TO GO MS', MS: 'MT GO SP PR MG',
  GO: 'MT MS MG TO BA DF', TO: 'GO MT PA MA PI BA', DF: 'GO MG',
};

// contorno do Brasil [lon, lat]: costa atlântica (Oiapoque -> Chuí) e depois a fronteira terrestre
// contorno do Brasil [lon, lat] (simplificado de IBGE/Natural Earth): costa atlântica (Oiapoque -> Chuí) e fronteira terrestre (Chuí -> Oiapoque)
const _COAST = [
  [-51.65,4.38],[-51.45,4.1],[-51.25,3.65],[-51.05,3.1],[-50.9,2.55],[-50.75,2.1],[-50.5,1.9],[-50.2,1.8],[-50.0,1.55],[-49.95,1.1],[-50.0,0.65],
  [-50.1,0.3],[-50.0,-0.05],[-49.6,-0.2],[-49.2,-0.1],[-48.6,-0.6],[-48.3,-0.75],[-47.9,-0.7],[-47.3,-0.6],[-46.75,-0.85],[-46.2,-1.0],[-45.6,-1.25],
  [-45.0,-1.5],[-44.7,-2.0],[-44.3,-2.45],[-43.6,-2.5],[-43.0,-2.45],[-42.5,-2.65],[-42.0,-2.75],[-41.4,-2.9],[-40.9,-2.9],[-40.3,-2.8],[-39.6,-3.0],
  [-39.0,-3.4],[-38.5,-3.72],[-38.1,-4.0],[-37.6,-4.5],[-37.2,-4.75],[-36.7,-4.95],[-36.0,-5.05],[-35.55,-5.2],[-35.3,-5.55],[-35.2,-5.9],[-35.1,-6.4],
  [-34.95,-6.9],[-34.82,-7.5],[-34.85,-8.05],[-34.95,-8.5],[-35.2,-9.0],[-35.5,-9.4],[-35.75,-9.7],[-36.1,-10.2],[-36.4,-10.5],[-36.9,-10.95],
  [-37.2,-11.2],[-37.5,-11.8],[-37.9,-12.4],[-38.3,-12.85],[-38.5,-13.0],[-38.75,-13.5],[-38.95,-14.2],[-39.05,-14.9],[-39.1,-15.6],[-39.05,-16.5],
  [-39.25,-17.3],[-39.6,-18.0],[-39.7,-18.8],[-39.65,-19.5],[-40.0,-19.95],[-40.3,-20.3],[-40.5,-20.9],[-41.0,-21.7],[-41.05,-22.0],[-41.6,-22.4],
  [-42.05,-22.9],[-42.8,-22.95],[-43.2,-22.95],[-43.8,-23.05],[-44.5,-23.3],[-45.1,-23.5],[-45.5,-23.8],[-46.3,-24.0],[-46.9,-24.4],[-47.7,-24.9],
  [-48.05,-25.1],[-48.45,-25.55],[-48.6,-26.1],[-48.65,-26.9],[-48.5,-27.6],[-48.6,-28.4],[-48.8,-28.6],[-49.2,-29.1],[-49.7,-29.4],[-50.2,-30.1],
  [-50.7,-31.0],[-51.2,-31.5],[-51.6,-31.8],[-52.1,-32.15],[-52.5,-32.7],[-53.0,-33.3],[-53.37,-33.74]];
const _BORDER = [
  [-53.5,-33.6],[-53.4,-33.1],[-53.2,-32.75],[-53.4,-32.57],[-53.8,-32.1],[-54.15,-31.87],[-54.6,-31.45],[-55.0,-31.25],[-55.53,-30.88],[-56.0,-30.6],
  [-56.45,-30.4],[-57.0,-30.15],[-57.6,-30.2],[-57.3,-29.9],[-57.08,-29.75],[-56.7,-29.35],[-56.55,-29.15],[-56.0,-28.65],[-55.5,-28.15],[-55.15,-27.9],
  [-54.7,-27.5],[-54.2,-27.2],[-53.85,-27.1],[-53.75,-26.7],[-53.6,-26.25],[-53.9,-25.95],[-54.2,-25.6],[-54.6,-25.58],[-54.6,-25.2],[-54.45,-24.6],
  [-54.3,-24.05],[-54.6,-24.0],[-55.0,-23.9],[-55.45,-23.9],[-55.5,-23.2],[-55.7,-22.2],[-56.2,-22.25],[-56.8,-22.3],[-57.55,-22.15],[-57.95,-22.1],
  [-57.9,-21.5],[-57.9,-20.9],[-57.95,-20.1],[-57.65,-19.1],[-58.15,-18.2],[-57.7,-17.6],[-57.55,-16.8],[-58.35,-16.3],[-59.2,-16.3],[-60.15,-16.3],
  [-60.25,-15.5],[-60.4,-14.45],[-61.0,-13.55],[-61.8,-13.4],[-62.7,-13.0],[-63.4,-12.6],[-64.4,-12.4],[-65.0,-11.7],[-65.3,-10.9],[-65.35,-9.8],
  [-66.5,-9.85],[-67.5,-10.35],[-68.75,-11.0],[-69.57,-10.95],[-70.6,-11.0],[-70.65,-9.9],[-71.5,-9.9],[-72.3,-9.5],[-73.2,-9.4],[-73.7,-9.2],
  [-73.95,-8.3],[-73.99,-7.54],[-73.4,-6.6],[-73.1,-6.3],[-72.4,-5.3],[-71.4,-4.5],[-70.3,-4.2],[-69.95,-4.25],[-69.6,-3.4],[-69.45,-2.2],[-69.4,-1.4],
  [-69.5,-1.05],[-70.05,-0.15],[-69.6,0.6],[-69.3,0.9],[-69.5,1.05],[-68.5,1.7],[-67.4,2.1],[-67.1,1.8],[-66.9,1.25],[-66.3,0.75],[-65.5,0.75],
  [-64.6,1.2],[-64.0,1.75],[-63.9,2.1],[-63.4,2.4],[-62.8,3.6],[-62.15,4.1],[-61.2,4.5],[-60.7,5.1],[-60.2,5.27],[-60.0,4.5],[-59.8,4.2],[-60.1,3.5],
  [-59.95,2.7],[-59.65,2.4],[-59.1,1.5],[-58.9,1.2],[-58.5,1.3],[-57.5,1.7],[-57.0,1.9],[-56.5,1.9],[-55.9,1.9],[-55.1,2.5],[-54.6,2.3],[-54.0,2.25],
  [-53.5,2.2],[-52.6,2.5],[-52.3,3.2],[-52.0,3.9],[-51.8,4.2]];

const _GENERIC = [
  ['Dizem que político some quando a PF chega.', 'Mas o cheiro de café da delegacia denuncia todo mundo.'],
  ['Cuidado no mato alto: tem político escondido!', 'Leve mandados, café e muita paciência.'],
  ['A Superintendência da PF cura sua equipe de graça.', 'Só não aceita delação sem advogado.'],
  ['Já viu mala de dinheiro andando sozinha?', 'Eu vi uma na rodoviária. Fugiu.'],
  ['Meu primo diz que político bom é o que está preso.', 'Eu prefiro o que está de tornozeleira.'],
];
const _LOOKS = {
  hair: ['#2a2220', '#5b3a24', '#8a4a24', '#dcdcdc', '#e8c860', '#8f8f8f', '#14141a'],
  shirt: ['#3a6ab0', '#d84848', '#e8e8f0', '#f4d030', '#5fb04a', '#8a6a4a', '#d9468f', '#e8743b'],
  pants: ['#2a2a3a', '#4a6a9a', '#4a3a2a', '#3a7ab0', '#5a5a64'],
};

// ---------------------------------------------------------------- utilidades
function _mrng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function _mh(i, j, s) {
  let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const _NZ = {};   // reticulados de ruído em cache (rápido): chave = escala*1000 + semente
function _mnoise(x, y, sc, s) {
  const key = sc * 1000 + s;
  let L = _NZ[key];
  if (!L) {
    const gw = Math.ceil(MAP_W / sc) + 3, gh = Math.ceil(MAP_H / sc) + 3, arr = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) arr[j * gw + i] = _mh(i, j, s);
    L = _NZ[key] = { arr, gw };
  }
  const gx = x / sc, gy = y / sc, i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, o = j * L.gw + i, A = L.arr;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const p = A[o], q = A[o + 1], r = A[o + L.gw], t = A[o + L.gw + 1];
  return p + (q - p) * u + (r - p) * v + (p - q - r + t) * u * v;
}
function _fillPoly(pts, W, H) {
  const m = new Uint8Array(W * H), n = pts.length;
  for (let y = 0; y < H; y++) {
    const yc = y + 0.5, xs = [];
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[(k + 1) % n];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.max(0, Math.ceil(xs[k] - 0.5)), x1 = Math.min(W - 1, Math.ceil(xs[k + 1] - 0.5) - 1);
      for (let x = x0; x <= x1; x++) m[y * W + x] = 1;
    }
  }
  return m;
}
function _dist(W, H, isSrc, cap) {
  const d = new Int16Array(W * H).fill(cap), q = new Int32Array(W * H);
  let qh = 0, qt = 0;
  for (let i = 0; i < W * H; i++) if (isSrc(i)) { d[i] = 0; q[qt++] = i; }
  while (qh < qt) {
    const i = q[qh++], x = i % W, y = (i / W) | 0, nd = d[i] + 1;
    if (nd >= cap) continue;
    if (x > 0 && d[i - 1] > nd) { d[i - 1] = nd; q[qt++] = i - 1; }
    if (x < W - 1 && d[i + 1] > nd) { d[i + 1] = nd; q[qt++] = i + 1; }
    if (y > 0 && d[i - W] > nd) { d[i - W] = nd; q[qt++] = i - W; }
    if (y < H - 1 && d[i + W] > nd) { d[i + W] = nd; q[qt++] = i + W; }
  }
  return d;
}
function _levelAt(pos) {
  const P = [[1, 2], [2, 5], [3, 8], [4, 11], [5, 14], [8, 20], [20, 30], [25, 40], [27, 42]];
  if (pos <= 1) return 2;
  for (let k = 1; k < P.length; k++) if (pos <= P[k][0]) { const a = P[k - 1], b = P[k]; return Math.round(a[1] + (b[1] - a[1]) * (pos - a[0]) / (b[0] - a[0])); }
  return 42;
}
function _biomeOf(lat, lon, ds) {
  if (ds <= 12) return 'costa';
  if (lon < -65 || (lon < -60 && lat > -14) || (lon < -56 && lat > -12) || (lon < -47.5 && lat > -8) || (lon < -44 && lat > -4.5)) return 'amazonia';
  if (lon > -59.2 && lon < -55.6 && lat < -16.2 && lat > -21.8) return 'pantanal';
  if (lat < -29.2) return 'pampa';
  if ((lat < -21.5 && lon > -54.5) || (ds <= 70 && lat < -8 && lon > -42.5) || (lon > -42.5 && lat < -14 && lat > -22)) return 'mata_atlantica';
  if (lat > -17.5 && lat < -3.5 && lon > -46 && lon < -35.5) return 'caatinga';
  return 'cerrado';
}
function _mkPool(ufs, extras) {
  const m = new Map();
  for (const uf of ufs) for (const [id, w] of (_CAST[uf] || [])) m.set(id, Math.max(m.get(id) || 0, w));
  for (const uf of ufs) for (const nb of (_NEIGH[uf] || '').split(' ')) for (const [id, w] of (_CAST[nb] || [])) {
    if (m.size >= 4) break;
    if (!m.has(id)) m.set(id, Math.max(1, Math.round(w / 2)));
  }
  for (const [id, w] of (extras || [])) m.set(id, Math.max(m.get(id) || 0, w));
  return [...m];
}

// ---------------------------------------------------------------- construção
function buildWorld() {
  const W = MAP_W, H = MAP_H, N = W * H;
  const R = _mrng(20260610);
  const tiles = [], areaGrid = [], biomeGrid = [];
  for (let y = 0; y < H; y++) { tiles.push(new Array(W).fill('grass')); areaGrid.push(new Array(W).fill(null)); biomeGrid.push(new Array(W).fill('cerrado')); }
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const rect = (x, y, w, h, k) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inb(i, j)) tiles[j][i] = k; };
  const set = (x, y, k) => { if (inb(x, y)) tiles[y][x] = k; };

  World.airports = {}; World.buildings = []; World.npcs = []; World.signs = {}; World.cities = []; World.areas = {}; World.routes = [];

  // --- cidades: caixas
  const cities = _CITIES.map((c, i) => {
    const id = c[0], bras = id === 'brasilia';
    const w = bras ? 46 : _BIG.has(id) ? 30 : _SMALL.has(id) ? 22 : 26, h = bras ? 26 : _BIG.has(id) ? 22 : _SMALL.has(id) ? 16 : 20;
    return { id, name: c[1], uf: c[2], de: c[3], lat: c[4], lon: c[5], x: c[6], y: c[7], w, h, order: i + 1, pal: (_LM[id] && _LM[id][3]) || c[8], mon: (_LM[id] && _LM[id][2]) || c[9], lmw: _LM[id] ? _LM[id][0] : 5, lmh: _LM[id] ? _LM[id][1] : 5, tag: c[10], lines: c[11], gy: bras ? 9 : 8, gy2: bras ? 9 : (h <= 16 ? 12 : 17), big: bras || _BIG.has(id) };
  });
  _M.cityList = cities;
  // portões: entrada (rota anterior) na linha da rua de cima, saída (rota seguinte) na rua de baixo.
  // Se rota anterior e seguinte ficariam do mesmo lado, a saída usa o lado oposto (a rota contorna a cidade) para as duas rotas nunca se cruzarem.
  cities.forEach((c, i) => {
    const cxm = c.x + c.w / 2, p = cities[i - 1], n = cities[i + 1];
    c.inRow = c.gy; c.outRow = c.gy2;
    c.inSide = p ? ((p.x + p.w / 2) <= cxm ? 'W' : 'E') : null;
    c.outSide = n ? ((n.x + n.w / 2) >= cxm ? 'E' : 'W') : null;
    if (c.inSide && c.outSide && c.inSide === c.outSide) c.outSide = c.outSide === 'E' ? 'W' : 'E';
  });
  const boxGrid = new Int8Array(N), blk = new Uint8Array(N), resv = new Uint8Array(N), land = new Uint8Array(N);

  // --- máscara de terra
  const poly = _COAST.map(p => [_px(p[0]), _py(p[1])]).concat(_BORDER.map(p => [_px(p[0]), _py(p[1])]));
  const polyMask = _fillPoly(poly, W, H);
  const cs = _COAST.map(p => [_px(p[0]), _py(p[1])]);
  const oceanPoly = _fillPoly(cs.concat([[cs[cs.length - 1][0], H + 5], [W + 5, H + 5], [W + 5, -5], [cs[0][0], -5]]), W, H);
  for (let i = 0; i < N; i++) land[i] = polyMask[i];
  const mark = (arr, c, m, v) => { for (let y = Math.max(0, c.y - m); y < Math.min(H, c.y + c.h + m); y++) for (let x = Math.max(0, c.x - m); x < Math.min(W, c.x + c.w + m); x++) arr[y * W + x] = v; };
  cities.forEach((c, i) => { mark(land, c, 7, 1); mark(resv, c, 5, 1); mark(blk, c, 2, 1); mark(boxGrid, c, 0, i + 1); });
  // faixa de terra ligando capitais consecutivas (a costa "estufa" onde as cidades foram deslocadas)
  for (let k = 0; k + 1 < cities.length; k++) {
    const A = cities[k], B = cities[k + 1], ax = A.x + A.w / 2, ay = A.y + A.h / 2, bx = B.x + B.w / 2, by = B.y + B.h / 2;
    const steps = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
    for (let t = 0; t <= steps; t++) {
      const cx0 = Math.round(ax + (bx - ax) * t / steps), cy0 = Math.round(ay + (by - ay) * t / steps);
      for (let y = cy0 - 4; y <= cy0 + 4; y++) for (let x = cx0 - 4; x <= cx0 + 4; x++) if (x > 0 && y > 0 && x < W - 1 && y < H - 1) land[y * W + x] = 1;
    }
  }
  const ocean = new Uint8Array(N);
  for (let i = 0; i < N; i++) ocean[i] = (!land[i] && oceanPoly[i]) ? 1 : 0;
  const dSea = _dist(W, H, i => ocean[i] === 1, 60);
  const dBorder = _dist(W, H, i => !land[i] && !ocean[i], 6);

  // --- terreno base por bioma
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!land[i]) { tiles[y][x] = ocean[i] ? 'water' : 'tree'; biomeGrid[y][x] = ocean[i] ? 'costa' : 'cerrado'; continue; }
    const ds = dSea[i], lat = _lat(y), lon = _lon(x), bio = _biomeOf(lat + (_mnoise(x, y, 9, 31) - 0.5) * 1.2, lon + (_mnoise(x, y, 9, 32) - 0.5) * 1.2, ds);   // fronteira entre biomas irregular (sem linha reta)
    biomeGrid[y][x] = bio;
    const r = R(), n1 = _mnoise(x, y, 7, 11), n2 = _mnoise(x, y, 26, 12);
    let t = 'grass';
    if (bio === 'costa') {
      if (ds <= 3) t = 'sand'; else if (ds <= 14 && n1 > 0.62) t = 'sand'; else if (r < 0.05) t = 'tree'; else if (r < 0.08) t = 'flower';
    } else if (bio === 'mata_atlantica') { t = n1 > 0.6 ? 'tree' : r < 0.04 ? 'tree' : r < 0.07 ? 'flower' : 'grass'; }
    else if (bio === 'pampa') { t = r < 0.012 ? 'tree' : r < 0.05 ? 'flower' : 'grass'; }
    else if (bio === 'cerrado') { t = (n1 > 0.74 || r < 0.035) ? 'tree' : r < 0.1 ? 'flower' : 'grass'; }
    else if (bio === 'caatinga') { t = n2 > 0.52 ? (r < 0.04 ? 'tree' : 'sand') : r < 0.035 ? 'tree' : r < 0.045 ? 'flower' : 'grass'; if (t === 'sand' && n1 > 0.7) t = 'grass'; }
    else if (bio === 'amazonia') {
      t = n1 > 0.5 ? 'tree' : (n2 > 0.66 ? 'tall' : 'grass');
      const rv1 = Math.abs(_mnoise(x, y, 54, 5) - 0.5), rv2 = Math.abs(_mnoise(x, y, 40, 6) - 0.5);
      if (rv1 < 0.017 || rv2 < 0.012 || _mnoise(x, y, 14, 8) > 0.84) t = 'water';
    } else if (bio === 'pantanal') {
      const pn = _mnoise(x, y, 16, 9);
      t = pn > 0.64 ? 'water' : (n1 > 0.5 && r < 0.9) ? 'tall' : r < 0.02 ? 'tree' : 'grass';
    }
    if (resv[i]) { if (t === 'tree' || t === 'water' || t === 'tall') t = 'grass'; if (bio === 'costa' && ds <= 2) t = 'sand'; }
    else if (dBorder[i] <= 3 && ds > 3) t = 'tree';
    tiles[y][x] = t;
  }

  // --- árvores em blocos 2x2 alinhados (o canto superior esquerdo decide)
  for (let by = 0; by < H; by += 2) for (let bx = 0; bx < W; bx += 2) {
    const isT = tiles[by][bx] === 'tree';
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const x = bx + dx, y = by + dy, i = y * W + x;
      if (!land[i]) continue;
      const t = tiles[y][x];
      if (isT) { if ((t === 'grass' || t === 'flower') && !resv[i]) tiles[y][x] = 'tree'; }
      else if (t === 'tree') tiles[y][x] = 'grass';
    }
  }
  const tree2 = (x, y) => {
    const bx = x & ~1, by = y & ~1;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { if (!inb(bx + i, by + j)) return; const t = tiles[by + j][bx + i]; if (t !== 'grass' && t !== 'flower') return; }
    rect(bx, by, 2, 2, 'tree');
  };

  // --- helpers de prédios / NPCs / placas
  const cityBy = {}; cities.forEach(c => { cityBy[c.id] = c; });
  const addB = (c, kind, id, x, y, w, h, label, extra) => {
    const b = Object.assign({ id, kind, x, y, w, h, label, city: c.id, uf: c.uf }, extra || {});
    World.buildings.push(b); rect(x, y, w, h, 'bld');
    b.door = (kind === 'landmark') ? null : { x: x + Math.floor(w / 2), y: y + h - 1 };
    return b;
  };
  const sign = (x, y, text) => { set(x, y, 'sign'); World.signs[x + ',' + y] = text; };
  const roofs = ['#c84848', '#4878c8', '#d8a838', '#58a858', '#a86ab8', '#e8743b', '#48a8b8', '#b8586a'];
  const walkT = new Set(['grass', 'flower', 'lawn']);

  function stampTown(c) {
    const ox = c.x, oy = c.y, w = c.w, h = c.h, bras = c.id === 'brasilia';
    const bio = _biomeOf(c.lat, c.lon, dSea[(oy + (h >> 1)) * W + ox + (w >> 1)]);
    // bioma uniforme na caixa + margem de 6 tiles: o anel de árvores e a borda da cidade não ficam com tons diferentes
    for (let y = Math.max(0, oy - 6); y < Math.min(H, oy + h + 6); y++) for (let x = Math.max(0, ox - 6); x < Math.min(W, ox + w + 6); x++) if (!boxGrid[y * W + x] || boxGrid[y * W + x] === c.order) biomeGrid[y][x] = bio === 'amazonia' || bio === 'costa' || bio === 'caatinga' || bio === 'pampa' || bio === 'pantanal' || bio === 'mata_atlantica' ? bio : 'cerrado';
    c.biome = biomeGrid[oy][ox];
    rect(ox - 2, oy - 2, w + 4, h + 4, 'grass');
    rect(ox, oy, w, h, bras ? 'lawn' : 'grass');
    // árvores esparsas em volta (só nos cantos e uns tufos a cada 10 tiles): a cidade fica aberta por todos os lados
    const tuft = (x, y) => rect(x, y, 2, 2, 'tree');
    tuft(ox - 2, oy - 2); tuft(ox + w, oy - 2); tuft(ox - 2, oy + h); tuft(ox + w, oy + h);
    for (let x = ox + 8; x < ox + w - 6; x += 10) { tuft(x, oy - 2); tuft(x, oy + h); }
    for (let y = oy + 8; y < oy + h - 6; y += 10) { tuft(ox - 2, y); tuft(ox + w, y); }
    const gy = oy + c.gy;
    const signTxt = bras ? `BRASÍLIA — Capital Federal\n${c.tag}` : `${c.name.toUpperCase()} — Capital ${c.de}\n${c.tag}`;
    if (!bras) {
      // ruas e conectores
      rect(ox, gy, w, 1, 'path');
      const small = h <= 16, yB = oy + 12, yC = small ? yB : oy + 17;
      rect(ox, yB, w, 1, 'path'); rect(ox, yC, w, 1, 'path');   // yC = portão de saída (rota seguinte)
      const nH = Math.floor((w - 8) / 8) + 1;
      const hx = k => ox + 2 + 8 * k;
      rect(ox + 1, gy, 1, yC - gy + 1, 'path'); rect(ox + w - 2, gy, 1, yC - gy + 1, 'path');
      for (let k = 0; k < nH - 1; k++) rect(hx(k) + 6, gy, 1, yB - gy + 1, 'path');
      // palácio, PF e monumento
      const small0 = h <= 16;   // cidades pequenas (w=22): desloca monumento e PF 1 tile para sobrar uma coluna livre entre os prédios
      const palX = ox + (w >> 1) - 3, pfX = ox + w - (small0 ? 7 : 8);
      rect(palX - 1, oy + 6, 8, 2, 'lawn');
      const pal = addB(c, 'palacio', c.id === 'rio_de_janeiro' ? 'guanabara' : c.id + '_palacio', palX, oy + 2, 6, 4, c.pal, { sprite: `assets/landmarks/${_slug(c.id)}_palacio.png` });
      const pf = addB(c, 'pf', c.id + '_pf', pfX, oy + 2, 6, 4, 'Superintendência da PF');
      const mon = addB(c, 'landmark', c.id + '_landmark', ox + (small0 ? 1 : 2), oy + 2, c.lmw, c.lmh, c.mon, { sprite: `assets/landmarks/${_slug(c.id)}.png` });
      rect(pal.door.x, oy + 6, 1, 2, 'path'); rect(pf.door.x, oy + 6, 1, 2, 'path');
      rect(ox + 2, oy + 7, 5, 1, 'flower');
      // casas: duas fileiras
      let sx = hx(1) - 1, ex = hx(nH - 1) - 2, sw = ex - sx + 1;
      if (small) { sx = ox + 3; sw = 10; }
      for (let k = 0; k < nH; k++) {
        const b = addB(c, 'casa', `${c.id}_casa${k + 1}`, hx(k), oy + 9, 4, 3, 'Casa', { roof: roofs[(c.order + k) % roofs.length] });
        set(b.door.x, b.door.y, 'bld');
        if (!small && k === 0) {
          const b2 = addB(c, 'casa', `${c.id}_casa${nH + k + 1}`, hx(k), oy + 14, 4, 3, 'Casa', { roof: roofs[(c.order + k + 3) % roofs.length] });
          for (let fx = hx(k) - 1; fx <= hx(k) + 4; fx++) if (fx !== ox + 1 && fx !== ox + w - 2) set(fx, oy + 13, 'fence');
        }
      }
      // praça central com fonte
      if (small) {
        rect(sx, oy + 13, sw, 3, 'lawn');
        rect(sx + (sw >> 1) - 1, oy + 14, 2, 2, 'pool');
        rect(sx, oy + 13, sw, 1, 'flower');
        for (let k = 0; k < sw; k += 3) set(sx + k, oy + 15, 'flower');
      } else {
        rect(sx, oy + 13, sw, 4, 'lawn');
        rect(sx + (sw >> 1) - 1, oy + 14, 2, 2, 'pool');
        rect(sx, oy + 13, sw, 1, 'flower'); rect(sx, oy + 16, sw, 1, 'flower');
        for (let k = 0; k < sw; k += 3) { set(sx + k, oy + 15, 'flower'); }
      }
      // pista de pouso + jatinho (lado direito da praça)
      {
        const rw = small ? 6 : 8, rx = small ? ox + w - 8 : ox + 17, ry = oy + 13;
        rect(rx, ry, rw, 3, 'runway');
        const jt = addB(c, 'jato', 'jato_' + c.id, rx + (small ? 1 : 2), ry, 3, 2, 'Jatinho particular', {});
        World.airports[c.id] = { x: jt.door.x, y: jt.door.y + 1 };
        if (!small) set(rx + 3, oy + 16, 'path');
      }
      // área de baixo
      if (h > 20) {
        rect(ox + 3, oy + 19, 7, 3, 'water'); rect(ox + 2, oy + 19, 1, 3, 'flower'); rect(ox + 10, oy + 19, 1, 3, 'flower');
        for (let k = 0; k < 7; k++) { const x = ox + 13 + ((R() * (w - 16)) | 0), y = oy + 19 + ((R() * 3) | 0); tree2(x, y); }
      }
      // decoração
      for (let k = 0; k < 40; k++) {
        const x = ox + 2 + ((R() * (w - 4)) | 0), y = oy + 1 + ((R() * (h - 2)) | 0);
        if (tiles[y][x] !== 'grass') continue;
        if (y < oy + 8 && y > oy + 1 && (x > ox + 1 && x < ox + w - 1)) { if (R() < 0.5) set(x, y, 'flower'); continue; }
        if (!small && (y === oy + 13 || y === yC + 1 || (y > oy + 17))) { if (R() < 0.3) tree2(x, y); else set(x, y, 'flower'); continue; }
        set(x, y, 'flower');
      }
      if (h === 20) { rect(ox + 3, oy + 18, w - 6, 2, 'tall'); for (let yy = oy + 18; yy < oy + 20; yy++) for (let xx = ox + 3; xx < ox + w - 3; xx++) areaGrid[yy][xx] = 'cidade_' + c.id; }   // mato alto dentro da cidade (treino antes do 1º portão)
      sign(ox + 1, gy - 1, signTxt); sign(ox + w - 2, gy - 1, signTxt);
      sign(pf.door.x - 2, oy + 7, `SUPERINTENDÊNCIA DA POLÍCIA FEDERAL — ${c.name}\nEntre pela porta para curar a equipe, comprar mandados e acessar a carceragem.`);
      sign(pal.door.x - 2, oy + 7, `${c.pal.toUpperCase()}\nSede do governo estadual — ${c.name}.`);
      c._sq = { sx, sw };
    } else {
      // ----- Brasília: Esplanada
      rect(ox + 1, oy + 1, w - 2, h - 2, 'lawn');
      rect(ox, gy, w, 1, 'path');
      const cong = addB(c, 'congresso', 'congresso', ox + 3, oy + 2, 12, 6, 'Congresso Nacional', {});
      const plan = addB(c, 'planalto', 'planalto', ox + 31, oy + 2, 12, 5, 'Palácio do Planalto', {});
      rect(ox + 17, oy + 2, 4, 6, 'pool'); rect(ox + 26, oy + 2, 4, 6, 'pool');
      rect(ox + 17, oy + 8, 4, 1, 'flower'); rect(ox + 26, oy + 8, 4, 1, 'flower');
      rect(ox + 22, oy + 2, 3, 7, 'path');
      rect(cong.door.x, cong.door.y + 1, 1, 1, 'path'); rect(plan.door.x, plan.door.y + 1, 1, 3, 'path');
      const yB = oy + 17;
      rect(ox + 1, yB, w - 2, 1, 'path');
      for (const cxx of [4, 16, 30, 43]) rect(ox + cxx, gy, 1, yB - gy + 1, 'path');
      const pf = addB(c, 'pf', 'brasilia_pf', ox + 6, oy + 13, 6, 4, 'Superintendência da PF');
      const cat = addB(c, 'landmark', 'brasilia_landmark', ox + 22, oy + 11, c.lmw, c.lmh, c.mon, { sprite: 'assets/landmarks/brasilia.png' });
      const c1 = addB(c, 'casa', 'brasilia_casa1', ox + 33, oy + 14, 4, 3, 'Casa', { roof: roofs[1] });
      const c2 = addB(c, 'casa', 'brasilia_casa2', ox + 38, oy + 14, 4, 3, 'Casa', { roof: roofs[4] });
      rect(ox + 2, oy + 19, 12, 5, 'tall'); rect(ox + 32, oy + 19, 12, 5, 'tall');
      rect(ox + 17, oy + 19, 12, 2, 'flower'); rect(ox + 17, oy + 22, 12, 1, 'flower');
      for (let k = 0; k < 14; k++) { const x = ox + 2 + ((R() * 42) | 0), y = oy + 10 + ((R() * 7) | 0); if (tiles[y][x] === 'lawn') set(x, y, 'flower'); }
      rect(ox + 19, oy + 19, 8, 3, 'runway');
      { const jt = addB(c, 'jato', 'jato_brasilia', ox + 21, oy + 19, 3, 2, 'Jatinho particular', {}); World.airports.brasilia = { x: jt.door.x, y: jt.door.y + 1 }; }
      for (let y = oy + 19; y < oy + 24; y++) for (let x = ox + 2; x < ox + 44; x++) if (tiles[y][x] === 'tall') areaGrid[y][x] = 'cidade_brasilia';
      sign(ox + 1, gy - 1, signTxt); sign(ox + w - 2, gy - 1, signTxt);
      sign(ox + 20, oy + 9 + 1, 'ESPLANADA DOS MINISTÉRIOS — Brasília\nCongresso: Operação Lava Jato\nPlanalto: Operação Tempus Veritatis');
      sign(pf.door.x - 2, yB + 1, 'SUPERINTENDÊNCIA DA POLÍCIA FEDERAL — Brasília\nEntre pela porta para curar a equipe, comprar mandados e acessar a carceragem.');
    }
    c.gate = { W: { x: ox, y: gy }, E: { x: ox + w - 1, y: gy } };
    // NPCs
    const cand = bras ? [[ox + 13, oy + 10], [ox + 19, oy + 10], [ox + 28, oy + 10], [ox + 33, oy + 10], [ox + 20, oy + 18 + 1], [ox + 15, oy + 12], [ox + 32, oy + 12]]
      : [[ox + 8, oy + 6], [c._sq.sx + 1, oy + 14], [c._sq.sx + c._sq.sw - 2, oy + 15], [ox + w - 3, oy + 10], [ox + 4, oy + 18], [ox + w - 6, oy + 18], [ox + 7, oy + 10]];
    const want = bras ? 5 : c.big ? 4 : 3;
    const sets = c.lines.slice();
    let gi = (c.order * 3) % _GENERIC.length;
    while (sets.length < want) sets.push(_GENERIC[gi++ % _GENERIC.length]);
    let placed = 0;
    for (const [nx, ny] of cand) {
      if (placed >= want) break;
      if (!inb(nx, ny) || !walkT.has(tiles[ny][nx])) continue;
      const lk = { hair: _LOOKS.hair[(R() * 7) | 0], shirt: _LOOKS.shirt[(R() * 8) | 0], pants: _LOOKS.pants[(R() * 5) | 0] };
      if (R() < 0.25) lk.cap = R() < 0.5 ? '#f4f4f4' : '#d84848';
      World.npcs.push({ x: nx, y: ny, dir: ['down', 'left', 'right', 'up'][(R() * 4) | 0], look: lk, lines: sets[placed], city: c.id });
      placed++;
    }
    if (bras) {
      const g = { x: ox + 37, y: oy + 7, dir: 'down', id: 'guard', city: c.id, look: { hair: '#2a2220', shirt: '#1a1a22', pants: '#2e2e3a', cap: '#14141a', capMark: '#f4c430', stripe: '#f4c430' }, lines: ['Acesso restrito ao Planalto.', 'Só entra quem já concluiu duas operações.'] };
      World.npcs.push(g);
    }
  }
  cities.forEach(stampTown);

  // --- áreas (encontros)
  const areas = World.areas;
  const hiOf = (lo, pos) => lo + 3 + Math.round(pos / 8);
  const cityArea = {};
  cities.forEach(c => {
    const id = 'cidade_' + c.id, bras = c.id === 'brasilia';
    const lo = bras ? 42 : _levelAt(c.order), hi = bras ? 50 : hiOf(lo, c.order);
    areas[id] = { name: bras ? 'Esplanada dos Ministérios' : `Arredores de ${c.name}`, levels: [lo, hi], uf: [c.uf], kind: 'cidade', city: c.id, pool: _mkPool([c.uf], c.order >= 24 ? _STARTERS_LATE : (bras ? _STARTERS_LATE.concat([['valdemensal', 3], ['ciromaster', 3], ['renanzilla', 3]]) : [])) };
    cityArea[c.id] = id;
  });
  areas.cidade_brasilia.pool = _mkPool(['DF'], _STARTERS_LATE.concat([['valdemensal', 3], ['ciromaster', 3], ['renanzilla', 3], ['lirassauro', 1]]));
  const routes = [];
  for (let k = 1; k <= 26; k++) {
    const a = cities[k - 1], b = cities[k], id = 'rota_' + k, pos = k + 0.5;
    const lo = _levelAt(pos), hi = hiOf(lo, pos);
    const extras = k >= 24 ? _CAST.DF.map(([i, w]) => [i, Math.max(1, Math.round(w / 2))]).concat(_STARTERS_LATE) : [];
    areas[id] = { name: `Rota ${_ROUTE_BR[k - 1]} (${a.name}–${b.name})`, levels: [lo, hi], uf: [a.uf, b.uf], kind: 'rota', pool: _mkPool([a.uf, b.uf], extras) };
    routes.push({ id, k, br: _ROUTE_BR[k - 1], a, b, cells: [] });
  }
  areas.cidade_brasilia.name = 'Esplanada dos Ministérios';

  // --- rotas: A* de portão a portão
  const noise = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) noise[y * W + x] = _mnoise(x, y, 8, 77) * 1.4 + _mnoise(x, y, 3, 78) * 0.5;
  const avoid = new Int8Array(N), near = new Uint8Array(N), rblock = new Uint8Array(N);
  cities.forEach((c, i) => mark(avoid, c, 14, i + 1));
  let curA = -1, curB = -1;
  const G = new Float32Array(N), PAR = new Int32Array(N), STAMP = new Int32Array(N);
  let stamp = 0;
  function astar(sx, sy, tx, ty) {
    stamp++;
    const heap = [];            // [f, idx]
    const push = (f, i) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { let l = 2 * c + 1, r = l + 1, m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
    const si = sy * W + sx, ti = ty * W + tx;
    STAMP[si] = stamp; G[si] = 0; PAR[si] = -1; push(Math.abs(sx - tx) + Math.abs(sy - ty), si);
    const closed = new Uint8Array(N);
    while (heap.length) {
      const [, i] = pop();
      if (closed[i]) continue; closed[i] = 1;
      if (i === ti) { const out = []; for (let c = i; c !== -1; c = PAR[c]) out.push([c % W, (c / W) | 0]); return out.reverse(); }
      const x = i % W, y = (i / W) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue;
        const j = ny * W + nx;
        if (closed[j] || !land[j] || blk[j]) continue;
        if (rblock[j] && !((Math.abs(nx - sx) <= 9 && Math.abs(ny - sy) <= 9) || (Math.abs(nx - tx) <= 9 && Math.abs(ny - ty) <= 9))) continue;   // rotas nunca se cruzam
        const t = tiles[ny][nx];
        let c = 1 + noise[j];
        if (t === 'tree') c += 2.5; else if (t === 'water') c += 7; else if (t === 'path') c += 14;   // rotas não se fundem
        const av = avoid[j]; if (av && av - 1 !== curA && av - 1 !== curB) c += 40;                   // nem passam colado nos portões de outras cidades
        if (near[j]) c += 6;
        if (dBorder[j] <= 3) c += 12;
        const g = G[i] + c;
        if (STAMP[j] !== stamp || g < G[j]) { STAMP[j] = stamp; G[j] = g; PAR[j] = i; push(g + Math.abs(nx - tx) + Math.abs(ny - ty), j); }
      }
    }
    return null;
  }
  const ringM = new Uint8Array(N);
  cities.forEach(c => { for (let y = c.y - 2; y < c.y + c.h + 2; y++) for (let x = c.x - 2; x < c.x + c.w + 2; x++) if (inb(x, y) && !boxGrid[y * W + x]) ringM[y * W + x] = 1; });
  let carveRing = false;
  const carveCell = (x, y) => { if (!inb(x, y) || ocean[y * W + x] || boxGrid[y * W + x] || (ringM[y * W + x] && !carveRing)) return; if (tiles[y][x] !== 'bld') tiles[y][x] = 'path'; };
  const brush = (x, y) => { carveCell(x, y); carveCell(x + 1, y); carveCell(x, y + 1); carveCell(x + 1, y + 1); };
  function carveLine(x0, y0, x1, y1, wide) {
    let x = x0, y = y0; (wide ? brush : carveCell)(x, y);
    while (x !== x1 || y !== y1) {
      if (Math.abs(x1 - x) >= Math.abs(y1 - y)) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
      (wide ? brush : carveCell)(x, y);
    }
  }
  for (const r of routes) {
    const a = r.a, b = r.b, ac = a.x + a.w / 2, bc = b.x + b.w / 2;
    const sideA = a.outSide, sideB = b.inSide;
    const sx = sideA === 'E' ? a.x + a.w + 3 : a.x - 4, sy = a.y + a.outRow;
    const tx = sideB === 'E' ? b.x + b.w + 3 : b.x - 4, ty = b.y + b.inRow;
    curA = a.order - 1; curB = b.order - 1;
    let cells = astar(sx, sy, tx, ty); r.fb = !cells;
    if (!cells) { cells = []; let x = sx, y = sy; while (x !== tx || y !== ty) { cells.push([x, y]); if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y); } cells.push([tx, ty]); }
    r.cells = cells;
    for (const [x, y] of cells) { brush(x, y); for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const xx = x + dx, yy = y + dy; if (inb(xx, yy)) near[yy * W + xx] = 1; } for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const xx = x + dx, yy = y + dy; if (inb(xx, yy)) rblock[yy * W + xx] = 1; } }
    // extensão até o portão
    r.ext = [];
    for (let x = Math.min(sideA === 'E' ? a.x + a.w - 1 : a.x, sx); x <= Math.max(sideA === 'E' ? a.x + a.w - 1 : a.x, sx); x++) r.ext.push([x, sy]);
    for (let x = Math.min(sideB === 'E' ? b.x + b.w - 1 : b.x, tx); x <= Math.max(sideB === 'E' ? b.x + b.w - 1 : b.x, tx); x++) r.ext.push([x, ty]);
    for (const [x, y] of r.ext) for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const xx = x + dx, yy = y + dy; if (inb(xx, yy)) rblock[yy * W + xx] = 1; }
    carveRing = true;
    carveLine(sideA === 'E' ? a.x + a.w - 1 : a.x, sy, sx, sy, false);
    carveLine(sideB === 'E' ? b.x + b.w - 1 : b.x, ty, tx, ty, false);
    carveRing = false;
    r.sideA = sideA; r.sideB = sideB;
    World.routes.push({ id: r.id, k: r.k, br: r.br, from: a.id, to: b.id, length: cells.length, fallback: r.fb });
  }

  // --- mapa de distâncias às rotas (para região / área)
  const routeGrid = new Int8Array(N).fill(-1);
  {
    const q = new Int32Array(N); let qh = 0, qt = 0;
    routes.forEach((r, ri) => { for (const [x, y] of r.cells.concat(r.ext)) { const i = y * W + x; if (routeGrid[i] < 0) { routeGrid[i] = ri; q[qt++] = i; } } });
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0, v = routeGrid[i];
      if (x > 0 && routeGrid[i - 1] < 0) { routeGrid[i - 1] = v; q[qt++] = i - 1; }
      if (x < W - 1 && routeGrid[i + 1] < 0) { routeGrid[i + 1] = v; q[qt++] = i + 1; }
      if (y > 0 && routeGrid[i - W] < 0) { routeGrid[i - W] = v; q[qt++] = i - W; }
      if (y < H - 1 && routeGrid[i + W] < 0) { routeGrid[i + W] = v; q[qt++] = i + W; }
    }
  }
  _M.routeGrid = routeGrid; _M.boxGrid = boxGrid; _M.routeList = routes;

  // --- paredes de árvores entre as regiões de cada rota: o país vira uma corrente cidade -> rota -> cidade,
  //     e a única passagem de uma rota para a seguinte é atravessar a cidade (portão de saída guardado pela PF)
  const wall = new Uint8Array(N);
  {
    const rid = (bx, by) => (bx < 0 || by < 0 || bx >= W || by >= H) ? -2 : routeGrid[by * W + bx];
    const busy = (bx, by) => {
      if (bx < 0 || by < 0 || bx >= W || by >= H) return true;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const t = tiles[by + j][bx + i]; if (t === 'path' || t === 'bld' || t === 'sign' || boxGrid[(by + j) * W + bx + i]) return true; }
      return false;
    };
    const mk = [];
    for (let by = 0; by < H; by += 2) for (let bx = 0; bx < W; bx += 2) {
      const id = rid(bx, by); if (id < 0 || busy(bx, by)) continue;
      let hi = false;
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const n = rid(bx + dx, by + dy); if (n >= 0 && n !== id && (id > n || busy(bx + dx, by + dy))) hi = true; }
      if (hi) mk.push([bx, by]);
    }
    for (const [bx, by] of mk) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const k = (by + j) * W + bx + i; if (!land[k] || ocean[k]) continue; tiles[by + j][bx + i] = 'tree'; wall[k] = 1; }
    // vedação final: onde duas regiões ainda se tocam (corredores muito próximos), uma cerca de 1 tile fecha a fresta
    let seals = 0;
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
      const i = y * W + x;
      if (boxGrid[i] || SOLID.has(tiles[y][x]) || routeGrid[i] < 0) continue;
      for (const j of [i + 1, i + W]) {
        const nx = j % W, ny = (j / W) | 0;
        if (boxGrid[j] || SOLID.has(tiles[ny][nx]) || routeGrid[j] < 0 || routeGrid[j] === routeGrid[i]) continue;
        if (tiles[y][x] !== 'path') { tiles[y][x] = 'fence'; wall[i] = 1; seals++; break; }
        if (tiles[ny][nx] !== 'path') { tiles[ny][nx] = 'fence'; wall[j] = 1; seals++; }
      }
    }
    _M.seals = seals;
  }

  // --- mato alto: manchas ao longo das rotas
  const nearCity = (x, y, m) => {
    for (const c of cities) { const dx = Math.max(c.x - x, 0, x - (c.x + c.w - 1)), dy = Math.max(c.y - y, 0, y - (c.y + c.h - 1)); if (dx <= m && dy <= m) return c; }
    return null;
  };
  const tallOK = new Set(['grass', 'flower', 'tree']);
  function blob(cx, cy, rx, ry, area) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      if (!inb(x, y)) continue;
      const i = y * W + x;
      if (resv[i] || !land[i] || wall[i]) continue;
      const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2, th = 1 + (_mh(x, y, 91) - 0.5) * 0.7;
      if (e < th && tallOK.has(tiles[y][x])) { tiles[y][x] = 'tall'; areaGrid[y][x] = area; }
    }
  }
  routes.forEach((r, ri) => {
    const cells = r.cells, n = cells.length;
    for (let i = 4; i < n - 4; i += 1 + ((R() * 2) | 0)) {
      const p = cells[i], q0 = cells[Math.max(0, i - 3)], q1 = cells[Math.min(n - 1, i + 3)];
      let dx = q1[0] - q0[0], dy = q1[1] - q0[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      const px = -dy, py = dx, bio = biomeGrid[p[1]][p[0]], big = (bio === 'amazonia' || bio === 'pantanal') ? 1.4 : 1;
      for (const side of [1, -1]) {
        if (R() > 0.9) continue;
        const off = 3 + R() * 7, cx = p[0] + px * off * side, cy = p[1] + py * off * side;
        const near = nearCity(cx, cy, 6);
        blob(cx, cy, (4 + R() * 4.5) * big, (3.5 + R() * 4) * big, near ? 'cidade_' + near.id : r.id);
      }
      if (i % 7 < 2) {  // campo grande
        const side = R() < 0.5 ? 1 : -1, off = 8 + R() * 6, cx = p[0] + px * off * side, cy = p[1] + py * off * side, near = nearCity(cx, cy, 6);
        blob(cx, cy, (7 + R() * 4) * big, (6 + R() * 4) * big, near ? 'cidade_' + near.id : r.id);
      }
    }
  });

  // --- trechos de mato alto cobrindo o próprio caminho (como a Rota 1 de Kanto)
  routes.forEach(r => {
    const cells = r.cells, n = cells.length;
    let i = 10 + ((R() * 10) | 0);
    while (i < n - 12) {
      const len = 9 + ((R() * 10) | 0);
      for (let k = i; k < Math.min(n - 12, i + len); k++) {
        const [x, y] = cells[k], near = nearCity(x, y, 6), area = near ? 'cidade_' + near.id : r.id;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [2, 0], [0, -1], [0, 2], [-1, 1], [2, 1]]) {
          const xx = x + dx, yy = y + dy;
          if (!inb(xx, yy)) continue;
          const j = yy * W + xx, t = tiles[yy][xx];
          if (resv[j] || !land[j] || wall[j] || boxGrid[j]) continue;
          if (t === 'path' || t === 'grass' || t === 'flower' || t === 'tree') { tiles[yy][xx] = 'tall'; areaGrid[yy][xx] = area; }
        }
      }
      i += len + 2 + ((R() * 6) | 0);
    }
  });

  // --- trilhas opcionais (áreas laterais)
  const SIDE_NAMES = { pampa: 'Coxilha', mata_atlantica: 'Trilha da Mata Atlântica', caatinga: 'Baixio da Caatinga', amazonia: 'Igarapé da Amazônia', pantanal: 'Baía Alagada do Pantanal', cerrado: 'Chapada do Cerrado', costa: 'Restinga' };
  let sideN = 0;
  routes.forEach((r, ri) => {
    const cells = r.cells, n = cells.length, count = n > 80 ? 2 : 1;
    for (let s = 0; s < count; s++) {
      for (let attempt = 0; attempt < 250; attempt++) {
        const i = 12 + ((R() * Math.max(1, n - 24)) | 0), p = cells[i];
        if (!p) break;
        const q0 = cells[Math.max(0, i - 3)], q1 = cells[Math.min(n - 1, i + 3)];
        let dx = q1[0] - q0[0], dy = q1[1] - q0[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
        const side = R() < 0.5 ? 1 : -1, dist = 13 + R() * 8, cx = Math.round(p[0] - dy * dist * side), cy = Math.round(p[1] + dx * dist * side), RR = 7.5;
        let ok = true, wet = 0, tot = 0;
        for (let y = Math.floor(cy - RR - 1); y <= cy + RR + 1 && ok; y++) for (let x = Math.floor(cx - RR - 1); x <= cx + RR + 1; x++) {
          if (Math.hypot(x - cx, y - cy) > RR + 1.5) continue;
          if (!inb(x, y) || !land[y * W + x] || resv[y * W + x] || dBorder[y * W + x] <= 4 || tiles[y][x] === 'path' || tiles[y][x] === 'sign' || wall[y * W + x] || routeGrid[y * W + x] !== routeGrid[p[1] * W + p[0]]) { ok = false; break; }
          if (tiles[y][x] === 'water') wet++; tot++;
        }
        if (!ok || wet > tot * 0.1) continue;
        const bio = biomeGrid[cy][cx], aid = `trilha_${++sideN}`;
        const base = areas[r.id], nm = `${SIDE_NAMES[bio] || 'Trilha'} (${r.br})`;
        areas[aid] = { name: nm, levels: [base.levels[0] + 2, base.levels[1] + 3], uf: base.uf, kind: 'trilha', pool: base.pool.slice() };
        for (let y = Math.floor(cy - RR - 2); y <= cy + RR + 2; y++) for (let x = Math.floor(cx - RR - 2); x <= cx + RR + 2; x++) {
          const d = Math.hypot(x - cx, y - cy), dc = Math.hypot((x & ~1) + 1 - cx, (y & ~1) + 1 - cy);
          if (dc > RR + 1.5 || !inb(x, y)) continue;
          if (dc > 6.2) { tiles[y][x] = 'tree'; areaGrid[y][x] = null; }
          else { const rv = R(); tiles[y][x] = rv < 0.86 ? 'tall' : rv < 0.93 ? 'flower' : 'grass'; areaGrid[y][x] = tiles[y][x] === 'tall' ? aid : null; }
          biomeGrid[y][x] = bio;
        }
        // trilha estreita até a rota
        const sx0 = Math.round(cx + dy * 3 * side), sy0 = Math.round(cy - dx * 3 * side);
        carveLine(p[0] + (dy > 0 ? -1 : 2) * 0 + 0, p[1], sx0, sy0, false);
        carveLine(p[0], p[1], sx0, sy0, false);
        // placa na entrada da trilha, ao lado do caminho principal
        for (const [ox2, oy2] of [[-1, -1], [2, -1], [-1, 2], [2, 2]]) {
          const sx2 = p[0] + ox2, sy2 = p[1] + oy2;
          if (inb(sx2, sy2) && (tiles[sy2][sx2] === 'grass' || tiles[sy2][sx2] === 'flower')) { sign(sx2, sy2, `${nm.toUpperCase()}\nTrilha opcional: muito mato alto, políticos mais fortes à espreita.`); break; }
        }
        break;
      }
    }
  });

  // --- placas de rota
  for (const r of routes) {
    const cells = r.cells, n = cells.length;
    const text = (from, to) => `ROTA ${r.br} — ${from.name} → ${to.name}\nCuidado: políticos escondidos no mato alto! (${BIOME_NAMES[biomeGrid[cells[(n / 2) | 0][1]][cells[(n / 2) | 0][0]]]})`;
    for (const [idx, txt] of [[7, text(r.a, r.b)], [(n / 2) | 0, text(r.a, r.b)], [n - 8, `ROTA ${r.br} — chegando a ${r.b.name}\nA Superintendência da PF fica logo adiante.`]]) {
      const p = cells[Math.max(0, Math.min(n - 1, idx))];
      for (const [ox2, oy2] of [[-1, -1], [2, -1], [-1, 2], [2, 2], [-2, 0], [3, 0], [0, -2], [0, 3]]) {
        const sx2 = p[0] + ox2, sy2 = p[1] + oy2;
        if (inb(sx2, sy2) && !resv[sy2 * W + sx2] && (tiles[sy2][sx2] === 'grass' || tiles[sy2][sx2] === 'flower')) { sign(sx2, sy2, txt); break; }
      }
    }
  }

  // --- tall que ficou sem área (pantanal/amazônia base): usa a rota mais próxima
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tiles[y][x] === 'tall' && !areaGrid[y][x]) {
    const rid = routeGrid[y * W + x];
    areaGrid[y][x] = rid >= 0 ? routes[rid].id : null;
  }

  // --- limpeza: sem pinheiros incompletos (blocos 2x2 parciais viram grama nas células de terra)
  for (let by = 0; by < H; by += 2) for (let bx = 0; bx < W; bx += 2) {
    let T = 0;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (tiles[by + dy][bx + dx] === 'tree') T++;
    if (T > 0 && T < 4) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) if (tiles[by + dy][bx + dx] === 'tree' && land[(by + dy) * W + bx + dx] && !wall[(by + dy) * W + bx + dx]) tiles[by + dy][bx + dx] = 'grass';
    // fora da terra (fronteira / litoral): bloco 2x2 só de não-terra é completado com árvore; se tocar o mar ou a terra, os tiles viram grama/água (nunca uma árvore cortada)
    if (T > 0 && T < 4) {
      let wet = false, anyLand = false;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = (by + dy) * W + bx + dx; if (ocean[i] || tiles[by + dy][bx + dx] === 'water') wet = true; if (land[i]) anyLand = true; }
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const i = (by + dy) * W + bx + dx, t = tiles[by + dy][bx + dx];
        if (land[i]) continue;
        if (wet || anyLand) { if (t === 'tree') tiles[by + dy][bx + dx] = ocean[i] ? 'water' : 'grass'; }
        else if (t !== 'tree') tiles[by + dy][bx + dx] = 'tree';
      }
    }
  }

  // --- saídas das cidades: o mundo é aberto (sem NPCs bloqueando); a fenda do portão tem 1 tile de largura
  for (const r of routes) {
    const a = r.a, y = a.y + a.outRow, yp = y ^ 1, west = r.sideA === 'W';
    const cols = west ? [a.x - 2, a.x - 1] : [a.x + a.w, a.x + a.w + 1];
    for (const cx2 of cols) { tiles[y][cx2] = 'path'; if (tiles[yp][cx2] !== 'bld') tiles[yp][cx2] = 'fence'; }
  }

  // --- alcançabilidade: tall isolado vira grama
  START.x = cityBy.curitiba.x; // provisório
  const pfC = World.buildings.find(b => b.id === 'curitiba_pf');
  START.x = pfC.door.x; START.y = pfC.door.y + 1; START.dir = 'up';
  {
    const seen = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const s0 = START.y * W + START.x; seen[s0] = 1; q[qt++] = s0;
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (!inb(nx, ny)) continue; const j = ny * W + nx;
        if (seen[j] || SOLID.has(tiles[ny][nx])) continue;
        seen[j] = 1; q[qt++] = j;
      }
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tiles[y][x] === 'tall' && !seen[y * W + x]) { tiles[y][x] = 'grass'; areaGrid[y][x] = null; }
  }

  // --- sedes de empresas (zonas de treino), à margem das rotas perto de cada cidade
  const EMP = [['jf', 'sao_paulo', 'Sede da J&F'], ['odebrecht', 'salvador', 'Sede da Odebrecht'], ['rural', 'belo_horizonte', 'Banco Rural'], ['master', 'brasilia', 'Banco Master']];
  const okT = new Set(['grass', 'flower', 'tall', 'tree', 'sand']);
  const onRoute = new Uint8Array(N);   // a sede nunca pode cair em cima do traçado de uma rota (nem do pincel de 2 tiles)
  for (const r of routes) for (const [x, y] of r.cells) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inb(x + dx, y + dy)) onRoute[(y + dy) * W + x + dx] = 1;
  for (const [emp, cid, label] of EMP) {
    const c = cityBy[cid]; let done = false;
    const cand = routes.filter(r => r.a.id === cid || r.b.id === cid);
    for (let step = 0; step < 80 && !done; step++) for (const r of cand) {
      if (done) break;
      const n = r.cells.length, atStart = r.a.id === cid, i = atStart ? 6 + step : n - 7 - step;
      if (i < 4 || i > n - 4) continue;
      const [px, py] = r.cells[i];
      for (const sgn of [-1]) {
        const bx = px - 2, by = py - 5;                           // logo acima do caminho, porta voltada para ele
        const lx = bx + 3, ly = by + 4;                          // tile logo abaixo da porta
        let ok = true;
        for (let y = by - 1; y <= by + 5 && ok; y++) for (let x = bx - 1; x <= bx + 6; x++) {
          const k = y * W + x;
          if (!inb(x, y) || !land[k] || wall[k] || ocean[k] || boxGrid[k] || ringM[k]) { ok = false; break; }
          const inside = x >= bx && x < bx + 6 && y >= by && y < by + 4;
          if (inside && (!okT.has(tiles[y][x]) || onRoute[k])) { ok = false; break; }
          if (!inside && y === ly && x === lx) continue;
          if (!inside && (tiles[y][x] === 'sign' || tiles[y][x] === 'bld' || tiles[y][x] === 'fence' || tiles[y][x] === 'water')) { ok = false; break; }
        }
        if (!ok) continue;
        const bb = addB(c, 'empresa', 'empresa_' + emp, bx, by, 6, 4, label, { empresa: emp, sprite: null });
        for (let y = by; y < by + 4; y++) for (let x = bx; x < bx + 6; x++) areaGrid[y][x] = null;
        // trilha de 1 tile da porta até o caminho
        for (let y = ly; y <= py; y++) if (tiles[y][lx] !== 'path') tiles[y][lx] = 'path';
        done = true; break;
      }
    }
    if (!done) console.warn('empresa sem lugar: ' + emp);
  }

  // --- garantia final: o caminho de cada rota nunca fica interrompido (árvore/cerca/água/prédio por cima do traçado).
  //     Roda por último e não usa o RNG; só mexe em tiles de tree/fence/water sobre o traçado e, se um prédio cair em cima, contorna.
  {
    const SOL = t => SOLID.has(t);
    const clearTree = (x, y) => {   // remove o bloco 2x2 do pinheiro inteiro (sem deixar árvore cortada)
      const bx = x & ~1, by = y & ~1;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const xx = bx + i, yy = by + j; if (inb(xx, yy) && tiles[yy][xx] === 'tree' && !boxGrid[yy * W + xx]) tiles[yy][xx] = land[yy * W + xx] ? 'grass' : tiles[yy][xx]; }
    };
    const open = (x, y) => {        // deixa o tile livre e vira caminho; false se for prédio/placa/cidade
      if (!inb(x, y) || boxGrid[y * W + x]) return !inb(x, y) ? false : !SOL(tiles[y][x]);
      const t = tiles[y][x];
      if (t === 'bld' || t === 'sign') return false;
      if (t === 'tree') clearTree(x, y);
      if (t === 'tree' || t === 'fence' || t === 'water') tiles[y][x] = 'path';
      return true;
    };
    const bypass = (p, q) => {      // menor caminho de p a q contornando prédios, numa janela local
      const x0 = Math.max(1, Math.min(p[0], q[0]) - 14), x1 = Math.min(W - 2, Math.max(p[0], q[0]) + 14);
      const y0 = Math.max(1, Math.min(p[1], q[1]) - 14), y1 = Math.min(H - 2, Math.max(p[1], q[1]) + 14);
      const ww = x1 - x0 + 1, hh = y1 - y0 + 1, dist = new Float32Array(ww * hh).fill(1e9), par = new Int32Array(ww * hh).fill(-1), done = new Uint8Array(ww * hh);
      const id = (x, y) => (y - y0) * ww + (x - x0);
      dist[id(p[0], p[1])] = 0;
      for (;;) {
        let bi = -1, bd = 1e9;
        for (let k = 0; k < dist.length; k++) if (!done[k] && dist[k] < bd) { bd = dist[k]; bi = k; }
        if (bi < 0) return null;
        done[bi] = 1; const cx = x0 + bi % ww, cy = y0 + ((bi / ww) | 0);
        if (cx === q[0] && cy === q[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
          const t = tiles[ny][nx]; if (t === 'bld' || t === 'sign' || (boxGrid[ny * W + nx] && SOL(t)) || !land[ny * W + nx]) continue;
          const c = bd + (t === 'path' ? 1 : t === 'tree' || t === 'fence' ? 4 : t === 'water' ? 6 : 2), k = id(nx, ny);
          if (c < dist[k]) { dist[k] = c; par[k] = bi; }
        }
      }
      const out = []; for (let k = id(q[0], q[1]); k !== -1; k = par[k]) out.push([x0 + k % ww, y0 + ((k / ww) | 0)]);
      return out;
    };
    for (const r of routes) {
      const cs = r.cells;
      for (let i = 0; i < cs.length; i++) {            // 1) o tile do traçado em si
        const [x, y] = cs[i]; if (tiles[y][x] === 'bld') continue;
        open(x, y);
      }
      for (let i = 0; i < cs.length; i++) {            // 2) prédio em cima do traçado: contorna
        if (tiles[cs[i][1]][cs[i][0]] !== 'bld') continue;
        let j = i; while (j + 1 < cs.length && tiles[cs[j + 1][1]][cs[j + 1][0]] === 'bld') j++;
        const p = cs[Math.max(0, i - 1)], q = cs[Math.min(cs.length - 1, j + 1)], pth = bypass(p, q);
        if (pth) for (const [x, y] of pth) { open(x, y); open(x + 1, y); open(x, y + 1); open(x + 1, y + 1); }
        i = j;
      }
      for (const [x, y] of cs) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) {   // 3) o pincel de 2 tiles não pode ser mordido por árvore/cerca
        const xx = x + dx, yy = y + dy;
        if (inb(xx, yy) && !boxGrid[yy * W + xx] && (tiles[yy][xx] === 'tree' || tiles[yy][xx] === 'fence')) open(xx, yy);
      }
    }
    // 4) mapa aberto: toda avenida que chega na borda da cidade continua para fora (sem pinheiro tampando o fim da rua)
    for (const c of cities) for (let y = c.y; y < c.y + c.h; y++) for (const [ex, dx] of [[c.x, -1], [c.x + c.w - 1, 1]]) {
      if (tiles[y][ex] !== 'path') continue;
      for (let k = 1; k <= 10; k++) {
        const x = ex + dx * k;
        if (!inb(x, y) || boxGrid[y * W + x] || !land[y * W + x] || ocean[y * W + x]) break;
        const t = tiles[y][x];
        if (t === 'water' || t === 'bld' || t === 'sign') break;
        if (!SOL(t) && k > 2) break;
        open(x, y);
      }
    }
  }

  // --- imagens de fallback dos prédios
  const imgCache = {};
  for (const b of World.buildings) {
    _M.doors[b.door ? b.door.x + ',' + b.door.y : 'x' + b.id] = b;
    try {
      if (typeof drawBuilding === 'function') {
        const cacheable = b.kind === 'pf' || b.kind === 'casa';
        const key = b.kind + '|' + b.w + '|' + b.h + '|' + (b.roof || '');
        if (cacheable && imgCache[key]) b.img = imgCache[key]; else { b.img = drawBuilding(b); if (cacheable) imgCache[key] = b.img; }
      }
    } catch (e) { b.img = null; }
  }

  World.landMask = land; World.tiles = tiles; World.areaGrid = areaGrid; World.biomeGrid = biomeGrid;
  World.cities = cities.map(c => ({ id: c.id, name: c.name, uf: c.uf, order: c.order, x: c.x, y: c.y, w: c.w, h: c.h, biome: c.biome }));
}

// ---------------------------------------------------------------- consultas
function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'tree';
  return World.tiles[y][x];
}
function isSolid(x, y) {
  if (SOLID.has(tileAt(x, y))) return true;
  return World.npcs.some(n => n.x === x && n.y === y && !n.hidden);
}
function buildingAtDoor(x, y) { return _M.doors[x + ',' + y]; }
function biomeAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'cerrado';
  return World.biomeGrid[y][x];
}
function zoneAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return null;
  const id = World.areaGrid[y][x];
  if (id && World.areas[id]) return World.areas[id];
  const r = _M.routeGrid ? _M.routeGrid[y * MAP_W + x] : -1;
  return r >= 0 ? World.areas['rota_' + (r + 1)] : null;
}
function regionAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'Brasil';
  if (_M.boxGrid) { const b = _M.boxGrid[y * MAP_W + x]; if (b > 0) return _M.cityList[b - 1].name; }
  const r = _M.routeGrid ? _M.routeGrid[y * MAP_W + x] : -1;
  const bio = BIOME_NAMES[World.biomeGrid[y][x]] || '';
  return r >= 0 ? `Rota ${_ROUTE_BR[r]} · ${bio}` : bio;
}
