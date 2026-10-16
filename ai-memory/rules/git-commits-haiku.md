# Regra: commits e push com agente Haiku

- Repositório: https://github.com/Trasatti/POKEPOL (público), branch `main`.
- Commits e push são feitos por um subagente com modelo **Haiku**, para economizar tokens; o agente principal só prepara o trabalho e pede o commit.
- Nunca versionar `rom/`, instaladores `.exe`, ROMs ou as fotos brutas (`tools/fotos/`) — ver `.gitignore`.
- Mensagens de commit em português, curtas, descrevendo o que mudou no jogo.
