"""POKEPOL - sprites dos 112 politicos novos (docs/politicos-novos-final.json) com o mesmo pipeline v4 de make_caricatures.py.
Uso: python tools/make_caricatures_novos.py [id ...]   (sem args = todos os ids do JSON que tem foto em tools/fotos/)
Saida: web/sprites/{id}.png e {id}_back.png; acrescenta ao web/sprites/index.json (mantem entradas existentes);
       docs/sprites-novos-preview.png (contact sheet 2x). Nao sobrescreve docs/sprites-preview.png nem remove ids antigos."""
import os, sys, json, re
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import make_caricatures as mc

ROOT = mc.ROOT; OUT = mc.OUT
WORK = os.path.join(HERE, 'work', 'crops'); os.makedirs(WORK, exist_ok=True)
data = json.load(open(os.path.join(ROOT, 'docs', 'politicos-novos-final.json'), encoding='utf-8'))
FEM = {'rosinhadagua', 'yedetran', 'raquelveu', 'gentilgate', 'luannabenesse', 'vereadoraarbok', 'selmadois', 'draculeao', 'sheilafake',
       'goreteindebito', 'brunapraianorte'}
PROPS = [('cash', ('dinheiro vivo', 'notas', 'cédulas', 'cedulas', 'maço')), ('mala', ('mala', 'maleta', 'valise', 'bolsa de dinheiro')), ('saco', ('joia', 'saco', 'ouro', 'tornozeleira')),
         ('mic', ('microfone', 'palanque', 'megafone')), ('celular', ('celular', 'telefone', 'twitter', 'rede social', 'smartphone')), ('carro', ('carro', 'veículo', 'veiculo', 'caminhonete')),
         ('cone', ('cone', 'obra')), ('papel', ('processo', 'contrato', 'nota fiscal', 'papel', 'livro', 'planilha', 'edital', 'diploma')), ('envelope', ('envelope', 'carta')),
         ('gravador', ('gravador', 'grampo')), ('calc', ('calculadora',)), ('arma', ('arma', 'pistola', 'revólver', 'fuzil')), ('mandado', ('mandado', 'toga')), ('boi', ('boi', 'gado', 'fazenda'))]
def prop_for(p):
    t = (p['caricature'] + ' ' + p['short']).lower()
    for k, ws in PROPS:
        if any(w in t for w in ws): return k
    return 'mala'

FACE = {'cassolicitado': (150, 100, 190, 190)}   # caixa manual do rosto (x, y, w, h) quando o Haar falha
def prep(pid):
    """Copia a foto para work/crops; se o rosto for pequeno num quadro largo, recorta ao redor do rosto."""
    im = Image.open(os.path.join(HERE, 'fotos', pid + '.jpg')).convert('RGB')
    fx, fy, fw, fh = FACE.get(pid) or mc.detect_face(im)
    if pid in FACE or fw < 0.22 * min(im.size) or im.width > 1.5 * im.height:
        cx, cy = fx + fw / 2, fy + fh / 2; cw = fw * 4.2; ch = fw * 5.2
        box = (max(0, cx - cw / 2), max(0, cy - ch * 0.42), min(im.width, cx + cw / 2), min(im.height, cy + ch * 0.58))
        im = im.crop(tuple(int(v) for v in box))
    im.save(os.path.join(WORK, pid + '.jpg'), quality=95)

def run(pid):
    p = next(x for x in data if x['id'] == pid)
    art = dict(hair='bald' if any(w in p.get('photoHint', '').lower() for w in ('calvo', 'careca')) else 'short', hc='dark', acc=prop_for(p))
    if pid in FEM: art['female'] = True
    pk = dict(pokemon=p.get('pokemon', ''), exaggerate=(p['caricature'] + ' ' + p.get('photoHint', '')), trait='')
    prep(pid)
    mc.FOTOS = WORK
    for view in ('front', 'back'):
        mc.build(pid, art, pk, view).save(os.path.join(OUT, pid + ('_back' if view == 'back' else '') + '.png'))

def contact(ids, path):
    cell = 352; cols = 8                      # 2x das celulas de 176
    items = []
    for i in ids: items += [i, i + '_back']
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, 100 + rows * (cell + 30)), (240, 238, 228)); d = ImageDraw.Draw(sheet)
    try: f1 = ImageFont.truetype('arialbd.ttf', 48); f2 = ImageFont.truetype('arial.ttf', 22)
    except Exception: f1 = f2 = ImageFont.load_default()
    d.text((20, 24), 'POKEPOL - sprites novos (frente + costas)', fill=(40, 40, 60), font=f1)
    for k, nm in enumerate(items):
        x, y = (k % cols) * cell, 100 + (k // cols) * (cell + 30)
        im = Image.open(os.path.join(OUT, nm + '.png')).convert('RGBA').resize((cell - 12, cell - 12), Image.LANCZOS)
        sheet.paste(im, (x + 6, y), im); d.text((x + 10, y + cell - 8), nm, fill=(30, 30, 50), font=f2)
    sheet.save(path)

if __name__ == '__main__':
    have = [p['id'] for p in data if os.path.exists(os.path.join(HERE, 'fotos', p['id'] + '.jpg'))]
    want = sys.argv[1:] or have
    for pid in want:
        try: run(pid); print('ok', pid)
        except Exception as e:
            import traceback; traceback.print_exc(); print('ERRO', pid, e)
    done = [i for i in have if os.path.exists(os.path.join(OUT, i + '_back.png')) and os.path.exists(os.path.join(OUT, i + '.png'))]
    ip = os.path.join(OUT, 'index.json'); idx = json.load(open(ip, encoding='utf-8'))
    for k in done:
        for n in (k, k + '_back'):
            if n not in idx: idx.append(n)
    json.dump(idx, open(ip, 'w', encoding='utf-8'))
    contact(done, os.path.join(ROOT, 'docs', 'sprites-novos-preview.png'))
    print('feitos', len(done))
