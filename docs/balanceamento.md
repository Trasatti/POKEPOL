# Balanceamento POKÉPOL (resumo)

Arquivo de contrato: `docs/balanceamento.json` (gerado e validado; todo golpe de `learn` existe em `moves`, que cobre todos os ids do `data.js`).

## Abordagem
- Stats base: Gen 3 do Pokémon mapeado, reescalados para uma soma (BST) alvo por zona: Rota 1 ~300, Rio/mata ~380, Esplanada ~440-460, chefes e raros 410-490 (Cabralzão 410, Cunhamon 440, Bunkerddel 460, Golpenaro 490).
- Iniciais no padrão Gen 1 (~313-314): Rachadinho, Lirassauro, Tarifardo. Eles têm `stageBase` (405 no 2º estágio, 530 no 3º do Lirassauro), para o Tarifardo chefe (nível 28) não ficar fraco.
- Categoria fixa por tipo, como na Gen 3: físicos = PROPINA, GOLPE, RACHADINHA, FUGA, NORMAL; especiais = LAVAGEM, DELACAO, FAKE, CENTRAO. Se o Pokémon original tinha o stat ofensivo "errado" para o tipo do político, Atk e SpA foram trocados.
- Fórmula sugerida: stat = floor((2*base+31)*nível/100)+5; HP = floor((2*base+31)*nível/100)+nível+10. XP: curva medium-fast (n^3), ganho = exp*nívelInimigo/7 (x1.5 contra treinador). `exp` é o base exp Gen 3 do mapeado.
- Níveis: zona 1 = 2-6, zona 2 = 7-13, zona 3 = 13-24. Chefes: Cabral 11-14 (Brock), Cunha 17-21 (Misty), Bolsonaro 26-30 (Giovanni comprimido). Os mesmos ids de antes.
- Golpes: nível 1 sempre com poder 35-50; golpes fortes (75-95) só a partir do nível 14-30. Alguns poderes mudaram em relação ao `data.js` para suavizar o início: Motociata 50, Disparo em Massa 50, Jatinho da FAB 50, Fuga pro Exterior 50. `chance` é a % do efeito secundário; 100 para golpes de status e efeitos intrínsecos (drain, multi, critico, fixo).
- Sugestão: usar os 4 últimos golpes aprendidos até o nível atual.
- Carreiras: só cargos reais, em ordem cronológica, com no máximo 4 estágios (1 estágio = sem evolução). Quando havia dúvida, usei menos estágios. Golpenaro evolui para Presidente no nível 28 (fora da regra 32-36) para o chefe final já aparecer presidente.
- Habilidades: as 12 do motor, atribuídas por tema (Malaloures e Zambellina: Fujão; Temer e Renan: Imunidade; Cunha e Cabral: Recurso Infinito e Foro; Cid e Delcídio: Delação).
- Golpes de assinatura de investigados usam linguagem de suspeita ("ele nega") nas descrições.

## Novos golpes
saidinha (prioridade +1), mensalao (multi), corrida, dois_milhoes, codevasf, inquerito, vista, narrativa, sig_witzel, sig_silveira.

## Golpes pessoais (revisão)
Todo político tem 6-8 golpes próprios, do mais fraco (nível 1, poder 40-45) ao golpe de assinatura (80-95). No máximo um golpe genérico por político. Golpes compartilhados só entre envolvidos no mesmo caso. Chefes (Cabral, Cunha, Bolsonaro) têm a assinatura em nível compatível com o nível do chefe.
