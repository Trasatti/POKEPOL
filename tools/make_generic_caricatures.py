"""POKEPOL - caricaturas GENERICAS (sem foto, NAO retratam o rosto real) para politicos sem foto oficial confiavel.
Cabeca desenhada proceduralmente (PIL) + corpo/adereco do pipeline make_caricatures.py (mesmo estilo/tamanho 256x256).
Uso: python tools/make_generic_caricatures.py [id ...]   (sem args = todos os 24)
Saida: web/sprites/{id}.png e {id}_back.png; atualiza web/sprites/index.json; tools/work/generic_sheet.png"""
import os, sys, json, math
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import make_caricatures as mc
from make_caricatures import Cv, C, shade, N, SS, OUTSIZE, INK, OUT

SKIN = dict(pale=(246, 214, 188), light=(238, 196, 160), tan=(214, 164, 120), brown=(170, 120, 82), dark=(122, 82, 56))
HAIR = dict(black=(34, 28, 30), dbrown=(66, 44, 34), brown=(100, 66, 44), auburn=(140, 70, 40), blonde=(222, 184, 92), gray=(158, 158, 164), white=(220, 220, 222), red=(176, 72, 36))

# id: gender, skin, hair style, hair colour, extras, expression, face shape, suit, tie, prop
SPEC = {
 'wajnjoias':          dict(skin='light', hair='slick', hc='black', glasses='rect', beard='stubble', expr='smug', shape='round', suit='#23304f', tie='#8a1f2d', prop='joia'),
 'caumolamacal':       dict(skin='tan', hair='short', hc='dbrown', glasses=None, beard=None, expr='worried', shape='chubby', suit='#3a3a46', tie='#2f6a8a', prop='balde'),
 'kleilsonforro':      dict(skin='brown', hair='short', hc='black', glasses=None, beard='mustache', expr='open', shape='round', suit='#5a3a2a', tie='#e0b030', prop='sanfona'),
 'brunoeco':           dict(skin='tan', hair='curly', hc='black', glasses='round', beard=None, expr='worried', shape='narrow', suit='#2c3558', tie='#d83a30', prop='caixasom'),
 'luannabenesse':      dict(skin='light', hair='long', hc='auburn', glasses=None, beard=None, expr='smile', shape='round', female=True, suit='#6a2a48', tie='#f4f4f0', prop='cheque'),
 'vereadoraarbok':     dict(skin='brown', hair='bun', hc='black', glasses=None, beard=None, expr='frown', shape='narrow', female=True, suit='#2a4a3a', tie='#d8c060', prop='urna'),
 'laranjeirao':        dict(skin='dark', hair='short', hc='black', glasses=None, beard='goatee', expr='smug', shape='chubby', suit='#c4661c', tie='#2a2a36', prop='laranja'),
 'xequematinho':       dict(skin='pale', hair='bald', hc='gray', glasses='round', beard='mustache', expr='smug', shape='narrow', suit='#202028', tie='#e8e8e0', prop='xadrez'),
 'gavetinha':          dict(skin='brown', hair='short', hc='gray', glasses=None, beard='mustache', expr='open', shape='chubby', suit='#3c4a38', tie='#a02828', prop='gaveta'),
 'boquirao':           dict(skin='dark', hair='bald', hc='black', glasses=None, beard='beard', expr='open', shape='chubby', suit='#2c3558', tie='#d8a028', prop='megafone'),
 'hipocratesdanilo':   dict(skin='light', hair='short', hc='brown', glasses='rect', beard=None, expr='smile', shape='round', suit='#e8e8ec', tie='#2a6aa8', prop='onibus'),
 'edesioturiacu':      dict(skin='tan', hair='short', hc='black', glasses=None, beard='mustache', expr='open', shape='round', suit='#2a5a78', tie='#f0d040', prop='peixe'),
 'mariovicktorsobral': dict(skin='light', hair='slick', hc='brown', glasses=None, beard=None, expr='smug', shape='narrow', suit='#26263a', tie='#2a2a2a', prop='cash'),
 'junimdopovoomerta':  dict(skin='brown', hair='short', hc='white', glasses=None, beard='beard', expr='frown', shape='round', suit='#4a4a56', tie='#8a3a1a', prop='mala'),
 'brunapraianorte':    dict(skin='tan', hair='bob', hc='blonde', glasses='round', beard=None, expr='worried', shape='round', female=True, suit='#2a6a6a', tie='#f4f4f0', prop='tijolo'),
 'cletsonequador':     dict(skin='tan', hair='short', hc='dbrown', glasses=None, beard='stubble', expr='worried', shape='round', suit='#3a5a30', tie='#e8c828', prop='calc'),
 'carlinhossobralbusca': dict(skin='light', hair='short', hc='brown', glasses='rect', beard=None, expr='smile', shape='round', suit='#2c3558', tie='#3a6aa0', prop='celular'),
 'chiconazariocaapora': dict(skin='pale', hair='short', hc='auburn', glasses=None, beard='beard', expr='open', shape='chubby', suit='#3a3a40', tie='#5a8a3a', prop='lixo'),
 'marcusamim':         dict(skin='dark', hair='short', hc='black', glasses='shades', beard=None, expr='smug', shape='narrow', suit='#14141c', tie='#c02828', prop='galao'),
 'silvaldoma':         dict(skin='tan', hair='bald', hc='black', glasses=None, beard='mustache', expr='worried', shape='round', suit='#4a3a2a', tie='#e8e8e0', prop='gravador'),
 'razukbicho':         dict(skin='light', hair='slick', hc='gray', glasses='shades', beard='mustache', expr='smug', shape='round', suit='#5a2a2a', tie='#e0c040', prop='bicho'),
 'gregfantasma':       dict(skin='pale', hair='curly', hc='red', glasses=None, beard=None, expr='open', shape='narrow', suit='#2a3a5a', tie='#a0b0c0', prop='fantasma'),
 'fernandespunhal':    dict(skin='tan', hair='short', hc='black', glasses=None, beard='mustache', expr='frown', shape='narrow', suit='#2a3a2a', tie='#d8c030', prop='punhal'),
 'camaramonitor':      dict(skin='light', hair='short', hc='gray', glasses='rect', beard=None, expr='frown', shape='round', suit='#1e2a3e', tie='#6a6a78', prop='camera'),
}

# ------------------------------------------------------------------ extra props (anchor right hand bottom centre)
def prop2(cv, kind, x=202, y=236):
    c = C
    if kind == 'joia':        # caixa de joias com diamante
        cv.rr((x - 30, y - 30, x + 30, y - 4), 4, (110, 30, 50)); cv.rr((x - 30, y - 44, x + 30, y - 28), 4, (140, 40, 64))
        cv.poly([(x - 12, y - 30), (x + 12, y - 30), (x + 18, y - 40), (x, y - 56), (x - 18, y - 40)], (150, 225, 245))
        cv.line([(x - 18, y - 40), (x + 18, y - 40)], (230, 250, 255), 1.4); cv.line([(x, y - 56), (x - 6, y - 40), (x, y - 30)], (230, 250, 255), 1.2)
        cv.line([(x - 26, y - 22), (x + 26, y - 22)], c['gold'], 2.4)
    elif kind == 'balde':     # balde de lama
        cv.poly([(x - 24, y - 40), (x + 24, y - 40), (x + 18, y - 4), (x - 18, y - 4)], c['gray'])
        cv.ell((x - 26, y - 48, x + 26, y - 32), c['dbrown']); cv.ell((x - 12, y - 58, x + 2, y - 46), c['dbrown']); cv.ell((x + 6, y - 62, x + 20, y - 50), c['brown'])
        cv.line([(x - 22, y - 40), (x - 22, y - 62), (x + 22, y - 62), (x + 22, y - 40)], c['dgray'], 1.6) if False else None
    elif kind == 'sanfona':   # sanfona
        cv.rr((x - 36, y - 56, x - 16, y - 6), 3, c['red']); cv.rr((x + 16, y - 56, x + 36, y - 6), 3, c['red'])
        cv.poly([(x - 16, y - 54), (x + 16, y - 54), (x + 16, y - 8), (x - 16, y - 8)], c['cream'])
        for i in range(5): cv.line([(x - 16 + i * 8, y - 54), (x - 16 + i * 8, y - 8)], (190, 170, 120), 1.6)
        for i in range(3): cv.ell((x - 31, y - 48 + i * 14, x - 23, y - 40 + i * 14), c['white'], w=1.0)
    elif kind == 'caixasom':  # caixa de som
        cv.rr((x - 24, y - 64, x + 24, y - 4), 5, c['black']); cv.ell((x - 15, y - 58, x + 15, y - 34), c['dgray']); cv.ell((x - 7, y - 50, x + 7, y - 42), c['gray'], w=1.0)
        cv.ell((x - 18, y - 30, x + 18, y - 8), c['dgray']); cv.ell((x - 9, y - 24, x + 9, y - 14), c['gray'], w=1.0)
    elif kind == 'cheque':
        cv.rr((x - 36, y - 46, x + 34, y - 6), 3, (230, 244, 226)); cv.line([(x - 28, y - 32), (x + 10, y - 32)], c['gray'], 1.6); cv.line([(x - 28, y - 22), (x + 4, y - 22)], c['gray'], 1.6)
        cv.rr((x + 10, y - 42, x + 28, y - 30), 2, c['white'], w=1.0); cv.ell((x + 4, y - 24, x + 28, y - 10), c['gold'], w=1.2)
        cv.line([(x - 28, y - 12), (x - 6, y - 14), (x - 14, y - 10)], c['black'], 1.2)
    elif kind == 'urna':
        cv.rr((x - 28, y - 44, x + 28, y - 4), 3, c['dgray']); cv.rr((x - 22, y - 38, x + 22, y - 18), 2, c['gray'], w=1.0)
        cv.rr((x - 16, y - 70, x + 16, y - 46), 2, c['white']); cv.line([(x - 12, y - 62), (x + 12, y - 62)], c['gray'], 1.4); cv.line([(x - 12, y - 54), (x + 6, y - 54)], c['gray'], 1.4)
        cv.rr((x - 8, y - 48, x + 8, y - 42), 1, c['black'], w=1.0)
        for j in range(3): cv.rr((x - 16 + j * 12, y - 14, x - 8 + j * 12, y - 8), 1, c['yellow'], w=1.0)
    elif kind == 'laranja':
        cv.ell((x - 28, y - 62, x + 28, y - 6), c['orange']); cv.glow('ell', (x - 20, y - 54, x - 4, y - 36), (255, 255, 255), 90)
        cv.poly([(x, y - 62), (x + 20, y - 76), (x + 28, y - 66), (x + 8, y - 58)], c['green']); cv.rr((x - 2, y - 68, x + 3, y - 58), 1, c['dgreen'], w=1.0)
    elif kind == 'xadrez':
        cv.rr((x - 18, y - 10, x + 18, y - 2), 2, c['white']); cv.poly([(x - 10, y - 10), (x - 6, y - 40), (x + 6, y - 40), (x + 10, y - 10)], c['white'])
        cv.ell((x - 14, y - 48, x + 14, y - 34), c['white']); cv.rr((x - 3, y - 70, x + 3, y - 48), 1, c['white']); cv.rr((x - 10, y - 62, x + 10, y - 56), 1, c['white'])
        cv.line([(x - 6, y - 36), (x + 6, y - 36)], c['gray'], 1.2)
    elif kind == 'gaveta':
        cv.rr((x - 34, y - 46, x + 34, y - 4), 3, c['brown']); cv.rr((x - 28, y - 40, x + 28, y - 8), 2, c['dbrown'], w=1.2)
        cv.rr((x - 30, y - 56, x + 30, y - 38), 2, c['green']); cv.rr((x - 22, y - 62, x + 22, y - 50), 2, (90, 190, 105)); cv.ell((x - 6, y - 56, x + 6, y - 44), c['gold'], w=1.0)
        cv.rr((x - 8, y - 28, x + 8, y - 20), 3, c['gold'], w=1.2)
    elif kind == 'megafone':
        cv.poly([(x - 30, y - 50), (x - 4, y - 36), (x - 4, y - 22), (x - 30, y - 8)], c['red']); cv.rr((x - 6, y - 40, x + 22, y - 18), 4, c['gray'])
        cv.rr((x + 2, y - 18, x + 14, y - 4), 2, c['dgray']); cv.line([(x - 34, y - 56), (x - 40, y - 62)], c['black'], 1.6); cv.line([(x - 38, y - 44), (x - 46, y - 46)], c['black'], 1.6)
    elif kind == 'onibus':
        cv.rr((x - 36, y - 46, x + 36, y - 10), 5, c['yellow']); cv.line([(x - 36, y - 24), (x + 36, y - 24)], c['black'], 2)
        for i in range(4): cv.rr((x - 30 + i * 16, y - 42, x - 18 + i * 16, y - 28), 2, c['blue'], w=1.0)
        for wx in (x - 20, x + 20): cv.ell((wx - 8, y - 18, wx + 8, y - 2), c['black']); cv.ell((wx - 3, y - 13, wx + 3, y - 7), c['gray'], w=1.0)
    elif kind == 'peixe':
        cv.poly([(x + 22, y - 32), (x + 42, y - 48), (x + 40, y - 18)], c['orange']); cv.ell((x - 34, y - 52, x + 30, y - 12), c['orange'])
        cv.poly([(x - 8, y - 52), (x + 4, y - 66), (x + 14, y - 50)], c['red']); cv.glow('ell', (x - 26, y - 46, x - 4, y - 36), (255, 255, 255), 90)
        cv.ell((x - 28, y - 40, x - 18, y - 30), c['white'], w=1.0); cv.ell((x - 25, y - 37, x - 21, y - 33), c['black'], ink=False)
        cv.line([(x - 8, y - 46), (x - 12, y - 18)], c['dred'], 1.4)
    elif kind == 'tijolo':
        for i in range(3):
            for j in range(2 if i % 2 == 0 else 3):
                bx = x - 28 + j * 22 + (11 if i % 2 == 0 else 0); by = y - 4 - i * 14
                cv.rr((bx, by - 13, bx + 22, by), 1, (196, 92, 60), w=1.4)
    elif kind == 'lixo':
        cv.ell((x - 30, y - 56, x + 30, y - 2), c['black']); cv.glow('ell', (x - 22, y - 50, x - 6, y - 28), (255, 255, 255), 70)
        cv.poly([(x - 8, y - 56), (x - 14, y - 70), (x - 4, y - 62), (x, y - 74), (x + 6, y - 62), (x + 14, y - 70), (x + 8, y - 56)], c['black'])
        cv.rr((x - 6, y - 40, x + 12, y - 28), 2, c['green'], w=1.2)
    elif kind == 'galao':
        cv.rr((x - 24, y - 52, x + 24, y - 4), 5, c['red']); cv.poly([(x - 14, y - 52), (x - 14, y - 66), (x + 2, y - 66), (x + 6, y - 52)], c['red'])
        cv.rr((x - 16, y - 40, x + 16, y - 22), 2, c['yellow'], w=1.2); cv.poly([(x, y - 38), (x + 6, y - 30), (x, y - 24), (x - 6, y - 30)], c['dred'], ink=False)
    elif kind == 'bicho':
        cv.rr((x - 24, y - 62, x + 24, y - 4), 4, c['cream']); cv.rr((x - 18, y - 56, x + 18, y - 30), 3, (240, 200, 80), w=1.2)
        cv.ell((x - 10, y - 52, x + 10, y - 34), (190, 150, 60)); cv.poly([(x - 8, y - 50), (x - 12, y - 58), (x - 4, y - 52)], (190, 150, 60)); cv.poly([(x + 8, y - 50), (x + 12, y - 58), (x + 4, y - 52)], (190, 150, 60))
        cv.line([(x - 6, y - 44), (x - 2, y - 42)], c['black'], 1.4); cv.line([(x + 6, y - 44), (x + 2, y - 42)], c['black'], 1.4)
        for i in range(3): cv.line([(x - 14, y - 22 + i * 7), (x + 14, y - 22 + i * 7)], c['gray'], 1.6)
    elif kind == 'fantasma':
        cv.poly([(x - 24, y - 4), (x - 28, y - 44), (x - 14, y - 62), (x + 14, y - 62), (x + 28, y - 44), (x + 24, y - 4), (x + 14, y - 14), (x + 4, y - 4), (x - 6, y - 14), (x - 14, y - 4)], (236, 240, 250))
        cv.ell((x - 14, y - 46, x - 4, y - 32), c['black'], ink=False); cv.ell((x + 4, y - 46, x + 14, y - 32), c['black'], ink=False); cv.ell((x - 6, y - 30, x + 6, y - 20), c['black'], ink=False)
        cv.glow('ell', (x - 20, y - 56, x - 8, y - 46), (255, 255, 255), 120)
    elif kind == 'punhal':
        cv.poly([(x - 5, y - 74), (x + 5, y - 74), (x + 8, y - 30), (x - 8, y - 30)], (200, 206, 216)); cv.line([(x, y - 72), (x, y - 32)], c['white'], 1.4)
        cv.rr((x - 18, y - 32, x + 18, y - 24), 2, c['gold']); cv.rr((x - 5, y - 24, x + 5, y - 6), 2, c['dgreen']); cv.line([(x - 5, y - 18), (x + 5, y - 18)], c['yellow'], 2.2)
        cv.ell((x - 8, y - 10, x + 8, y + 2), c['gold'], w=1.2)
    elif kind == 'camera':
        cv.rr((x - 32, y - 52, x + 20, y - 24), 5, c['dgray']); cv.rr((x + 16, y - 48, x + 34, y - 28), 3, c['black']); cv.ell((x + 18, y - 44, x + 32, y - 32), c['blue'], w=1.2)
        cv.ell((x - 28, y - 46, x - 20, y - 38), c['red'], w=1.0); cv.rr((x - 6, y - 24, x + 6, y - 14), 2, c['gray']); cv.rr((x - 18, y - 14, x + 18, y - 6), 3, c['dgray'])
    else:
        mc.prop(cv, kind, x, y)

# ------------------------------------------------------------------ head
def headshape(s):
    return {'round': (66, 188, 50, 174), 'chubby': (60, 196, 52, 176), 'narrow': (72, 184, 48, 174)}[s]

def draw_head(cv, sp, view):
    skin = SKIN[sp['skin']]; hair = HAIR[sp['hc']]; dsk = shade(skin, .78); hd = shade(hair, .6); hl = shade(hair, 1.3)
    x0, x1, y0, y1 = headshape(sp['shape']); cx = 128
    female = sp.get('female'); style = sp['hair']
    # hair behind head
    if style == 'long':
        cv.poly([(58, 110), (60, 60), (84, 38), (128, 32), (172, 38), (196, 60), (198, 110), (200, 176), (186, 186), (160, 160), (96, 160), (70, 186), (56, 176)], hair)
    elif style == 'bob':
        cv.poly([(58, 110), (60, 60), (84, 38), (128, 32), (172, 38), (196, 60), (198, 110), (196, 154), (178, 160), (80, 160), (60, 154)], hair)
    elif style == 'bun':
        cv.ell((106, 22, 150, 56), hair); cv.ell((128 - 24, 40, 128 + 24, 60), hair, ink=False)
    elif style == 'curly':
        for i in range(8):
            a = math.pi * (1.0 + i / 7.0); cv.ell((cx + 66 * math.cos(a) - 18, 96 + 66 * math.sin(a) - 18, cx + 66 * math.cos(a) + 18, 96 + 66 * math.sin(a) + 18), hair)
    # ears
    if style not in ('long', 'bob') or view == 'back':
        for ex in (x0 - 9, x1 - 7):
            cv.ell((ex, 104, ex + 16, 134), skin); cv.ell((ex + 4, 110, ex + 12, 126), dsk, ink=False)
    # face
    cv.ell((x0, y0, x1, y1), skin)
    cv.glow('ell', (x1 - 26, y0 + 30, x1 - 2, y1 - 20), dsk, 90)
    cv.glow('ell', (x0 + 10, y0 + 12, x0 + 40, y0 + 46), shade(skin, 1.12), 90)
    if view == 'back':
        cv.ell((x0 - 2, y0 - 4, x1 + 2, y1 - 14), hair) if style != 'bald' else None
        if style == 'bald':
            cv.ell((x0 - 1, y0 - 2, x1 + 1, y1 - 20), skin); cv.glow('ell', (x0 + 20, y0 + 6, x0 + 56, y0 + 34), (255, 255, 255), 90)
            cv.poly([(x0 + 2, 120), (x0 + 6, 100), (x0 + 16, 140), (x0 + 12, 150)], hair); cv.poly([(x1 - 2, 120), (x1 - 6, 100), (x1 - 16, 140), (x1 - 12, 150)], hair)
        else:
            cv.line([(cx, y0), (cx - 2, y0 + 40)], hd, 2.4)
            for k in range(6):
                xx = x0 + 22 + k * 17; cv.line([(xx, y0 + 6), (xx + (xx - cx) * .1, y0 + 56 + (k % 3) * 6)], hd, 1.6)
            cv.glow('ell', (x0 + 20, y0 + 4, x0 + 62, y0 + 30), hl, 100)
        if style in ('long', 'bob'):
            cv.poly([(x0 - 4, 96), (x0 + 12, 90), (x0 + 6, 160), (x0 - 6, 150)], hair, ink=False)
        if style == 'bun': cv.ell((106, 22, 150, 56), hair); cv.ell((114, 28, 134, 44), hl, ink=False)
        return
    # hair front
    top = y0 + 2
    if style in ('short', 'slick', 'long', 'bob', 'bun', 'curly'):
        hp = [(x0 - 3, 108), (x0 - 4, 76), (x0 + 6, 52), (x0 + 30, 40), (cx, 36), (x1 - 30, 40), (x1 - 6, 52), (x1 + 4, 76), (x1 + 3, 108)]
        if style == 'slick':
            hp += [(x1 - 6, 92), (x1 - 14, 78), (cx + 24, 70), (cx - 26, 66), (x0 + 22, 80), (x0 + 12, 92)]
        elif style == 'curly':
            hp += [(x1 - 10, 92), (x1 - 20, 76), (cx + 26, 70), (cx, 76), (cx - 26, 70), (x0 + 20, 76), (x0 + 10, 92)]
        elif style in ('long', 'bob'):
            hp += [(x1 - 12, 96), (x1 - 26, 76), (cx + 10, 64), (cx - 18, 70), (x0 + 22, 84), (x0 + 10, 96)]
        else:
            hp += [(x1 - 8, 94), (x1 - 16, 80), (cx + 20, 74), (cx - 20, 74), (x0 + 16, 80), (x0 + 8, 94)]
        cv.poly(hp, hair)
        cv.glow('ell', (cx - 40, 40, cx + 10, 58), hl, 130)
        if style == 'slick': cv.line([(cx - 22, 40), (cx - 26, 68)], hd, 1.6); cv.line([(cx - 8, 38), (cx - 8, 68)], hd, 1.4)
        if style == 'curly':
            for i in range(5): cv.ell((x0 + 6 + i * 26, 56 + (i % 2) * 6, x0 + 34 + i * 26, 82 + (i % 2) * 6), hair)
    elif style == 'bald':
        cv.glow('ell', (cx - 34, y0 + 4, cx + 2, y0 + 22), (255, 255, 255), 110)
        for sgn in (-1, 1):
            xs = x0 - 2 if sgn < 0 else x1 + 2
            cv.poly([(xs, 96), (xs - sgn * 14, 90), (xs - sgn * 16, 108), (xs - sgn * 6, 128), (xs, 124)], hair)
    # eyes
    ey = 106; ex = (104, 152)
    expr = sp['expr']
    for i, exx in enumerate(ex):
        cv.ell((exx - 12, ey - 9, exx + 12, ey + 9), (252, 252, 252), w=1.6)
        dx = 2 if expr in ('smug',) else 0; dy = 1 if expr in ('worried',) else 0
        cv.ell((exx - 5 + dx, ey - 5 + dy, exx + 5 + dx, ey + 5 + dy), (50, 34, 28) if sp['skin'] != 'pale' else (60, 90, 120), ink=False)
        cv.ell((exx - 2 + dx, ey - 3 + dy, exx + 2 + dx, ey + 1 + dy), (255, 255, 255), ink=False)
    bt = 86 if style != 'bald' else 88
    if expr == 'worried':
        cv.line([(ex[0] - 14, ey - 14), (ex[0] + 10, ey - 22)], hd if style != 'bald' else shade(hair, .6), 3.6); cv.line([(ex[1] + 14, ey - 14), (ex[1] - 10, ey - 22)], hd, 3.6)
        cv.poly([(184, 96), (190, 108), (178, 108)], (150, 205, 245))
    elif expr == 'frown':
        cv.line([(ex[0] - 14, ey - 22), (ex[0] + 10, ey - 14)], hd, 3.8); cv.line([(ex[1] + 14, ey - 22), (ex[1] - 10, ey - 14)], hd, 3.8)
        cv.line([(ex[0] - 12, ey - 3), (ex[0] + 12, ey - 3)], skin if False else INK, 1.6); cv.line([(ex[1] - 12, ey - 3), (ex[1] + 12, ey - 3)], INK, 1.6)
    elif expr == 'smug':
        cv.line([(ex[0] - 14, ey - 18), (ex[0] + 10, ey - 20)], hd, 3.6); cv.line([(ex[1] + 14, ey - 18), (ex[1] - 10, ey - 24)], hd, 3.6)
        cv.line([(ex[0] - 13, ey - 4), (ex[0] + 13, ey - 4)], dsk, 2.4); cv.line([(ex[1] - 13, ey - 4), (ex[1] + 13, ey - 4)], dsk, 2.4)
    else:
        cv.line([(ex[0] - 13, ey - 18), (ex[0] + 11, ey - 21)], hd, 3.6); cv.line([(ex[1] + 13, ey - 18), (ex[1] - 11, ey - 21)], hd, 3.6)
    # glasses
    g = sp.get('glasses')
    if g == 'round':
        for exx in ex: cv.ell((exx - 17, ey - 15, exx + 17, ey + 15), (255, 255, 255), ink=True, w=2.4); cv.glow('ell', (exx - 14, ey - 12, exx + 14, ey + 12), (200, 225, 250), 60)
        cv.line([(ex[0] + 17, ey - 3), (ex[1] - 17, ey - 3)], INK, 2.2)
        cv.line([(ex[0] - 17, ey - 4), (x0 + 2, ey - 8)], INK, 2.0); cv.line([(ex[1] + 17, ey - 4), (x1 - 2, ey - 8)], INK, 2.0)
        for exx in ex: cv.ell((exx - 12, ey - 9, exx + 12, ey + 9), (252, 252, 252), ink=False); cv.ell((exx - 5, ey - 5, exx + 5, ey + 5), (50, 34, 28), ink=False); cv.ell((exx - 2, ey - 3, exx + 2, ey + 1), (255, 255, 255), ink=False)
        for exx in ex: cv.ell((exx - 17, ey - 15, exx + 17, ey + 15), (0, 0, 0), ink=False) if False else None
    elif g == 'rect':
        for exx in ex: cv.rr((exx - 18, ey - 12, exx + 18, ey + 13), 3, (255, 255, 255), w=2.6); cv.glow('poly', [(exx - 16, ey - 10), (exx - 2, ey - 10), (exx - 14, ey + 6)], (220, 240, 255), 90)
        cv.line([(ex[0] + 18, ey - 3), (ex[1] - 18, ey - 3)], INK, 2.4)
        for exx in ex: cv.ell((exx - 12, ey - 9, exx + 12, ey + 9), (252, 252, 252), ink=False); cv.ell((exx - 5, ey - 5, exx + 5, ey + 5), (50, 34, 28), ink=False); cv.ell((exx - 2, ey - 3, exx + 2, ey + 1), (255, 255, 255), ink=False)
        for exx in ex: cv.rr((exx - 18, ey - 12, exx + 18, ey + 13), 3, (255, 255, 255), ink=True, w=2.6) if False else None
    elif g == 'shades':
        for exx in ex: cv.rr((exx - 19, ey - 12, exx + 19, ey + 14), 6, (24, 24, 34), w=2.2)
        cv.line([(ex[0] + 19, ey - 4), (ex[1] - 19, ey - 4)], INK, 3)
        for exx in ex: cv.glow('poly', [(exx - 16, ey - 10), (exx - 4, ey - 10), (exx - 14, ey + 2)], (255, 255, 255), 120)
    # nose
    cv.ell((cx - 9, 118, cx + 9, 136), shade(skin, .9), w=1.4); cv.glow('ell', (cx - 4, 120, cx + 6, 130), (255, 255, 255), 70)
    cv.line([(cx - 4, 133), (cx - 1, 135), (cx + 4, 133)], dsk, 1.6)
    # cheeks
    if female: cv.glow('ell', (x0 + 8, 126, x0 + 36, 142), (240, 120, 130), 110); cv.glow('ell', (x1 - 36, 126, x1 - 8, 142), (240, 120, 130), 110)
    else: cv.glow('ell', (x0 + 10, 128, x0 + 34, 142), (232, 120, 110), 70); cv.glow('ell', (x1 - 34, 128, x1 - 10, 142), (232, 120, 110), 70)
    # beard / mouth
    b = sp.get('beard'); my = 150
    if b == 'beard':
        cv.poly([(x0 + 2, 120), (x0 + 10, 112), (x0 + 22, 132), (cx - 20, 140), (cx, 136), (cx + 20, 140), (x1 - 22, 132), (x1 - 10, 112), (x1 - 2, 120), (x1 - 8, 156), (cx + 26, y1 + 6), (cx - 26, y1 + 6), (x0 + 8, 156)], hair)
    elif b == 'goatee':
        cv.poly([(cx - 20, 138), (cx + 20, 138), (cx + 18, 164), (cx, y1 + 4), (cx - 18, 164)], hair)
    elif b == 'stubble':
        cv.glow('ell', (x0 + 6, 128, x1 - 6, y1 + 2), hair, 70)
    mouth = (28, 12) if expr == 'open' else (22, 6)
    if b in ('beard', 'goatee'):
        cv.rr((cx - 14, my - 6, cx + 14, my + 10), 5, (120, 40, 40), w=1.4) if expr == 'open' else cv.line([(cx - 12, my), (cx, my + (4 if expr in ('smile', 'smug') else -2)), (cx + 12, my)], (230, 200, 190), 2.4)
    else:
        if expr == 'open':
            cv.poly([(cx - 16, my - 6), (cx + 16, my - 6), (cx + 12, my + 12), (cx - 12, my + 12)], (130, 40, 44)); cv.rr((cx - 13, my - 6, cx + 13, my + 1), 1, (255, 255, 255), ink=False); cv.ell((cx - 7, my + 5, cx + 7, my + 13), (220, 100, 110), ink=False)
        elif expr == 'smile':
            cv.line([(cx - 16, my - 2), (cx - 8, my + 6), (cx + 8, my + 6), (cx + 16, my - 2)], INK, 2.2)
        elif expr == 'smug':
            cv.line([(cx - 14, my + 2), (cx, my + 4), (cx + 14, my - 4), (cx + 18, my - 8)], INK, 2.2)
        elif expr == 'frown':
            cv.line([(cx - 14, my + 6), (cx - 6, my), (cx + 6, my), (cx + 14, my + 6)], INK, 2.4)
        else:
            cv.line([(cx - 12, my + 4), (cx - 4, my + 1), (cx + 4, my + 5), (cx + 12, my + 2)], INK, 2.2)
    if b == 'mustache':
        cv.poly([(cx, 136), (cx + 6, 134), (cx + 24, 138), (cx + 30, 148), (cx + 20, 146), (cx + 4, 143), (cx - 4, 143), (cx - 20, 146), (cx - 30, 148), (cx - 24, 138), (cx - 6, 134)], hair)
    if female:   # cilios
        for exx in ex: cv.line([(exx - 12, ey - 5), (exx - 16, ey - 11)], INK, 1.8); cv.line([(exx + 12, ey - 5), (exx + 16, ey - 11)], INK, 1.8)
        cv.ell((cx - 11, my - 3, cx + 11, my + 8), (214, 70, 84), w=1.2) if expr in ('smile', 'frown', 'worried') else None
    if sp['hc'] in ('gray', 'white') and style != 'bald':
        pass

def build(pid, sp, view):
    sp = dict(sp); skin = SKIN[sp['skin']]
    art = dict(suit=sp['suit'], tie=sp['tie'], female=bool(sp.get('female')))
    body = mc.draw_body(art, skin, view)
    headl = Cv(); draw_head(headl, sp, view)
    prp = Cv()
    if view == 'front': prop2(prp, sp['prop'])
    stack = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for l in (body, headl.im, prp.im): stack.alpha_composite(l)
    sil = mc.ink_silhouette(stack)
    final = Image.new('RGBA', (N, N), (0, 0, 0, 0)); final.alpha_composite(sil); final.alpha_composite(stack)
    bb = final.getbbox(); top, bot = bb[1], bb[3]
    sc = min((OUTSIZE - 8) * SS / (bot - top), 1.12)
    w2 = int(N * sc); big = final.resize((w2, w2), Image.LANCZOS)
    canvas = Image.new('RGBA', (N, N), (0, 0, 0, 0)); canvas.paste(big, (N // 2 - w2 // 2, (OUTSIZE - 4) * SS - int(bot * sc)))
    return canvas.resize((OUTSIZE, OUTSIZE), Image.LANCZOS)

def sheet(ids, path):
    cell = 256; cols = 8; items = []
    for i in ids: items += [i, i + '_back']
    rows = (len(items) + cols - 1) // cols
    sh = Image.new('RGB', (cols * cell, 50 + rows * (cell + 20)), (240, 238, 228)); d = ImageDraw.Draw(sh)
    f = ImageFont.truetype('arial.ttf', 16)
    for k, nm in enumerate(items):
        x, y = (k % cols) * cell, 50 + (k // cols) * (cell + 20)
        im = Image.open(os.path.join(OUT, nm + '.png')).convert('RGBA'); sh.paste(im, (x, y), im); d.text((x + 6, y + cell), nm, fill=(30, 30, 50), font=f)
    os.makedirs(os.path.dirname(path), exist_ok=True); sh.save(path)

if __name__ == '__main__':
    ids = sys.argv[1:] or list(SPEC)
    for pid in ids:
        for view in ('front', 'back'):
            build(pid, SPEC[pid], view).save(os.path.join(OUT, pid + ('_back' if view == 'back' else '') + '.png'))
        print('ok', pid)
    if not sys.argv[1:]:
        ip = os.path.join(OUT, 'index.json'); idx = json.load(open(ip, encoding='utf-8'))
        for k in SPEC:
            for n in (k, k + '_back'):
                if n not in idx: idx.append(n)
        json.dump(idx, open(ip, 'w', encoding='utf-8'))
    sheet(list(SPEC), os.path.join(HERE, 'work', 'generic_sheet.png'))
