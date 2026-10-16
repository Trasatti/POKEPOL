# POKÉPOL: mapeamento v2 (tipo do Pokémon = categoria do crime)

Versão 2 do mapeamento. O doc anterior (`docs/mapeamento-pokemon-politicos.md`) foi mantido. Nada em `web/` foi alterado. Lula está fora. Um Pokémon por político, 34 no total, todos da Pokédex do Fire Red (https://pokemondb.net/pokedex/game/firered-leafgreen). Stats Geração 1 de https://pokemondb.net/pokedex/stats/gen1 (HP / Atq / Def / Vel), conferidos de memória contra a tabela e a reconferir no site antes de congelar.

**Regra de honestidade:** o tipo do Pokémon é piada sobre a categoria do caso, nunca prova de culpa. Os status abaixo vêm do `data.js` e do doc v1. Onde o desfecho atual não foi reconferido, está marcado "(verificar)". Sempre usar o rótulo exato: condenado, investigado, denunciado, absolvido, impeachment, provas anuladas.

## 1. Tabela categoria do caso → tipo Pokémon

| Categoria do caso | Tipo Pokémon | Justificativa da piada |
|---|---|---|
| Saúde (respiradores, hospitais, vacina) | Poison | Veneno, doença, toxina |
| Transporte, aviação, aeroportos, jatinho, fuga ao exterior | Flying | Voa, foge, pousa em outro país |
| Obras, empreiteiras, túneis, tratores, concreto | Rock / Ground | Pedra, terra, terraplenagem |
| Energia, combustível, petróleo (combustão) | Fire | Queima, refina, incendeia |
| Eletricidade, usinas, rede de contatos | Electric | Choque, ímã, "rede" |
| Água, saneamento, rio, porto, offshore, navegação | Water | Mar, rio, "lavagem" |
| Meio ambiente, madeira, boiada | Grass (Bug) | Árvore cortada, mato, pasto |
| Golpe, violência, ameaças, armas | Fighting | Soco, chute, briga |
| Espionagem, fake news, hacker, delação como "leitura de mente" | Psychic | Mente, controle, hipnose |
| Rachadinha, funcionário fantasma, perfil fantasma | Ghost | Funcionário que não aparece |
| Dinheiro puro (mala, propina, consultoria, compra de votos, delação, obstrução) | Normal | Linha Meowth, Snorlax, Chansey, sem "tema" setorial: só o dinheiro |

Tipos Gen 1 de cada espécie seguem o Fire Red (sem Dark, Steel, Fairy).

## 2. Tabela por político

Coluna "Pokémon": tipo(s) e stats HP/Atq/Def/Vel.

| id | Político | Caso / categoria | Status | Pokémon (tipo) HP/Atq/Def/Vel | Por quê | Traço visual (Pokémon) | Exagero facial |
|---|---|---|---|---|---|---|---|
| delcidiao | Delcídio do Amaral | Delação e tentativa de obstruir a Lava Jato (ex-diretor de Gás e Energia da Petrobras). Categoria: obstrução/delação, a mais próxima é Normal | Preso em 2015, delator; desfecho processual atual (verificar) | Lickitung (Normal) 90/55/75/30 | A língua gigante é o "botou a língua pra fora" da delação | Língua rosa enorme com microfone-gravador enrolado | Sobrancelhas e bigode mais espessos, olhar de lado |
| palocciu | Antonio Palocci | Consultoria e planilha com a Odebrecht (Lava Jato). Dinheiro puro: Normal | Condenado na Lava Jato; delator | Chansey (Normal) 250/5/5/50 | Ele é médico de formação; Chansey é a enfermeira com o ovo de ouro. HP 250 e ataque 5: ajustar equilíbrio | Ovo dourado na bolsa e planilha dobrada saindo dela | Testa mais alta, olheiras |
| machadao | Sérgio Machado | Propina na Transpetro (navegação e transporte de petróleo) e gravações de aliados. Água/navegação: Water | Delator (colaboração premiada) | Tentacool (Water/Poison) 40/40/35/70 | Navios da Transpetro; tentáculos "escutando" e gravando | Tentáculos com fones e gravador pendurado | Orelhas maiores, sobrancelhas pesadas |
| garotinho | Anthony Garotinho | Compra de votos com o Cheque Cidadão. Normal (dinheiro/eleitoral) | Condenado e preso mais de uma vez | Jigglypuff (Normal) 115/45/20/20 | Foi radialista: canta e faz todo mundo dormir | Microfone de rádio e cheque rosa na mão | Sorriso largo de pregador, bochechas |
| janonudo | André Janones | Suposta rachadinha. Categoria Ghost, mas Gastly/Haunter/Gengar ficaram com a família Bolsonaro; mais próximo: lábia e vídeos (Psychic) | Investigado | Drowzee (Psychic) 60/48/45/42 | Hipnotiza seguidores nas lives | Pêndulo com ícone de live e celular | Sorriso e olhos arregalados maiores |
| pezao | Luiz Fernando Pezão | Propina/mesada ligada a obras no RJ (Rock/Ground) | Preso em 2018 no cargo; condenação (verificar) | Rhyhorn (Ground/Rock) 80/85/95/25 | Obras, chifre; evolui para Cabral | Chifre com envelopes de mesada pendurados | Mais robusto, queixo largo |
| witzel | Wilson Witzel | Fraudes na saúde (respiradores, hospitais de campanha). Poison, exatamente | Impeachment em 2021; denunciado; condenação criminal (verificar) | Koffing (Poison) 40/65/95/35 | Nuvem de gás tóxico, pandemia | Nuvem roxa com caveira e máscara cirúrgica | Mandíbula quadrada e sobrancelhas maiores |
| silveirao | Daniel Silveira | Ameaças a ministros do STF (violência/golpe). Fighting | Condenado pelo STF em 2022; perdão presidencial anulado | Mankey (Fighting) 40/80/35/70 | Macaco furioso | Veia saltada na testa, punhos cerrados | Pescoço grosso, queixo e veia |
| carluxo | Carlos Bolsonaro | Fake news/gabinete do ódio (perfis fantasmas). Ghost/Psychic | Investigado | Gastly (Ghost/Poison) 30/35/30/80 | Gás: perfis falsos flutuando; primeiro da linha de família | Ícones de redes sociais dentro da nuvem de gás | Sobrancelhas pesadas, barba cerrada |
| azeredinho | Eduardo Azeredo | Mensalão tucano de 1998, recursos de estatais mineiras (Copasa, Comig). Água: Water | Condenado, preso em 2018 | Kabuto (Rock/Water) 30/80/90/55 | Fóssil: mensalão original, e Copasa é saneamento | Torneira "Copasa" saindo da carapaça | Sobrancelhas brancas, orelhas maiores |
| malaloures | Rodrigo Rocha Loures | Mala de R$ 500 mil filmada pela PF (JBS). Normal | Desfecho (verificar) | Meowth (Normal) 40/45/35/90 | Moeda na testa; vive de moedas e agora de mala | Moeda de ouro na testa e mala nas patas | Cabeça mais lisa e brilhante |
| codevasfo | Juscelino Filho | Codevasf (vale do São Francisco, obras e irrigação), leilão de cavalos, jatinho da FAB. Water | Denunciado pela PGR; não condenado | Seadra (Water) 55/65/95/85 | Cavalo-marinho: cavalos mais rio mais obra | Cabeça de cavalo, espinhos, cano da Codevasf e miniatura de jatinho | Topete exagerado, queixo mais fino |
| boiadeiro | Ricardo Salles | Exportação de madeira, "passar a boiada". Grass | Investigado | Exeggutor (Grass/Psychic) 95/95/85/55 | Palmeiras: toras prontas para exportar | Toras com selo de exportação, chapéu de boiadeiro em uma das cabeças | Óculos e sobrancelhas maiores |
| rachadinho | Flávio Bolsonaro | Rachadinha na Alerj (funcionário fantasma). Ghost | Investigado; provas anuladas em 2021 | Haunter (Ghost/Poison) 45/50/45/95 | Mãos soltas pegando dinheiro dos "fantasmas" | Mãos flutuantes com envelopes depositados | Bochechas e nariz maiores |
| zambellina | Carla Zambelli | Invasão do sistema do CNJ por hacker, fuga para a Itália. Psychic (hacker) | Condenada pelo STF em 2025; presa na Itália | Jynx (Ice/Psychic) 65/50/35/95 | Cabelo longo e loiro; fala sem parar. Versão roxa | Teclado de hacker no vestido, cabelo esvoaçante | Volume capilar maior, olhos arregalados |
| granadeiro | Roberto Jefferson | Atirou e usou granadas contra a PF em 2022 (violência/armas). Fighting; antes, condenado no Mensalão | Condenado no Mensalão; situação atual (verificar, possível falecimento em 2025) | Hitmonchan (Fighting) 50/105/79/76 | Boxeador: socos; a granada é o golpe-assinatura | Luvas de boxe com granada em uma delas | Bochechas e papo, careca |
| valdemensal | Valdemar Costa Neto | Mensalão; hoje cacique do partido com a maior bancada. Normal (dinheiro) | Condenado no Mensalão | Tauros (Normal) 75/100/95/110 | Chefe da manada: bancada | Três caudas de notas, chifres | Sobrancelhas brancas grossas, nariz |
| mensaleiro | José Dirceu | Mensalão (compra de apoio no Congresso). Normal | Condenado no Mensalão (2012) | Kangaskhan (Normal) 105/95/80/90 | Mama que carrega todos: "capitão do time" | Bolsa com envelopes mensais | Testa gigante, careca brilhante |
| cabralzao | Sérgio Cabral | Propina de obras (Maracanã e outras) e farra dos guardanapos. Rock/Ground | Condenado em dezenas de processos | Rhydon (Ground/Rock) 105/130/120/40 | Rochedo com broca, chefão da linha Pezão | Guardanapo na cabeça, chifre-broca | Cabelo grisalho ondulado exagerado, papada |
| tarifardo | Eduardo Bolsonaro | Coação (tarifaço) e vida nos EUA. Flying (fuga) | Denunciado pela PGR | Fearow (Normal/Flying) 65/90/65/100 | Bico longo, cruza o hemisfério | Bandeira dos EUA nas asas e etiqueta de tarifa | Queixo mais comprido, olheiras |
| abinzinho | Alexandre Ramagem | Abin paralela (espionagem). Psychic | Condenado pelo STF em 2025 (trama golpista); investigado na Abin paralela | Kadabra (Psychic) 40/35/30/105 | Colher-antena: escuta | Colheres com antena parabólica | Orelhas maiores |
| minutorres | Anderson Torres | Minuta do golpe; omissão em 8 de janeiro (golpe). Fighting | Condenado pelo STF em 2025 | Hitmonlee (Fighting) 50/120/53/87 | Pernas esticadas: "chutou o balde" e esticou até Orlando | Perna esticada com mala de viagem e minuta dobrada | Nariz e queixo maiores |
| generalzao | Walter Braga Netto | Plano do golpe (Punhal Verde-Amarelo). Fighting | Condenado pelo STF em 2025 | Primeape (Fighting) 65/105/60/95 | Fúria militar; piada com Mankey (Silveirão), sem parentesco | Quepe verde-oliva e punho cerrado | Bigode grosso, sobrancelhas |
| cunhamon | Eduardo Cunha | Contas na Suíça, trusts, Petrobras. Water (offshore) | Condenado na Lava Jato; cassado em 2016 | Cloyster (Water/Ice) 50/95/180/70 | Casca impenetrável com perolas escondidas | Casca fechada com cadeado e mapa da Suíça | Olhos arregalados, sobrancelhas |
| renanzilla | Renan Calheiros | Investigado em inquéritos da Lava Jato (Transpetro, segundo delação de Machado). Electric (rede de contatos) | Investigado; sem condenação | Magneton (Electric) 50/60/95/70 | Ímãs que grudam em todos os governos | Três ímãs com cédulas coladas | Sobrancelhas pretas grossas |
| lirassauro | Arthur Lira | Orçamento secreto; reportagens sobre tratores superfaturados (verificar). Ground | Não condenado; orçamento secreto inconstitucional | Golem (Rock/Ground) 80/120/130/45 | Rolo compressor na Câmara | Casca com esteira de trator | Bochechas e barba maiores |
| jucazord | Romero Jucá | Gravação de 2016 ("estancar a sangria"). Não encaixa bem; Poison/Flying pelo trocadilho do sangue | Investigado | Golbat (Poison/Flying) 75/80/70/90 | Morcego que suga sangue | Asas e presas, gotas de sangue | Orelhas maiores, nariz |
| temerario | Michel Temer | JBS e o caso da mala; Angra 3 e portos nas investigações. Normal | Denunciado duas vezes; preso por dias em 2019 | Persian (Normal) 65/70/60/115 | Evolui de Meowth (Rocha Loures) | Joia na testa, postura rígida | Olheiras fundas, sobrancelhas |
| gravecio | Aécio Neves | R$ 2 milhões de Joesley e aeroporto de Cláudio. Normal/Flying | Absolvido em 2022 (propina); aeroporto sem condenação (verificar) | Pidgeot (Normal/Flying) 83/80/75/101 | Crista longa; aeroporto particular | Crista dourada e pista de pouso | Topete maior, queixo |
| pedalita | Dilma Rousseff | Pedaladas fiscais. Normal | Impeachment em 2016; nunca condenada por corrupção | Farfetch'd (Normal/Flying) 52/90/55/60 | A mandioca no lugar do alho-poró | Mandioca no lugar do alho-poró | Franja e óculos maiores |
| malufante | Paulo Maluf | Lavagem de dinheiro de obras (Av. Água Espraiada e Túnel Ayrton Senna). Ground | Condenado pelo STF em 2017 | Dugtrio (Ground) 35/100/50/120 | Túnel, três cabeças | Capacete de obra, três cabeças | Sobrancelhas e orelhas maiores |
| confiscollor | Fernando Collor | BR Distribuidora (combustíveis) e carros de luxo apreendidos. Fire | Condenado pelo STF em 2023; preso em 2025 | Rapidash (Fire) 65/100/70/105 | Cavalo veloz, chama, cromados | Chama no rabo com cromados de carro de luxo | Topete grande, queixo |
| bunkerddel | Geddel Vieira Lima | R$ 51 milhões em malas. Normal | Condenado pelo STF | Snorlax (Normal) 160/110/65/30 | Dorme sobre o tesouro | Barriga enorme e malas empilhadas | Bochechas, papada |
| golpenaro | Jair Bolsonaro | Trama golpista (Fighting), mas a linha familiar e a fraude no cartão de vacina (Poison, saúde) pesam | Condenado pelo STF em 2025; indiciado nas joias e no cartão de vacina (verificar) | Gengar (Ghost/Poison) 60/65/60/110 | Topo da linha Gastly; sombra e veneno | Sorriso largo, sombra e faixa presidencial | Queixo, sobrancelhas |

## 3. Cadeias de evolução

| Linha | Políticos | Observação |
|---|---|---|
| Gastly > Haunter > Gengar | Carluxo > Rachadinho (Flávio) > Golpenaro (Jair) | Filho 02, filho 01, pai. Ghost cabe em fantasma/rachadinha; Jair é golpe (Fighting), então o Poison de Gengar fica no cartão de vacina |
| Meowth > Persian | Malaloures > Temerário | Mala > chefe. Não afirmar que a mala era de Temer |
| Rhyhorn > Rhydon | Pezãozinho > Cabralzão | Sucessor e antecessor no RJ |
| Mankey > Primeape | Silveirão > Generalzão | Só temático (golpismo), sem parentesco |

Janones (rachadinha) ficou com Drowzee porque o Ghost do jogo é da família Bolsonaro.

## 4. Bloco JSON

```json
{
 "delcidiao": {"pokemon": "Lickitung", "ptype": "Normal", "hp": 90, "atk": 55, "def": 75, "spd": 30, "trait": "Língua rosa enorme com microfone-gravador enrolado", "exaggerate": "Sobrancelhas e bigode mais espessos"},
 "palocciu": {"pokemon": "Chansey", "ptype": "Normal", "hp": 250, "atk": 5, "def": 5, "spd": 50, "trait": "Ovo dourado na bolsa com planilha dobrada", "exaggerate": "Testa mais alta e olheiras"},
 "machadao": {"pokemon": "Tentacool", "ptype": "Water/Poison", "hp": 40, "atk": 40, "def": 35, "spd": 70, "trait": "Tentáculos com fones e gravador pendurado", "exaggerate": "Orelhas maiores e sobrancelhas pesadas"},
 "garotinho": {"pokemon": "Jigglypuff", "ptype": "Normal", "hp": 115, "atk": 45, "def": 20, "spd": 20, "trait": "Microfone de rádio e cheque rosa na mão", "exaggerate": "Sorriso largo de pregador e bochechas"},
 "janonudo": {"pokemon": "Drowzee", "ptype": "Psychic", "hp": 60, "atk": 48, "def": 45, "spd": 42, "trait": "Pêndulo com ícone de live e celular", "exaggerate": "Sorriso e olhos arregalados maiores"},
 "pezao": {"pokemon": "Rhyhorn", "ptype": "Ground/Rock", "hp": 80, "atk": 85, "def": 95, "spd": 25, "trait": "Chifre com envelopes de mesada pendurados", "exaggerate": "Mais robusto e queixo largo"},
 "witzel": {"pokemon": "Koffing", "ptype": "Poison", "hp": 40, "atk": 65, "def": 95, "spd": 35, "trait": "Nuvem roxa com caveira e máscara cirúrgica", "exaggerate": "Mandíbula quadrada e sobrancelhas maiores"},
 "silveirao": {"pokemon": "Mankey", "ptype": "Fighting", "hp": 40, "atk": 80, "def": 35, "spd": 70, "trait": "Veia saltada na testa e punhos cerrados", "exaggerate": "Pescoço grosso e queixo maior"},
 "carluxo": {"pokemon": "Gastly", "ptype": "Ghost/Poison", "hp": 30, "atk": 35, "def": 30, "spd": 80, "trait": "Ícones de redes sociais dentro da nuvem de gás", "exaggerate": "Sobrancelhas pesadas e barba cerrada"},
 "azeredinho": {"pokemon": "Kabuto", "ptype": "Rock/Water", "hp": 30, "atk": 80, "def": 90, "spd": 55, "trait": "Torneira 'Copasa' saindo da carapaça", "exaggerate": "Sobrancelhas brancas e orelhas maiores"},
 "malaloures": {"pokemon": "Meowth", "ptype": "Normal", "hp": 40, "atk": 45, "def": 35, "spd": 90, "trait": "Moeda de ouro na testa e mala nas patas", "exaggerate": "Cabeça mais lisa e brilhante"},
 "codevasfo": {"pokemon": "Seadra", "ptype": "Water", "hp": 55, "atk": 65, "def": 95, "spd": 85, "trait": "Cabeça de cavalo-marinho, cano da Codevasf e jatinho em miniatura", "exaggerate": "Topete exagerado e queixo mais fino"},
 "boiadeiro": {"pokemon": "Exeggutor", "ptype": "Grass/Psychic", "hp": 95, "atk": 95, "def": 85, "spd": 55, "trait": "Toras com selo de exportação e chapéu de boiadeiro", "exaggerate": "Óculos e sobrancelhas maiores"},
 "rachadinho": {"pokemon": "Haunter", "ptype": "Ghost/Poison", "hp": 45, "atk": 50, "def": 45, "spd": 95, "trait": "Mãos flutuantes com envelopes depositados", "exaggerate": "Bochechas e nariz maiores"},
 "zambellina": {"pokemon": "Jynx", "ptype": "Ice/Psychic", "hp": 65, "atk": 50, "def": 35, "spd": 95, "trait": "Teclado de hacker no vestido e cabelo esvoaçante", "exaggerate": "Volume capilar maior e olhos arregalados"},
 "granadeiro": {"pokemon": "Hitmonchan", "ptype": "Fighting", "hp": 50, "atk": 105, "def": 79, "spd": 76, "trait": "Luvas de boxe com uma granada em uma delas", "exaggerate": "Bochechas e papo maiores"},
 "valdemensal": {"pokemon": "Tauros", "ptype": "Normal", "hp": 75, "atk": 100, "def": 95, "spd": 110, "trait": "Três caudas de cédulas e chifres", "exaggerate": "Sobrancelhas brancas grossas e nariz maior"},
 "mensaleiro": {"pokemon": "Kangaskhan", "ptype": "Normal", "hp": 105, "atk": 95, "def": 80, "spd": 90, "trait": "Bolsa com envelopes mensais", "exaggerate": "Testa gigante e careca brilhante"},
 "cabralzao": {"pokemon": "Rhydon", "ptype": "Ground/Rock", "hp": 105, "atk": 130, "def": 120, "spd": 40, "trait": "Guardanapo na cabeça e chifre-broca", "exaggerate": "Cabelo grisalho ondulado exagerado e papada"},
 "tarifardo": {"pokemon": "Fearow", "ptype": "Normal/Flying", "hp": 65, "atk": 90, "def": 65, "spd": 100, "trait": "Bandeira dos EUA nas asas e etiqueta de tarifa", "exaggerate": "Queixo mais comprido e olheiras"},
 "abinzinho": {"pokemon": "Kadabra", "ptype": "Psychic", "hp": 40, "atk": 35, "def": 30, "spd": 105, "trait": "Colheres com antena parabólica", "exaggerate": "Orelhas maiores"},
 "minutorres": {"pokemon": "Hitmonlee", "ptype": "Fighting", "hp": 50, "atk": 120, "def": 53, "spd": 87, "trait": "Perna esticada com mala de viagem e minuta dobrada", "exaggerate": "Nariz e queixo maiores"},
 "generalzao": {"pokemon": "Primeape", "ptype": "Fighting", "hp": 65, "atk": 105, "def": 60, "spd": 95, "trait": "Quepe verde-oliva e punho cerrado", "exaggerate": "Bigode grosso e sobrancelhas pesadas"},
 "cunhamon": {"pokemon": "Cloyster", "ptype": "Water/Ice", "hp": 50, "atk": 95, "def": 180, "spd": 70, "trait": "Casca fechada com cadeado e mapa da Suíça", "exaggerate": "Olhos arregalados e sobrancelhas maiores"},
 "renanzilla": {"pokemon": "Magneton", "ptype": "Electric", "hp": 50, "atk": 60, "def": 95, "spd": 70, "trait": "Três ímãs com cédulas coladas", "exaggerate": "Sobrancelhas pretas grossas"},
 "lirassauro": {"pokemon": "Golem", "ptype": "Rock/Ground", "hp": 80, "atk": 120, "def": 130, "spd": 45, "trait": "Casca com esteira de trator", "exaggerate": "Bochechas e barba maiores"},
 "jucazord": {"pokemon": "Golbat", "ptype": "Poison/Flying", "hp": 75, "atk": 80, "def": 70, "spd": 90, "trait": "Asas, presas e gotas de sangue", "exaggerate": "Orelhas e nariz maiores"},
 "temerario": {"pokemon": "Persian", "ptype": "Normal", "hp": 65, "atk": 70, "def": 60, "spd": 115, "trait": "Joia na testa e postura rígida", "exaggerate": "Olheiras fundas e sobrancelhas"},
 "gravecio": {"pokemon": "Pidgeot", "ptype": "Normal/Flying", "hp": 83, "atk": 80, "def": 75, "spd": 101, "trait": "Crista dourada e pista de pouso", "exaggerate": "Topete maior e queixo marcado"},
 "pedalita": {"pokemon": "Farfetch'd", "ptype": "Normal/Flying", "hp": 52, "atk": 90, "def": 55, "spd": 60, "trait": "Mandioca no lugar do alho-poró", "exaggerate": "Franja e óculos maiores"},
 "malufante": {"pokemon": "Dugtrio", "ptype": "Ground", "hp": 35, "atk": 100, "def": 50, "spd": 120, "trait": "Capacete de obra nas três cabeças", "exaggerate": "Sobrancelhas e orelhas maiores"},
 "confiscollor": {"pokemon": "Rapidash", "ptype": "Fire", "hp": 65, "atk": 100, "def": 70, "spd": 105, "trait": "Chama no rabo com cromados de carro de luxo", "exaggerate": "Topete grande e queixo marcado"},
 "bunkerddel": {"pokemon": "Snorlax", "ptype": "Normal", "hp": 160, "atk": 110, "def": 65, "spd": 30, "trait": "Barriga enorme e malas empilhadas", "exaggerate": "Bochechas e papada maiores"},
 "golpenaro": {"pokemon": "Gengar", "ptype": "Ghost/Poison", "hp": 60, "atk": 65, "def": 60, "spd": 110, "trait": "Sorriso largo, sombra e faixa presidencial", "exaggerate": "Queixo e sobrancelhas maiores"}
}
```
