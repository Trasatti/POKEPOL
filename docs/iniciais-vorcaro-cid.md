# Iniciais: Vorcarô (Daniel Vorcaro) e Cidelator (Mauro Cid)

Status checado em 19/10/2026. Dados em JSON: `docs/iniciais-vorcaro-cid.json`.
Linha evolutiva de ambos (níveis 1 / 16 / 36): **Preso -> Prisão Domiciliar -> Programa de Proteção à Testemunha**. São piadas de estágio; não afirmam que a pessoa esteja nessas situações (Vorcaro hoje está preso em unidade da PM; Cid cumpre regime aberto).

## Daniel Vorcaro (Banco Master)

Status em out/2026:
- Em 17/11/2025 foi interceptado no aeroporto de Guarulhos ao tentar viajar em jato particular (a PF diz que o destino era Malta; a defesa nega fuga e cita Dubai). A Operação Compliance Zero foi deflagrada em 18/11/2025. Solto pelo TRF-1 no fim de nov/2025, com tornozeleira e passaporte retido.
- Preso de novo em 4/3/2026 (preventiva decretada pelo ministro André Mendonça, STF). Desde 25/6/2026 no "Papudinha" (19º Batalhão da PM, Complexo da Papuda). Em out/2026 segue preso.
- Sem denúncia formal até out/2026 (a defesa pede a revogação da preventiva ao presidente do STF, Edson Fachin; impasse de relatoria desde 12/9/2026).
- Delação: propostas rejeitadas pela PF (20/5 e 10/6/2026) e pela PGR (15/6/2026); relatos de out/2026 indicam que a defesa desistiu de uma terceira.
- Valor: a PF afirma que o Master vendeu ao BRB R$ 12,2 bi em carteiras de crédito sem lastro e supervalorizadas (o diretor-geral da PF falou em fraudes de cerca de R$ 12 bi). Ele nega e diz que a troca de ativos deu resultado positivo ao BRB.
- BRB: em mar/2025 o BRB anunciou a compra do Master por R$ 2 bi; o Banco Central barrou em set/2025. Master em liquidação extrajudicial desde 18/11/2025.
- CDB: o Master ofereceu retornos de até 140% do CDI.

Jogo: Vorcarô, tipos LAVAGEM/FUGA, habilidade Recurso Infinito (`recurso`).

## Mauro Cid

Status em out/2026:
- Preso em 3/5/2023 (Operação Venire, fraude em cartões de vacina). Delação premiada homologada em set/2023; saiu da prisão com tornozeleira (CNN Brasil).
- Condenado em 11/9/2025 pela 1ª Turma do STF a 2 anos de reclusão em regime aberto na trama golpista (pena reduzida pela delação, que Moraes manteve válida).
- Cumpre a pena desde nov/2025: recolhimento domiciliar das 20h às 6h e nos fins de semana, proibição de sair de Brasília sem autorização, de usar redes sociais e apresentação semanal à VEP-DF. Em 13/10/2026 Moraes negou viagem a Abu Dhabi. Já cumpriu 1 ano, 4 meses e 27 dias (contando a preventiva), segundo a imprensa. A defesa tenta abater o recolhimento noturno; agravo pendente.
- O `fact` antigo estava correto, mas sem a execução da pena; foi atualizado.
- Não há "prisão domiciliar" formal: a Wikipédia em inglês diz "house arrest", mas as reportagens brasileiras descrevem regime aberto com recolhimento noturno; prevaleceu a imprensa.
- Joias/relógios: Cid disse à PF que, a mando de Bolsonaro, vendeu relógios (Rolex e Patek Philippe, cerca de US$ 68 mil) e um kit de joias nos EUA. Isso é o que consta na delação; o golpe `cid_rolex` já existia.

## Textos "FICHA DA PF" (máx. 260 caracteres)

- vorcaro (217): "Dono do Banco Master. A PF aponta R$ 12,2 bi em carteiras de crédito sem lastro vendidas ao BRB (Compliance Zero). Preso desde 4/3/2026, sem denúncia até out/2026. PF e PGR rejeitaram 2 propostas de delação. Ele nega."
- cidelator (222): "Ex-ajudante de ordens de Bolsonaro e delator. Em 11/9/2025 o STF o condenou a 2 anos em regime aberto na trama golpista, pena menor pela delação. Cumpre desde nov/2025: recolhimento noturno e proibição de sair de Brasília."

## Design

| | Vorcarô | Cidelator |
|---|---|---|
| Tipos | LAVAGEM / FUGA | DELACAO |
| Habilidade | Recurso Infinito (os recursos a Fachin) | Delação (já existente) |
| stageBase (PS/Atq/Def/AtqEsp/DefEsp/Vel) | 44/40/40/65/55/70 (314); 60/50/55/85/70/85 (405); 78/65/70/115/92/110 (530) | 46/38/58/48/60/65 (315); 60/50/75/65/75/80 (405); 80/62/98/80/100/110 (530) |
| exp / catch | 64 / 45 | 64 / 45 |

DELACAO ganha de LAVAGEM (x2), o que cria rivalidade entre as duas iniciais. Cid ficou com tipo único para evitar a fraqueza x4 a FAKE que um tipo duplo com GOLPE traria. Obs.: o campo `catch` não existe hoje no balance.json; o valor 45 é sugestão (taxa tipo Gen 3).

### Golpes de Vorcarô
| Nv | Chave | Nome | Tipo/cat | Pot/Prec/PP | Efeito |
|---|---|---|---|---|---|
| 1 | vor_cdb | CDB de 140% do CDI | LAVAGEM esp | 40/100/30 | - |
| 1 | vor_jatinho | Jatinho no Aeroporto | FUGA fis | 45/100/25 | speup 30% |
| 7 | vor_carteira | Carteira Sem Lastro | LAVAGEM esp | 60/100/20 | defdown 30% |
| 16 | vor_liquidacao | Liquidação Extrajudicial | LAVAGEM esp | 70/90/15 | flinch 30% |
| 20 | vor_brb | Compra pelo BRB | LAVAGEM esp | 75/90/15 | drain |
| 25 | vor_fgc | Pagamento do FGC | LAVAGEM status | -/100/10 | heal |
| 28 | vor_cautelares | Tornozeleira do TRF-1 | NORMAL status | -/100/20 | defup |
| 33 | vor_delacao_recusada | Delação Recusada | LAVAGEM esp | 85/85/10 | recoil |
| 40 | vor_voo | Voo Interrompido | FUGA fis | 90/90/10 | flinch 30% |
| 45 | vor_compliance | Compliance Zero | LAVAGEM esp | 100/80/5 | investigado 30% |

### Golpes de Cidelator
| Nv | Chave | Nome | Tipo/cat | Pot/Prec/PP | Efeito |
|---|---|---|---|---|---|
| 1 | dedurar (existente) | Dedurar | DELACAO esp | 40/100/30 | - |
| 1 | cid_ajudante (existente) | Ajudante de Ordens | DELACAO esp | 40/100/30 | - |
| 6 | cid_celular (existente) | Celular Apreendido | DELACAO esp | 52/100/25 | - |
| 10 | sig_cidelator (existente) | Cartão de Vacina | DELACAO esp | 62/95/20 | defdown 30% |
| 15 | cid_audios | Áudios Vazados | DELACAO esp | 60/95/20 | confuso 30% |
| 20 | cid_rolex (existente) | Venda do Rolex | DELACAO esp | 68/95/15 | - |
| 26 | cid_contrad (existente) | Depoimentos Contraditórios | DELACAO esp | 76/90/10 | confuso 30% |
| 30 | cid_acordo | Acordo Homologado | DELACAO status | -/100/20 | defup |
| 34 | cid_sigilo | Sigilo Derrubado | DELACAO esp | 80/90/10 | spddown 30% |
| 38 | cid_regime | Regime Aberto | NORMAL status | -/100/10 | heal |
| 45 | delacao (existente) | Delação Premiada | DELACAO esp | 85/85/10 | - |

"Mensagem Apagada" foi descartada: não encontrei episódio documentado com esse nome. O golpe "Jatinho Emprestado" também foi trocado por "Jatinho no Aeroporto", que se apoia no episódio documentado de 17/11/2025.

## Fontes

- Gazeta do Povo, 16/10/2026 (R$ 12,2 bi sem lastro ao BRB, Tirreno, Papuda): https://www.gazetadopovo.com.br/republica/vorcaro-nega-fraude-12-bi-brb-chama-compliance-zero-acodada/
- Gazeta do Povo, 2/10/2026 (delação, sem denúncia): https://www.gazetadopovo.com.br/republica/daniel-vorcaro-desiste-de-delacao-premiada-e-foca-estrategia-na-liberdade/
- Migalhas, 18/9/2026 (preso desde 4/3, sem denúncia, impasse no STF): https://www.migalhas.com.br/quentes/464830/vorcaro-pede-a-fachin-fim-da-prisao-e-aponta-impasse-no-stf
- Times Brasil, 19/9/2026 (200 dias, tornozeleira em nov/2025): https://timesbrasil.com.br/brasil/vorcaro-completa-neste-domingo-200-dias-preso-com-delacao-travada-e-caso-master-estremecendo-o-stf/
- Conjur, 4/3/2026 (nova prisão): https://conjur.com.br/2026-mar-04/daniel-vorcaro-dono-do-banco-master-e-preso-novamente-pela-pf/
- Wikipedia, Banco Master scandal (cronologia; datas das rejeições da delação e do Papudinha, conferir com a imprensa): https://en.wikipedia.org/wiki/Banco_Master_scandal
- InfoMoney, prisão em Guarulhos em 17/11/2025: https://www.infomoney.com.br/?p=3109487
- Diário de Pernambuco, jatinho: https://www.diariodepernambuco.com.br/brasil/2025/11/11700797-dono-do-master-tentou-fugir-para-exterior-em-jatinho-e-foi-preso-pela-pf-no-aeroporto.html
- Monitor Mercantil (BRB, Banco Central, PF cita R$ 12 bi): https://monitormercantil.com.br/justica-afasta-presidente-e-diretor-do-brb/
- O Tempo, 13/10/2026 (Cid, Moraes nega viagem): https://otempo.com.br/politica/judiciario/2026/10/13/mauro-cid-pede-mas-moraes-nega-viagem-a-abu-dhabi-para-congresso-de-medicina-militar
- Por Brasília, 16/8/2026 (condições do regime aberto): https://porbrasilia.com.br/2026/08/16/defesa-de-cid-ve-chance-de-encerrar-cumprimento-de-pena-apos-decisao-do-stf/
- Gazeta do Povo, condenação em 11/9/2025: https://www.gazetadopovo.com.br/republica/mauro-cid-e-condenado-a-dois-anos-de-prisao-em-regime-aberto/
- CNN Brasil, trajetória de Cid (prisão em 3/5/2023, delação, joias US$ 86 mil, áudios): https://www.cnnbrasil.com.br/politica/mauro-cid-a-trajetoria-do-ajudante-de-ordens-que-virou-delator/
- Poder360 (venda de relógios e joias): https://www.poder360.com.br/justica/cid-vai-dizer-que-vendeu-joias-a-mando-de-bolsonaro/

## Ressalvas

- Fontes divergem sobre se Vorcaro chegou a embarcar no jato em 17/11/2025 (O Globo: não embarcou) e sobre o destino (Malta vs Dubai). Por isso o golpe diz "interrompido" e o texto não afirma fuga.
- Soltura pelo TRF-1: 28 ou 29/11/2025 (fontes divergem); o jogo diz só "nov/2025".
- A delação de Vorcaro em out/2026 tem versões conflitantes (desistência de terceira proposta vs. defesa tentando reabrir); o `fact` cita só as duas rejeições documentadas.
- "Sem denúncia até out/2026": última confirmação em 16/10/2026 (inquérito em curso); revalidar antes do lançamento.
- Local de nascimento (`uf`: MG para Vorcaro, RJ para Cid) vem de conhecimento geral/Wikipédia; não verificado em fonte de imprensa nesta pesquisa.
