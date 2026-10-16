"""Gera dist/POKEPOL.html: o jogo inteiro num único arquivo (código, estilos, imagens e dados embutidos),
para mandar por WhatsApp/e-mail e abrir em qualquer navegador, inclusive no celular.
Uso:  python tools/build_single.py
"""
import base64, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
OUT = ROOT / 'dist' / 'POKEPOL.html'

html = (WEB / 'index.html').read_text(encoding='utf-8')
strip_v = lambda p: p.split('?')[0]

# Todas as imagens e JSONs usados em tempo de execução
assets = {}
for folder in ['sprites', 'assets', 'data']:
    for f in sorted((WEB / folder).rglob('*')):
        if f.suffix.lower() == '.png':
            assets[f.relative_to(WEB).as_posix()] = 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode()
        elif f.suffix.lower() == '.json':
            assets[f.relative_to(WEB).as_posix()] = json.loads(f.read_text(encoding='utf-8'))

# Antes de tudo: troca caminhos de imagem por data: URIs e responde fetch() de JSON localmente
shim = """<script>
window.EMBEDDED_ASSETS = %s;
(function () {
  const A = window.EMBEDDED_ASSETS, clean = u => String(u).split('?')[0].replace(/^\\.\\//, '');
  const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    get() { return desc.get.call(this); },
    set(v) { const a = A[clean(v)]; desc.set.call(this, typeof a === 'string' ? a : v); },
  });
  const f0 = window.fetch;
  window.fetch = (u, o) => {
    const a = A[clean(u)];
    if (a && typeof a === 'object') return Promise.resolve(new Response(JSON.stringify(a), { headers: { 'Content-Type': 'application/json' } }));
    return f0 ? f0(u, o) : Promise.reject(new Error('offline'));
  };
})();
</script>""" % json.dumps(assets, ensure_ascii=False)

def inline_script(m):
    src = strip_v(m.group(1))
    code = (WEB / src).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return f'<script>/* {src} */\n{code}\n</script>'

html = re.sub(r'<script src="([^"]+)"></script>', inline_script, html)
css = (WEB / 'style.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="style.css[^"]*">', f'<style>\n{css}\n</style>', html)
html = re.sub(r'<link rel="manifest"[^>]*>\n?', '', html)
icon = 'data:image/svg+xml;base64,' + base64.b64encode((WEB / 'icon.svg').read_bytes()).decode()
html = html.replace('href="icon.svg"', f'href="{icon}"')
html = html.replace('<head>', '<head>\n' + shim, 1)
# no arquivo único não há dica de "abra pelo Jogar.bat"
html = html.replace('class="note file-hint" hidden', 'class="note file-hint" hidden data-off="1"')

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(html, encoding='utf-8')
print(f'{OUT} — {OUT.stat().st_size / 1e6:.1f} MB, {len(assets)} arquivos embutidos')
