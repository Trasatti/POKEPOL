# POKÉPOL — Edição Polícia Federal

Jogo de navegador no estilo Pokémon (Fire Red / fan games de 4ª-5ª geração) em que o jogador é um agente da Polícia Federal e os "monstros" são políticos brasileiros com casos documentados. A viagem passa pelas 27 capitais, de Curitiba a Brasília, atravessando os biomas brasileiros.

> **Paródia sem fins lucrativos.** Os textos se baseiam em notícias públicas, com o status de cada caso (condenado, investigado, denunciado, absolvido, anulado). Investigados não condenados são presumidos inocentes.

## Como jogar

```bash
python -m http.server 8791 --directory web
```

Abra `http://localhost:8791`.

- Setas ou WASD: andar (segure X para correr)
- Z / Espaço: botão A · X / Esc: botão B · Enter: menu
- F: tela cheia · N: minimapa

No celular, deite o aparelho e use os controles de toque.

## Estrutura

- `web/` — o jogo (HTML/JS puro, sem build)
  - `js/data.js` políticos, golpes, itens, chefões
  - `js/rules.js` regras de batalha (3ª geração), habilidades, carreira/evolução
  - `js/map.js` mapa do Brasil, capitais, biomas, áreas de encontro
  - `js/art.js` arte (tiles, prédios, personagens)
  - `js/game.js` motor, interface, batalha, save
  - `data/balance.json` equilíbrio, carreiras e golpes de cada político
  - `sprites/` caricaturas · `assets/` tilesets e cartões-postais
- `docs/` análises (mapeamentos Pokémon ↔ político, cidades, balanceamento)
- `tools/` scripts que geram caricaturas e cartões-postais
- `ai-memory/` decisões, regras e passagens de bastão entre sessões

## Créditos

Veja `web/assets/CREDITOS.md`, `web/assets/fan/CREDITOS.md`, `web/assets/landmarks/CREDITOS.md` e `web/sprites/CREDITOS.md`. Pokémon é marca da Nintendo/Game Freak/The Pokémon Company; este projeto não tem relação com elas e não usa arte oficial.
