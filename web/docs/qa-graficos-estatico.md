# QA estático de gráficos: POKÉPOL (web/)

Escopo: somente leitura. Nenhum arquivo do projeto foi editado; este relatório é o único arquivo criado.

## Método

- `js/data.js`, `js/art.js` e `js/map.js` foram carregados em um contexto `vm` do Node 24 (`buildWorld()` executado com `drawBuilding` substituído por stub). Foram extraídos 199 prédios, 27 cidades, a grade de tiles 510x510 e a máscara de terra.
- Pillow 12.2 mediu os PNGs. Os índices foram comparados com o mapa.
- Verificações: 1) tamanho dos PNGs de prédios; 2) `assets/landmarks/index.json` vs. w/h do mapa; 3) footprints, sobreposições e porta; 4) árvores fora de bloco 2x2 alinhado; 5) `sprites/index.json` e sprites de POLITICOS; 6) kinds de tile vs. builder procedural.

## Resumo

| Verificação | Resultado |
|---|---|
| 1. PNG de prédio ausente ou com tamanho errado | 0 de 53 (ausentes: 0; divergentes: 0) |
| 2. index.json de landmarks vs. mapa | 0 divergências de w/h (27 landmarks e 26 palácios; Brasília não tem palácio, o que é esperado) |
| 3. Footprint fora do mapa / sobreposição / porta sem caminho abaixo | 0 / 0 / 0 (199 prédios, 172 portas) |
| 4. Árvores fora de bloco 2x2 alinhado | **161 tiles em 80 blocos parciais** (todos fora da máscara de terra) |
| 5. sprites/index.json e POLITICOS | 0 PNG faltando; 45 de 45 POLITICOS com frente e costas; 3 PNGs órfãos; 91 sprites de 256x256 |
| 6. Kinds de tile sem entrada procedural | só `bld` (3539 tiles, todos dentro de footprints) |

## Achados, do mais grave ao menos grave

### 1. Árvores desalinhadas (média): 161 tiles em 80 blocos parciais

Causa: em `js/map.js`, o laço de alinhamento de árvores (linhas 374 a 383) faz `if (!land[i]) continue;`. Os tiles fora da máscara de terra recebem `tree` no terreno base (linhas ~358 a 371, `ocean ? 'water' : 'tree'`) e não passam pelo alinhamento. A limpeza de pinheiros incompletos (linha 710 em diante) também só atua em tiles de terra. Por isso, blocos 2x2 que cruzam a borda da máscara de terra ficam com 1 a 3 árvores. Nenhuma árvore dentro de cidade ou de rota de terra está desalinhada.

Agrupamento por cidade (caixa da cidade com margem de 7 tiles, pelo canto do bloco):

- **boa_vista**: 10 blocos, 19 tiles. Exemplos (canto superior esquerdo): (188,30), (188,32), (188,34), (188,36). Trata-se da borda leste da caixa, onde a terra acaba em x=188.
- **rio_branco**: 2 blocos, 4 tiles. Exemplos: (104,200), (104,202).
- **porto_velho**: 1 bloco, 2 tiles. Exemplo: (112,202).
- **Fora de cidade** (fronteira e litoral, sobretudo ao norte e a leste): 67 blocos, 136 tiles. Exemplos: (276,22), (190,42), (194,44), (196,44). Em (190,42) e (194,44) a árvore fica logo a leste da caixa de Boa Vista, fora da margem de 7.

Observação: não há renderização real, então o impacto visual é uma inferência. A árvore parcial fica na borda do território jogável e tende a aparecer "cortada" ao lado da terra.

Correção sugerida (não aplicada): estender o alinhamento e a limpeza para os tiles não-terra que são `tree` (ou tratar a moldura de árvores como uma região à parte com o mesmo laço de blocos 2x2).

### 2. Tile `bld` sem entrada no builder procedural (baixa)

`bld` aparece em 3539 tiles, exatamente a área somada dos footprints (sem tiles órfãos). Ele não tem `mk('bld', ...)` em `art.js` (lista de `mk`: grass, tall, path, sand, water, tree, flower, fence, sign, lawn, pool). O renderizador trata isso em `js/game.js` linha 512 (`if (k === 'bld') k = y < 14 ? 'lawn' : 'grass'`), então não há falha em runtime. Só vale registrar: o `bld` depende desse fallback.

### 3. Sprites de POLITICOS com 256x256 e PNGs órfãos (baixa)

- Os 91 PNGs de `sprites/` (45 frentes, 45 costas e `dino.png`) são 256x256. O código desenha em 96x96 (`politicoSprite` em `art.js` linha 631 e seguintes, `drawImage(custom, 0, 0, 96, 96)`), e `mkCanvas` define `imageSmoothingEnabled = false`. A redução de 256 para 96 sem suavização pode gerar serrilhado e aliasing. Não é erro de tamanho, mas vale revisar a arte ou a escala.
- Órfãos em `sprites/`: `palocciu.png` e `pedalita.png` não estão no `sprites/index.json` e não são referenciados em `js/`. `dino_back.png` existe mas não está no índice, então `loadCustomSprites` nunca o carrega (nenhuma referência em `js/`).

### 4. Sprites de prédios, landmarks e palácios (ok)

- 53 PNGs de prédios (27 landmarks, 26 palácios): todos existem e todos têm tamanho (w*16, h*16). Lista de divergências vazia.
- `assets/landmarks/index.json` tem 27 cidades e nenhuma entrada extra. As dimensões batem com o mapa em todas as cidades. Os 53 PNGs em `assets/landmarks/` batem com o index.
- Casos especiais: `guanabara` (palácio do Rio) usa `riodejaneiro_palacio.png`, e `brasilia` usa `brasilia.png` (6x6). Ambos conferem.

### 5. Prédios, footprints e portas (ok)

- 199 prédios: 0 fora do mapa, 0 sobreposições entre footprints.
- 172 prédios com porta (todos menos os 27 landmarks, que têm `door = null`): a porta é `bld` e o tile logo abaixo é walkable em todos.
- `sprites/index.json` tem 91 entradas, todas com PNG existente. Os 45 POLITICOS têm frente e costas.

### 6. Autotile (ok)

`AUTOTILE_KINDS` = `path`, `water`, `sand`, `pool`. Os quatro têm `mk` procedural e conjunto em `_fan.at` (quando a arte fan carrega). Todos os kinds usados em `World.tiles` (grass, tall, path, sand, water, tree, flower, fence, sign, lawn, pool, bld) têm entrada procedural, exceto `bld` (ver item 2).

## Dados brutos

Os scripts de extração e os JSONs intermediários ficaram na pasta de scratchpad da sessão (`dump.js`, `analyze.js`, `qa.py`, `trees.js`, `nb.js`). Nada foi escrito no projeto.
