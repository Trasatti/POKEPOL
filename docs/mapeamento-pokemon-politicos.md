# POKÉPOL: mapeamento Pokémon x políticos

Documento de design (pt-BR). Pokédex: https://pokemondb.net/pokedex/game/firered-leafgreen. Stats: https://pokemondb.net/pokedex/stats/gen1 (a coluna Esp usa o Sp. Atk da página, que coincide com o Special da Geração 1). Nenhum arquivo em `web/` foi alterado. Lula está fora, conforme pedido. Cada Pokémon é usado no máximo uma vez.

**Regra de honestidade do jogo:** use sempre o rótulo exato (condenado, investigado, denunciado, absolvido, processo anulado). Quem não foi condenado aparece como investigado ou denunciado. Os status dos novos vêm da fonte indicada (Wikipédia em pt, lida nesta pesquisa); os do elenco existente vêm do `data.js`, com ressalvas na seção 4.

**Critério de força:** chefões e ex-presidentes ficam com Pokémon de linha final ou lendária-ish (Bolsonaro = Charizard 534, Geddel = Snorlax 540, Cunha = Cloyster 525, Cabral = Rhydon 485); figuras menores ou iniciais ficam com Pokémon fracos de primeiro estágio. Os stats saem direto da tabela, e o JSON da seção 5 está pronto para uso.

## 1. Elenco atual (34 políticos)

| # | Jogo | Real | Status | Pokémon (tipo) | Ligação | HP | Atq | Def | Vel | Esp | Total | Tipo jogo | Golpe-assinatura |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Delcidião | Delcídio do Amaral | Preso em 2015 (1º senador preso no mandato); delator | Lickitung (Normal) | Língua enorme: o homem que "botou a língua pra fora" na delação premiada da Lava Jato. | 90 | 55 | 75 | 30 | 60 | 385 | DELACAO | Delação Premiada (existente) |
| 2 | Palocciu | Antonio Palocci | Condenado na Lava Jato; delator | Drowzee (Psychic) | Pré-evolução de Hypno: o ministro que "acalmava o mercado". Começo fraco, como convém a inicial. | 60 | 48 | 45 | 42 | 43 | 328 | LAVAGEM | Planilha Paralela (existente) |
| 3 | Machadão | Sérgio Machado | Delator (colaboração premiada); gravou conversas com aliados | Ekans (Poison) | Cobra que se esgueira e escuta: gravou conversas escondido. Pokémon fraco, adequado a inicial. | 35 | 60 | 44 | 55 | 40 | 288 | PROPINA | Gravação Secreta (existente) |
| 4 | Garotinhô | Anthony Garotinho | Condenado (compra de votos, Cheque Cidadão) e preso mais de uma vez | Clefairy (Normal) | Fada madrinha que distribui benesses: o "Cheque Cidadão" usado para comprar votos. (Chansey seria mais literal, mas tem ataque 5.) | 70 | 45 | 48 | 35 | 60 | 323 | PROPINA | Cheque Cidadão (existente) |
| 5 | Janonudo | André Janones | Investigado por suposta rachadinha | Gastly (Ghost/Poison) | Fantasma: o tipo "funcionário fantasma" do jogo. A linha Gastly > Haunter > Gengar fica aberta para evoluções futuras. | 30 | 35 | 30 | 80 | 100 | 310 | RACHADINHA | Funcionário Fantasma (existente) |
| 6 | Pezãozinho | Luiz Fernando Pezão | Preso em 2018 (no cargo), acusado de receber mesada; condenação não verificada | Rhyhorn (Ground/Rock) | Grande e pesado, evolui para o chefe Cabral (Rhydon). | 80 | 85 | 95 | 25 | 30 | 345 | PROPINA | Mesadão (existente) |
| 7 | Witzelzão | Wilson Witzel | Sofreu impeachment em 2021; acusado de fraudes na saúde (condenação criminal não verificada) | Koffing (Poison) | Nuvem de gás: respiradores/hospitais de campanha na pandemia. Evolui para Weezing (Cláudio Castro, que assumiu depois). | 40 | 65 | 95 | 35 | 60 | 340 | PROPINA | Caixa 2 (existente) |
| 8 | Silveirão | Daniel Silveira | Condenado pelo STF em 2022 (ameaças a ministros); perdão presidencial anulado | Mankey (Fighting) | Macaco briguento de sangue quente: gritaria e ameaças. Forte no ataque, frágil na defesa. | 40 | 80 | 35 | 70 | 35 | 305 | GOLPE | Live (existente) / Motociata |
| 9 | Carluxo | Carlos Bolsonaro | Investigado (gabinete do ódio, Abin paralela) | Charmander (Fire) | Inicial de fogo: chama na cauda = incendiar redes. Linha Charmander > Charmeleon > Charizard = filho 02 > 01 > pai. | 39 | 52 | 43 | 65 | 60 | 309 | FAKE | Gabinete do Ódio (existente) |
| 10 | Azeredinho | Eduardo Azeredo | Condenado (mensalão tucano), preso em 2018 | Kabuto (Rock/Water) | Fóssil: o "mensalão original", anterior ao petista (caso de 1998). Antiguidade. | 30 | 80 | 90 | 55 | 55 | 355 | PROPINA | Mesadão (existente) |
| 11 | Malaloures | Rodrigo Rocha Loures | Filmado pela PF com mala de R$ 500 mil (2017); desfecho judicial não verificado | Meowth (Normal) | Meowth vive de moedas (Pay Day); ele, de mala. Evolui para Persian (Temer). | 40 | 45 | 35 | 90 | 40 | 290 | PROPINA | Mala de Dinheiro (existente) |
| 12 | Codevasfo | Juscelino Filho | Denunciado pela PGR (Codevasf); não condenado | Ponyta (Fire) | Cavalo de fogo: leilão de cavalos + jatinho da FAB. Cavalinho ainda pequeno, ministro menor. | 50 | 85 | 55 | 90 | 65 | 410 | CENTRAO | Jatinho da FAB (existente) |
| 13 | Boiadeiro | Ricardo Salles | Investigado (exportação de madeira) | Tauros (Normal) | Touro: "passar a boiada", literal. | 75 | 100 | 95 | 110 | 40 | 490 | CENTRAO | Passar a Boiada (existente) |
| 14 | Rachadinho | Flávio Bolsonaro | Investigado (rachadinha na Alerj); provas anuladas pela Justiça em 2021 | Charmeleon (Fire) | Fase intermediária da linha Bolsonaro, entre o caçula e o pai. | 58 | 64 | 58 | 80 | 80 | 405 | RACHADINHA | Depósito do Queiroz (existente) |
| 15 | Zambellina | Carla Zambelli | Condenada pelo STF em 2025; fugiu para a Itália e foi presa | Ninetales (Fire) | Cabelo longo, claro e esvoaçante; raposa mística que foge. Aparência + fuga. | 73 | 76 | 75 | 100 | 81 | 505 | FUGA | Fuga pra Itália (existente) |
| 16 | Granadeiro | Roberto Jefferson | Condenado no Mensalão; atirou contra a PF em 2022 (verificar situação atual, ver pendências) | Electrode (Electric) | Explode: granadas e fuzil contra agentes. Velocidade 150 destoa do cadastro dele (lento); vale ajustar. | 60 | 50 | 70 | 150 | 80 | 490 | GOLPE | Granada (existente) |
| 17 | Valdemensal | Valdemar Costa Neto | Condenado no Mensalão; hoje presidente do PL | Kingler (Water) | Pinça gigante: o partido com a maior bancada da Câmara. Ataque e defesa altos, como cacique. | 55 | 130 | 115 | 75 | 50 | 475 | CENTRAO | Mesadão (existente) |
| 18 | Mensaleiro | José Dirceu | Condenado no Mensalão (2012) | Machamp (Fighting) | Quatro braços: o "chefe" do esquema segundo o STF. Topo da linha tesoureiro > presidente do PT > chefe. | 90 | 130 | 80 | 55 | 65 | 505 | PROPINA | Caixa 2 (existente) |
| 19 | Cabralzão | Sérgio Cabral | Condenado em dezenas de processos | Rhydon (Ground/Rock) | Pesadão com chifre, ataque 130: o chefão da sua linha (Pezão). | 105 | 130 | 120 | 40 | 45 | 485 | PROPINA | Farra dos Guardanapos (existente) |
| 20 | Tarifardo | Eduardo Bolsonaro | Denunciado pela PGR (coação); vive nos EUA | Fearow (Normal/Flying) | Ave que cruza distâncias: o voo para os EUA. | 65 | 90 | 65 | 100 | 61 | 442 | FUGA | Tarifaço (existente) |
| 21 | Abinzinho | Alexandre Ramagem | Condenado pelo STF em 2025; investigado na Abin paralela | Kadabra (Psychic) | Colher + psíquico: espionagem. Velocidade e especial altos. | 40 | 35 | 30 | 105 | 120 | 400 | FAKE | Abin Paralela (existente) |
| 22 | Minutorres | Anderson Torres | Condenado pelo STF em 2025 | Dodrio (Normal/Flying) | Três cabeças: delegado da PF, secretário de segurança do DF e ministro da Justiça. | 60 | 110 | 70 | 110 | 60 | 470 | GOLPE | Minuta do Golpe (existente) |
| 23 | Generalzão | Walter Braga Netto | Condenado pelo STF em 2025 | Alakazam (Psychic) | Cérebro e bigode: general da cúpula do plano. Topo da linha Cid > Ramagem > Braga Netto. | 55 | 50 | 45 | 120 | 135 | 500 | GOLPE | Punhal Verde-Amarelo (existente) |
| 24 | Cunhamon | Eduardo Cunha | Condenado na Lava Jato; cassado em 2016 | Cloyster (Water/Ice) | Casca impenetrável: "trusts" e contas escondidas. Defesa 180. | 50 | 95 | 180 | 70 | 85 | 525 | LAVAGEM | Offshore (existente) |
| 25 | Renanzilla | Renan Calheiros | Investigado em vários inquéritos; sem condenação | Muk (Poison) | Lodo que gruda e sobrevive a tudo: décadas de inquéritos sem queda. | 105 | 105 | 75 | 50 | 65 | 500 | CENTRAO | Orçamento Secreto (existente) |
| 26 | Lirassauro | Arthur Lira | Símbolo do orçamento secreto (declarado inconstitucional pelo STF); não condenado | Golem (Rock/Ground) | Rochedo que rola e esmaga: rolo compressor na Câmara. Ataque 120 e defesa 130. | 80 | 120 | 130 | 45 | 55 | 495 | CENTRAO | Orçamento Secreto (existente) |
| 27 | Jucazord | Romero Jucá | Gravado em 2016 falando em "estancar a sangria"; investigado | Golbat (Poison/Flying) | Morcego que suga sangue: ironia, ele queria justamente estancar a sangria. | 75 | 80 | 70 | 90 | 65 | 455 | CENTRAO | Estancar a Sangria (existente) |
| 28 | Temerário | Michel Temer | Denunciado duas vezes no cargo; preso por dias em 2019 | Persian (Normal) | Elegante, felino, joia na testa; evolução de Meowth (Rocha Loures, o homem da mala). | 65 | 70 | 60 | 115 | 65 | 440 | PROPINA | Tem Que Manter Isso (existente) |
| 29 | Gravécio | Aécio Neves | Absolvido em 2022 | Mr. Mime (Psychic) | Teatral, "paredes invisíveis" (defesa de "empréstimo entre amigos"). Absolvido: use o rótulo certo no jogo. | 40 | 45 | 65 | 90 | 100 | 460 | PROPINA | Caixa 2 (existente) |
| 30 | Pedalita | Dilma Rousseff | Impeachment em 2016 (pedaladas); nunca condenada por corrupção | Golduck (Water) | Psyduck/Golduck: confusão verbal (o "dilmês"). Pokémon de peso para ex-presidente. | 80 | 82 | 78 | 85 | 95 | 500 | LAVAGEM | Pedalada Fiscal (existente) |
| 31 | Malufante | Paulo Maluf | Condenado pelo STF em 2017 (lavagem) | Raticate (Normal) | Rato: "rouba mas faz"; em português "rato" é gíria de ladrão e Raticate rouba itens. | 55 | 81 | 60 | 97 | 50 | 413 | LAVAGEM | Rouba Mas Faz (existente) |
| 32 | Confiscollor | Fernando Collor | Condenado pelo STF em 2023 (BR Distribuidora); preso em 2025 | Pinsir (Bug) | Pinça: apanhou a poupança dos brasileiros em 1990. | 65 | 125 | 100 | 85 | 55 | 500 | CENTRAO | Confisco da Poupança (existente) |
| 33 | Bunkerddel | Geddel Vieira Lima | Condenado pelo STF (R$ 51 mi em malas) | Snorlax (Normal) | Enorme, imóvel, dorme sobre tesouro: o bunker de 51 milhões. HP 160. | 160 | 110 | 65 | 30 | 65 | 540 | PROPINA | Bunker de 51 Mi (existente) |
| 34 | Golpenaro | Jair Bolsonaro | Condenado pelo STF (2025) a 27 anos e 3 meses; indiciado nas joias | Charizard (Fire/Flying) | Fogo e voo: Golpe/Fuga, jatinho, embaixada. Final da linha dos filhos. | 78 | 84 | 78 | 100 | 109 | 534 | GOLPE/FUGA | Minuta do Golpe (existente) |

## 2. Cadeias de evolução

Todas fiéis às linhas do Fire Red. As piadas falam de posição, parentesco ou sucessão, nunca de crime não comprovado.

| Linha Pokémon | Políticos | Lógica | Cuidado factual |
|---|---|---|---|
| Charmander > Charmeleon > Charizard | Carluxo > Rachadinho (Flávio) > Golpenaro (Jair) | Filho 02 > filho 01 > pai. Charizard é Fogo/Voo, combinando com Golpe/Fuga. | Carlos e Flávio: investigados; Flávio com provas anuladas. Jair: condenado. |
| Meowth > Persian | Malaloures (Rocha Loures) > Temerário (Temer) | O homem da mala evolui para o chefe de quem era interlocutor. | Não afirmar que a mala era "de Temer": é questão investigada. |
| Rhyhorn > Rhydon | Pezãozinho > Cabralzão | Sucessor e antecessor no governo do RJ. | Pezão: preso em 2018, desfecho não verificado. |
| Koffing > Weezing | Witzelzão > Castrolândia | O vice assume após o impeachment; duas cabeças. | Castro: inelegível, não condenado criminalmente (fonte). |
| Abra > Kadabra > Alakazam | Maurão Cid > Abinzinho (Ramagem) > Generalzão (Braga Netto) | Escala hierárquica da trama golpista: ajudante de ordens, chefe da Abin, general. | Todos condenados na trama; Cid com pena reduzida pela delação. |
| Machop > Machoke > Machamp | Delubião > Genoinho > Mensaleiro (Dirceu) | Tesoureiro > presidente do PT > chefe da Casa Civil, escala do mensalão. | Genoino: pena extinta por indulto. Delúbio: condenação da Lava Jato anulada. |
| Doduo > Dodrio | Ibaneizinho > Minutorres (Torres) | Torres foi secretário de Segurança do DF no governo Ibaneis; Dodrio tem três cabeças (PF, secretaria, ministério). | Ibaneis: inquérito arquivado. Torres: condenado. |
| Kabuto > Kabutops | Azeredinho > Jaderzão | Velha guarda de escândalos antigos. | Jader: desfecho dos processos não verificado. |
| Gastly > Haunter > Gengar (reserva) | Janonudo > (vagas futuras) | Linha fantasma reservada a novos casos de rachadinha. | Janones: apenas investigado. |

Ideia opcional, sem base factual forte e por isso fora das cadeias: Mankey > Primeape.

## 3. Propostas de novos políticos (20)

| # | Jogo | Real | Partido | Fato verificável | Status | Fonte consultada | Pokémon (tipo) | Por quê | HP | Atq | Def | Vel | Esp | Total | Tipo jogo | Golpe |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Delubião | Delúbio Soares | PT | Tesoureiro do PT, expulso do partido em 2005 após o mensalão. Condenado pelo STF em 2012 (corrupção ativa), pena de 8 anos e 11 meses. | Condenado (mensalão). Condenação por lavagem na Lava Jato anulada pelo STJ em 2023. | https://pt.wikipedia.org/wiki/Delúbio_Soares | Machop (Fighting) | Início da escala do PT no mensalão: tesoureiro, depois o presidente, depois o chefe. | 70 | 80 | 50 | 35 | 35 | 305 | PROPINA | Caixa do Partido |
| 2 | Genoinho | José Genoino | PT | Presidente nacional do PT (2002-2005). Condenado por corrupção ativa no mensalão; absolvido do crime de quadrilha em 2014. Pena extinta por indulto em dezembro de 2014. | Condenado (corrupção ativa); pena extinta por indulto. | https://pt.wikipedia.org/wiki/José_Genoíno | Machoke (Fighting) | Meio da linha; o "músculo" do partido. | 80 | 100 | 70 | 45 | 50 | 405 | PROPINA | Empréstimo Bancário |
| 3 | Arrudão | José Roberto Arruda | PSD (ex-DEM) | Ex-governador do DF. Ligado ao caso Caixa de Pandora (recibos do "panetone"); mandato cassado em 2010; preso preventivamente em 2010 e 2017. | Condenado em 2017 por falsidade ideológica (segundo a Wikipédia); demais processos não verificados. | https://pt.wikipedia.org/wiki/José_Roberto_Arruda | Exeggcute (Grass/Psychic) | Seis ovos num cesto = panetone recheado. | 60 | 40 | 80 | 40 | 60 | 325 | PROPINA | Panetone Recheado |
| 4 | Demostênio | Demóstenes Torres | sem partido (ex-DEM) | Ex-senador (GO) e procurador de Justiça. O Senado cassou o mandato em 11/07/2012 por quebra de decoro, após a PF revelar ligações com Carlinhos Cachoeira (Operação Monte Carlo). | Cassado (político); sem condenação criminal registrada na fonte. Nega os fatos. | https://pt.wikipedia.org/wiki/Demóstenes_Torres | Poliwhirl (Water) | Cachoeira, água. Espiral na barriga = hipnose do discurso moralista que ruiu. | 65 | 65 | 65 | 90 | 50 | 385 | DELACAO | Cachoeira de Escutas |
| 5 | Cuecão Rodrigues | Chico Rodrigues | PSB (RR) | Senador. Em outubro de 2020, a PF achou dinheiro escondido junto ao corpo em busca e apreensão; Barroso o afastou por 90 dias. | Investigado; em 2026 Dino arquivou parte a pedido da PGR e o caso segue em apuração. | https://pt.wikipedia.org/wiki/Chico_Rodrigues | Kangaskhan (Normal) | Bolsa-canguru: guardar dinheiro junto ao corpo. | 105 | 95 | 80 | 90 | 40 | 490 | PROPINA | Bolso Fundo |
| 6 | Hildebrandão | Hildebrando Pascoal | ex-PFL (AC) | Ex-coronel da PM e deputado federal; cassado em 22/09/1999. Condenado por liderar grupo de extermínio e por tráfico, entre outros; penas somam mais de 100 anos; cumpre em regime semiaberto, domiciliar com tornozeleira desde 2017. | Condenado. | https://pt.wikipedia.org/wiki/Hildebrando_Pascoal | Scyther (Bug/Flying) | Lâminas. O apelido "deputado da motosserra" é notório, mas NÃO apareceu na página verificada. | 70 | 110 | 80 | 105 | 55 | 500 | GOLPE | Motosserra |
| 7 | Luizão Estevão | Luiz Estevão | MDB (à época) | Primeiro senador cassado (28/06/2000). Condenado em 2006 (31 anos, depois 26) por corrupção ativa, estelionato e peculato no caso do TRT-SP; mantido pelo STF em 2015; indulto de Natal em 2022. | Condenado; pena perdoada por indulto. | https://pt.wikipedia.org/wiki/Luiz_Estevão | Onix (Rock/Ground) | Rocha gigante: o Fórum Trabalhista de obras superfaturadas. Defesa 160. | 35 | 45 | 160 | 70 | 30 | 385 | LAVAGEM | Obra Superfaturada |
| 8 | Guedão Offshore | Paulo Guedes | sem partido | Ex-ministro da Economia. Pandora Papers (out/2021): dono de offshore nas Ilhas Virgens Britânicas, que o ministério diz ter sido declarada à Receita antes do cargo. Pedido de investigação arquivado por Toffoli. | Alvo de pedido de investigação, arquivado. Nada ilegal provado. | https://pt.wikipedia.org/wiki/Paulo_Guedes | Lapras (Water/Ice) | Navega mar afora: offshore. HP 130. | 130 | 85 | 80 | 60 | 85 | 535 | LAVAGEM | Offshore |
| 9 | Pazuelo | Eduardo Pazuello | PL (RJ) | Deputado federal e ex-ministro da Saúde. Inocentado pela Justiça do Amazonas em maio de 2022 no caso do colapso em Manaus. Exército arquivou apuração disciplinar do ato com Bolsonaro (2021). | Inocentado em um caso; demais apurações sem desfecho verificado. | https://pt.wikipedia.org/wiki/Eduardo_Pazuello | Slowbro (Water/Psychic) | Slowbro tem um Shellder preso na cauda que o comanda: "um manda e o outro obedece" (frase famosa, não conferida na fonte). | 95 | 75 | 110 | 30 | 100 | 490 | CENTRAO | Um Manda, Outro Obedece |
| 10 | Maurão Cid | Mauro Cid | sem partido (tenente-coronel) | Ex-ajudante de ordens de Bolsonaro. Delação aceita pela PF em set/2023; condenado em 11/09/2025 a 2 anos em regime aberto na trama golpista, com benefício da delação; indiciado nas joias; preso em maio de 2023 por suspeita de fraude em cartões de vacina. | Condenado (pena reduzida pela delação); indiciado em outros casos. | https://pt.wikipedia.org/wiki/Mauro_Cid | Abra (Psychic) | Dorme e some (Teleport): o delator. Primeiro da linha Cid > Ramagem > Braga Netto. | 25 | 20 | 15 | 90 | 105 | 310 | DELACAO | Delação Premiada |
| 11 | Dallapoint | Deltan Dallagnol | Podemos (à época) | Ex-procurador da Lava Jato. Deputado federal de 1º/02 a 06/06/2023: o TSE cassou seu registro em 16/05/2023 por fraude à Lei da Ficha Limpa e a Câmara confirmou a perda. | Cassado na Justiça Eleitoral. Sem condenação criminal. | https://pt.wikipedia.org/wiki/Deltan_Dallagnol | Porygon (Normal) | Pokémon digital: o célebre PowerPoint da Lava Jato (não conferido na fonte). | 65 | 60 | 70 | 40 | 85 | 395 | DELACAO | Slide Acusatório |
| 12 | Gleisinha | Gleisi Hoffmann | PT (PR) | Deputada federal e ex-presidente do PT. Denunciada em 2016 na Lava Jato; absolvida pela 2ª Turma do STF em 19/06/2018 por falta de provas. | Absolvida. | https://pt.wikipedia.org/wiki/Gleisi_Hoffmann | Arcanine (Fire) | Cão leal e combativo: defensora do partido. Absolvida: sem rótulo de condenada. | 90 | 110 | 80 | 95 | 100 | 555 | CENTRAO | Articulação Política |
| 13 | Pimentelão | Fernando Pimentel | PT (MG) | Ex-governador de MG. Denunciado pela PGR (Acrônimo, 2016; caixa 2, 2018). Absolvido de caixa 2 em 2019; Acrônimo arquivado em 2020; denúncia da Lava Jato rejeitada em 2021. | Absolvido / denúncias rejeitadas. Sem condenação. | https://pt.wikipedia.org/wiki/Fernando_Pimentel | Magmar (Fire) | Trocadilho com o nome (pimenta). Só piada de nome, não de crime. | 65 | 95 | 57 | 93 | 100 | 495 | LAVAGEM | Operação Acrônimo |
| 14 | Betão Richa | Beto Richa | PSDB (PR) | Ex-governador do PR. Preso e solto três vezes (set/2018, jan/2019, mar/2019), em poucos dias cada; condenado em 2ª instância em ago/2018 pelo caso de uma parada em Paris em viagem à China (segundo a Wikipédia); desfecho de outros processos não verificado. | Denunciado; condenações além da fonte não confirmadas. | https://pt.wikipedia.org/wiki/Beto_Richa | Magikarp (Water) | Salta, cai e volta: porta giratória das prisões. | 20 | 10 | 55 | 80 | 15 | 200 | PROPINA | Preso e Solto |
| 15 | Jaderzão | Jader Barbalho | MDB (PA) | Ex-presidente do Senado. Renunciou à presidência em set/2001 e ao mandato em out/2001 sob denúncias de desvio de verbas da Sudam, do Banpará e do Incra; preso por alguns dias em 2002. | Alvo de denúncias; desfecho dos processos não verificado. | https://pt.wikipedia.org/wiki/Jader_Barbalho | Kabutops (Rock/Water) | Veterano fóssil que sobrevive há décadas. Linha Azeredinho (Kabuto) > Jader (Kabutops) = velha guarda. | 60 | 115 | 105 | 80 | 65 | 495 | CENTRAO | Sudam Selvagem |
| 16 | Sostenão | Sóstenes Cavalcante | PL (RJ) | Deputado federal. A PF apreendeu cerca de R$ 470 mil em espécie em dez/2025 e apontou indícios de uso indevido da cota parlamentar; em 01/07/2026 foi alvo de busca por suspeita de escritura forjada. Nega e alega perseguição. | Investigado; sem decisão sobre responsabilidade penal. | https://pt.wikipedia.org/wiki/Sóstenes_Cavalcante | Ditto (Normal) | Transforma-se em outra coisa: a suposta escritura forjada. Sempre "suposta". | 48 | 48 | 48 | 48 | 48 | 288 | PROPINA | Escritura Clonada |
| 17 | Castrolândia | Cláudio Castro | PL (RJ) | Governou o RJ de 2021 a 23/03/2026. O TSE o tornou inelegível por oito anos em 24/03/2026 (abuso de poder, caso Ceperj/Uerj); recursos rejeitados em 02/06/2026. PF fez buscas em maio de 2026 (Refit, Rioprevidência). | Inelegível (Justiça Eleitoral); investigado em casos criminais. | https://pt.wikipedia.org/wiki/Cláudio_Castro | Weezing (Poison) | Evolução de Witzel (Koffing): era o vice e assumiu. Duas cabeças = governador e ex-vice. | 65 | 90 | 120 | 60 | 85 | 490 | CENTRAO | Folha da Ceperj |
| 18 | Ciromaster | Ciro Nogueira | PP (PI) | Senador, ex-ministro da Casa Civil. Alvo da Operação Compliance Zero (mai/2026, Banco Master); investigado na Lava Jato; STF arquivou denúncia de obstrução em 2021. | Investigado; sem condenação na fonte. | https://pt.wikipedia.org/wiki/Ciro_Nogueira | Voltorb (Electric) | Parece uma Poké Ball: trocadilho com "Master" (Master Ball). Piada de nome, não prova nada. | 40 | 30 | 50 | 100 | 55 | 330 | CENTRAO | Master Ball |
| 19 | Far-do-Val | Marcos do Val | Avante (ES) | Senador. Alvo de buscas da PF em 15/06/2023 por suposta obstrução nas apurações do 8 de janeiro; em ago/2025 Moraes suspendeu parte das cautelares, mantendo a proibição de deixar o país. | Investigado. | https://pt.wikipedia.org/wiki/Marcos_do_Val | Farfetch'd (Normal/Flying) | "Far-fetched" = inverossímil. Trocadilho em inglês, só humor. | 52 | 90 | 55 | 60 | 58 | 377 | FAKE | História Mirabolante |
| 20 | Ibaneizinho | Ibaneis Rocha | MDB (DF) | Governador do DF de 2019 a 28/03/2026. Afastado por 90 dias por Moraes em 09/01/2023 por suposta omissão no 8 de janeiro; afastamento revogado em 15/03/2023; inquérito arquivado em mar/2025. | Investigação arquivada. Em 2026 enfrentou pedidos de impeachment ligados ao BRB (desfecho não informado). | https://pt.wikipedia.org/wiki/Ibaneis_Rocha | Doduo (Normal/Flying) | Duas cabeças. Evolui para Dodrio (Torres, que foi seu secretário de Segurança). | 35 | 85 | 45 | 75 | 35 | 310 | CENTRAO | Afastamento de 90 Dias |

Cobertura: PT (Delúbio, Genoino, Gleisi, Pimentel), PSDB (Beto Richa), MDB (Jader, Ibaneis, Luiz Estevão à época), PL (Pazuello, Sóstenes, Castro), PP (Ciro Nogueira), PSB (Chico Rodrigues), PSD (Arruda), Avante (Marcos do Val) e outros (Guedes, Cid, Demóstenes, Hildebrando, Dallagnol).

A página https://radar.congressoemfoco.com.br/parlamentares/camara foi aberta, mas só devolveu o título (conteúdo carregado por JavaScript); por isso as fontes acima são páginas da Wikipédia em pt efetivamente lidas.

## 4. Pendências e fatos não verificados

- Radar do Congresso em Foco: sem conteúdo extraível; APIs da Câmara e do Senado não consultadas.
- Roberto Jefferson (Granadeiro): não verifiquei se ele está vivo; creio que haja notícia de falecimento em 2025 (de memória). Conferir antes de manter o texto no presente.
- Pezão, Witzel, Rocha Loures, Lira, Jucá, Temer, Cunha, Garotinho, Geddel, Janones: o status do `data.js` não foi reconferido; o desfecho judicial atual (condenação, anulação, absolvição) precisa de checagem. Em especial Witzel (impeachment não é condenação criminal) e Temer (denúncias e prisão de 2019, desfecho não conferido).
- Hildebrando Pascoal: o apelido "deputado da motosserra" é notório mas não estava na página lida.
- Pazuello ("um manda e o outro obedece") e Dallagnol (PowerPoint): frases e episódios notórios não conferidos nas fontes.
- Beto Richa: a condenação em 2ª instância vem só da Wikipédia; desfecho dos demais processos desconhecido.
- Jader Barbalho: resultado das ações não foi lido. Crivella foi retirado da lista por falta de desfecho verificado.
- Datas de 2026 (Castro, Sóstenes, Ciro Nogueira, Ibaneis, Chico Rodrigues) vêm da Wikipédia e podem mudar; conferir em notícia primária.
- Os trocadilhos de nome (Pimentel/Magmar, Ciro/Voltorb, Do Val/Farfetch'd) são só piada, sem relação com o caso.

## 5. Bloco legível por máquina (elenco atual)

```json
{
 "delcidiao": {
  "pokemon": "Lickitung",
  "hp": 90,
  "atk": 55,
  "def": 75,
  "spd": 30
 },
 "palocciu": {
  "pokemon": "Drowzee",
  "hp": 60,
  "atk": 48,
  "def": 45,
  "spd": 42
 },
 "machadao": {
  "pokemon": "Ekans",
  "hp": 35,
  "atk": 60,
  "def": 44,
  "spd": 55
 },
 "garotinho": {
  "pokemon": "Clefairy",
  "hp": 70,
  "atk": 45,
  "def": 48,
  "spd": 35
 },
 "janonudo": {
  "pokemon": "Gastly",
  "hp": 30,
  "atk": 35,
  "def": 30,
  "spd": 80
 },
 "pezao": {
  "pokemon": "Rhyhorn",
  "hp": 80,
  "atk": 85,
  "def": 95,
  "spd": 25
 },
 "witzel": {
  "pokemon": "Koffing",
  "hp": 40,
  "atk": 65,
  "def": 95,
  "spd": 35
 },
 "silveirao": {
  "pokemon": "Mankey",
  "hp": 40,
  "atk": 80,
  "def": 35,
  "spd": 70
 },
 "carluxo": {
  "pokemon": "Charmander",
  "hp": 39,
  "atk": 52,
  "def": 43,
  "spd": 65
 },
 "azeredinho": {
  "pokemon": "Kabuto",
  "hp": 30,
  "atk": 80,
  "def": 90,
  "spd": 55
 },
 "malaloures": {
  "pokemon": "Meowth",
  "hp": 40,
  "atk": 45,
  "def": 35,
  "spd": 90
 },
 "codevasfo": {
  "pokemon": "Ponyta",
  "hp": 50,
  "atk": 85,
  "def": 55,
  "spd": 90
 },
 "boiadeiro": {
  "pokemon": "Tauros",
  "hp": 75,
  "atk": 100,
  "def": 95,
  "spd": 110
 },
 "rachadinho": {
  "pokemon": "Charmeleon",
  "hp": 58,
  "atk": 64,
  "def": 58,
  "spd": 80
 },
 "zambellina": {
  "pokemon": "Ninetales",
  "hp": 73,
  "atk": 76,
  "def": 75,
  "spd": 100
 },
 "granadeiro": {
  "pokemon": "Electrode",
  "hp": 60,
  "atk": 50,
  "def": 70,
  "spd": 150
 },
 "valdemensal": {
  "pokemon": "Kingler",
  "hp": 55,
  "atk": 130,
  "def": 115,
  "spd": 75
 },
 "mensaleiro": {
  "pokemon": "Machamp",
  "hp": 90,
  "atk": 130,
  "def": 80,
  "spd": 55
 },
 "cabralzao": {
  "pokemon": "Rhydon",
  "hp": 105,
  "atk": 130,
  "def": 120,
  "spd": 40
 },
 "tarifardo": {
  "pokemon": "Fearow",
  "hp": 65,
  "atk": 90,
  "def": 65,
  "spd": 100
 },
 "abinzinho": {
  "pokemon": "Kadabra",
  "hp": 40,
  "atk": 35,
  "def": 30,
  "spd": 105
 },
 "minutorres": {
  "pokemon": "Dodrio",
  "hp": 60,
  "atk": 110,
  "def": 70,
  "spd": 110
 },
 "generalzao": {
  "pokemon": "Alakazam",
  "hp": 55,
  "atk": 50,
  "def": 45,
  "spd": 120
 },
 "cunhamon": {
  "pokemon": "Cloyster",
  "hp": 50,
  "atk": 95,
  "def": 180,
  "spd": 70
 },
 "renanzilla": {
  "pokemon": "Muk",
  "hp": 105,
  "atk": 105,
  "def": 75,
  "spd": 50
 },
 "lirassauro": {
  "pokemon": "Golem",
  "hp": 80,
  "atk": 120,
  "def": 130,
  "spd": 45
 },
 "jucazord": {
  "pokemon": "Golbat",
  "hp": 75,
  "atk": 80,
  "def": 70,
  "spd": 90
 },
 "temerario": {
  "pokemon": "Persian",
  "hp": 65,
  "atk": 70,
  "def": 60,
  "spd": 115
 },
 "gravecio": {
  "pokemon": "Mr. Mime",
  "hp": 40,
  "atk": 45,
  "def": 65,
  "spd": 90
 },
 "pedalita": {
  "pokemon": "Golduck",
  "hp": 80,
  "atk": 82,
  "def": 78,
  "spd": 85
 },
 "malufante": {
  "pokemon": "Raticate",
  "hp": 55,
  "atk": 81,
  "def": 60,
  "spd": 97
 },
 "confiscollor": {
  "pokemon": "Pinsir",
  "hp": 65,
  "atk": 125,
  "def": 100,
  "spd": 85
 },
 "bunkerddel": {
  "pokemon": "Snorlax",
  "hp": 160,
  "atk": 110,
  "def": 65,
  "spd": 30
 },
 "golpenaro": {
  "pokemon": "Charizard",
  "hp": 78,
  "atk": 84,
  "def": 78,
  "spd": 100
 }
}
```

### Propostos

```json
{
 "delubiao": {
  "pokemon": "Machop",
  "hp": 70,
  "atk": 80,
  "def": 50,
  "spd": 35,
  "type": "PROPINA"
 },
 "genoinho": {
  "pokemon": "Machoke",
  "hp": 80,
  "atk": 100,
  "def": 70,
  "spd": 45,
  "type": "PROPINA"
 },
 "arrudao": {
  "pokemon": "Exeggcute",
  "hp": 60,
  "atk": 40,
  "def": 80,
  "spd": 40,
  "type": "PROPINA"
 },
 "demostenio": {
  "pokemon": "Poliwhirl",
  "hp": 65,
  "atk": 65,
  "def": 65,
  "spd": 90,
  "type": "DELACAO"
 },
 "cuecao": {
  "pokemon": "Kangaskhan",
  "hp": 105,
  "atk": 95,
  "def": 80,
  "spd": 90,
  "type": "PROPINA"
 },
 "hildebrandao": {
  "pokemon": "Scyther",
  "hp": 70,
  "atk": 110,
  "def": 80,
  "spd": 105,
  "type": "GOLPE"
 },
 "luizao": {
  "pokemon": "Onix",
  "hp": 35,
  "atk": 45,
  "def": 160,
  "spd": 70,
  "type": "LAVAGEM"
 },
 "guedao": {
  "pokemon": "Lapras",
  "hp": 130,
  "atk": 85,
  "def": 80,
  "spd": 60,
  "type": "LAVAGEM"
 },
 "pazuelo": {
  "pokemon": "Slowbro",
  "hp": 95,
  "atk": 75,
  "def": 110,
  "spd": 30,
  "type": "CENTRAO"
 },
 "maurao": {
  "pokemon": "Abra",
  "hp": 25,
  "atk": 20,
  "def": 15,
  "spd": 90,
  "type": "DELACAO"
 },
 "dallapoint": {
  "pokemon": "Porygon",
  "hp": 65,
  "atk": 60,
  "def": 70,
  "spd": 40,
  "type": "DELACAO"
 },
 "gleisinha": {
  "pokemon": "Arcanine",
  "hp": 90,
  "atk": 110,
  "def": 80,
  "spd": 95,
  "type": "CENTRAO"
 },
 "pimentelao": {
  "pokemon": "Magmar",
  "hp": 65,
  "atk": 95,
  "def": 57,
  "spd": 93,
  "type": "LAVAGEM"
 },
 "betao": {
  "pokemon": "Magikarp",
  "hp": 20,
  "atk": 10,
  "def": 55,
  "spd": 80,
  "type": "PROPINA"
 },
 "jaderzao": {
  "pokemon": "Kabutops",
  "hp": 60,
  "atk": 115,
  "def": 105,
  "spd": 80,
  "type": "CENTRAO"
 },
 "sostenao": {
  "pokemon": "Ditto",
  "hp": 48,
  "atk": 48,
  "def": 48,
  "spd": 48,
  "type": "PROPINA"
 },
 "castrol": {
  "pokemon": "Weezing",
  "hp": 65,
  "atk": 90,
  "def": 120,
  "spd": 60,
  "type": "CENTRAO"
 },
 "ciromaster": {
  "pokemon": "Voltorb",
  "hp": 40,
  "atk": 30,
  "def": 50,
  "spd": 100,
  "type": "CENTRAO"
 },
 "farfetchval": {
  "pokemon": "Farfetch'd",
  "hp": 52,
  "atk": 90,
  "def": 55,
  "spd": 60,
  "type": "FAKE"
 },
 "ibaneizinho": {
  "pokemon": "Doduo",
  "hp": 35,
  "atk": 85,
  "def": 45,
  "spd": 75,
  "type": "CENTRAO"
 }
}
```
