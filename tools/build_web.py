"""Gera versões .js dos dados (sprites/index.json e data/balance.json) para o jogo
funcionar também abrindo o index.html direto (file://), onde o navegador bloqueia fetch().
Rode depois de mudar caricaturas ou o balanceamento:  python tools/build_web.py
"""
import json, pathlib
web = pathlib.Path(__file__).resolve().parent.parent / 'web'
pairs = [(web / 'sprites/index.json', web / 'sprites/index.js', 'SPRITE_LIST'),
         (web / 'data/balance.json', web / 'data/balance.js', 'BALANCE_DATA')]
for src, dst, var in pairs:
    data = json.loads(src.read_text(encoding='utf-8'))
    dst.write_text(f'// Gerado por tools/build_web.py a partir de {src.name}. Não editar à mão.\nwindow.{var} = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
    print('ok', dst.relative_to(web))
