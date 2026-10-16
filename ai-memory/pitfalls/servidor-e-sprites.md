# Armadilhas conhecidas

- Servidor local: `.claude/launch.json` usa `python -m http.server 8791 --directory web` com porta fixa (autoPort desligado); se a porta mudar, o python não acompanha.
- Sprites de foto ficam em web/sprites/<id>.png e só carregam se o id estiver em web/sprites/index.json (evita 404 em massa).
- Heredoc com aspas simples dentro de python inline no bash quebrou; para patches grandes, gravar o script em arquivo e rodar.
- Testes no navegador: o painel é compartilhado com o usuário; não sobrescrever o save (localStorage `pokepol-save-v1`) — nos testes, substituir `saveGame` por no-op.
