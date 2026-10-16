import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from palacios import make
from landmarks import LANDMARKS
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'web', 'assets', 'landmarks')
DOCS = os.path.join(ROOT, 'docs')
os.makedirs(OUT, exist_ok=True)

PL = {
 'curitiba':      ('Palácio Iguaçu', {'style':'classic','wall':STONE,'roof':GRAY,'trim':CREAM}),
 'florianopolis': ('Casa d\'Agronômica', {'style':'colonial','wall':YEL,'trim':WHITE,'roof':ROOF,'shut':GRN}),
 'portoalegre':   ('Palácio Piratini', {'style':'classic','wall':CREAM,'roof':GRN,'dome':True,'domec':GRN,'trim':WHITE}),
 'saopaulo':      ('Palácio dos Bandeirantes', {'style':'classic','wall':OCHRE,'roof':ROOF,'hip':True,'trim':CREAM}),
 'riodejaneiro':  ('Palácio Guanabara', {'style':'classic','wall':WHITE,'roof':GRAY,'trim':STONE}),
 'vitoria':       ('Palácio Anchieta', {'style':'colonial','wall':WHITE,'trim':YEL,'roof':ROOF,'tower':True,'shut':BLUE}),
 'belohorizonte': ('Palácio Tiradentes', {'style':'modern','mode':'pilotis','slab':WHITE,'glass':GLASS}),
 'salvador':      ('Centro Administrativo da Bahia', {'style':'modern','mode':'tower','slab':STONE,'glass':GLASS}),
 'aracaju':       ('Palácio de Despachos', {'style':'arcade','wall':CREAM,'trim':WHITE}),
 'maceio':        ('Palácio República dos Palmares', {'style':'classic','wall':WHITE,'roof':TEAL,'hip':True,'trim':STONE,'door':BROWN}),
 'recife':        ('Palácio do Campo das Princesas', {'style':'classic','wall':CREAM,'roof':ROOF,'dome':True,'domec':BLUE,'trim':WHITE}),
 'joaopessoa':    ('Palácio da Redenção', {'style':'classic','wall':PINK,'roof':GRAY,'trim':WHITE}),
 'natal':         ('Governadoria', {'style':'modern','mode':'fins','slab':WHITE,'glass':GLASS,'acc':BLUE}),
 'fortaleza':     ('Palácio da Abolição', {'style':'arcade','wall':WHITE,'trim':STONE,'shut':BLUE}),
 'teresina':      ('Palácio de Karnak', {'style':'classic','wall':OCHRE,'roof':ROOF,'hip':True,'trim':CREAM,'lions':False}),
 'saoluis':       ('Palácio dos Leões', {'style':'classic','wall':CREAM,'roof':ROOF,'hip':True,'trim':WHITE,'lions':True}),
 'belem':         ('Palácio dos Despachos', {'style':'colonial','wall':PINK,'trim':WHITE,'roof':GRAY,'shut':GRN}),
 'macapa':        ('Palácio do Setentrião', {'style':'modern','mode':'colonnade','slab':WHITE,'glass':TEAL}),
 'boavista':      ('Palácio Senador Hélio Campos', {'style':'modern','mode':'colonnade','slab':CREAM,'glass':GLASS}),
 'manaus':        ('Palácio Rio Negro', {'style':'colonial','wall':OCHRE,'trim':CREAM,'roof':TEAL,'shut':DGRN}),
 'portovelho':    ('Palácio Rio Madeira', {'style':'modern','mode':'canopy','slab':WHITE,'glass':GLASS}),
 'riobranco':     ('Palácio Rio Branco', {'style':'classic','wall':PINK,'roof':GRAY,'trim':WHITE}),
 'cuiaba':        ('Palácio Paiaguás', {'style':'modern','mode':'canopy','slab':CREAM,'glass':TEAL}),
 'campogrande':   ('Parque dos Poderes', {'style':'modern','mode':'pilotis','slab':STONE,'glass':GLASS,'band':30,'acc':ORANGE}),
 'goiania':       ('Palácio das Esmeraldas', {'style':'classic','wall':CREAM,'roof':GRN,'dome':True,'domec':TEAL,'trim':WHITE}),
 'palmas':        ('Palácio Araguaia', {'style':'modern','mode':'colonnade','slab':STONE,'glass':GLASS,'band':16,'acc':ORANGE}),
}

def main():
    index = {}
    imgs = {}
    for cid, w, h, name, fn in LANDMARKS:
        c = fn()
        assert (c.w, c.h) == (w * 16, h * 16), cid
        c.save(os.path.join(OUT, cid + '.png'))
        index[cid] = {'landmark': {'w': w, 'h': h, 'name': name}}
        imgs[cid] = [Image.open(os.path.join(OUT, cid + '.png'))]
        if cid in PL:
            pname, P = PL[cid]
            p = make(cid, P)
            p.save(os.path.join(OUT, cid + '_palacio.png'))
            index[cid]['palacio'] = {'w': 6, 'h': 4, 'name': pname}
            imgs[cid].append(Image.open(os.path.join(OUT, cid + '_palacio.png')))
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    # contact sheet 3x
    S = 3; cols = 2
    try: font = ImageFont.truetype('arial.ttf', 14)
    except Exception: font = ImageFont.load_default()
    cell_w = (96 * 2 + 8) * S + 12; cell_h = 96 * S + 30
    ids = [x[0] for x in LANDMARKS]
    rows = (len(ids) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell_w, rows * cell_h), (104, 168, 96, 255))
    d = ImageDraw.Draw(sheet)
    for n, cid in enumerate(ids):
        ox, oy = (n % cols) * cell_w + 6, (n // cols) * cell_h + 4
        d.text((ox, oy), cid + ' | ' + index[cid]['landmark']['name'] + (' | ' + index[cid]['palacio']['name'] if 'palacio' in index[cid] else ''), fill=(20, 20, 40, 255), font=font)
        x = ox
        for k, im in enumerate(imgs[cid]):
            big = im.resize((im.width * S, im.height * S), Image.NEAREST)
            sheet.alpha_composite(big, (x, oy + 20 + (96 * S - big.height)))
            x += big.width + 8 * S
    sheet.convert('RGB').save(os.path.join(DOCS, 'landmarks-preview.png'))
    print('ok', len(ids))

if __name__ == '__main__':
    main()
