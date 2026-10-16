# Helpers de pixel art (resolucao nativa, sem anti-aliasing). Arte original.
import math
from PIL import Image, ImageDraw
K = (0x22, 0x20, 0x34, 255)   # contorno (mesma cor escura do tileset)
_h = {}
def hx(s):
    if isinstance(s, tuple): return s
    if s not in _h: _h[s] = tuple(int(s[i:i+2], 16) for i in (1, 3, 5)) + (255,)
    return _h[s]

# rampas (escuro, medio, claro) - luz vinda do topo-esquerdo
STONE = ('#8f98b0', '#d0d6e4', '#f4f6fc')
CREAM = ('#c8a860', '#f0dc98', '#fff8d0')
YEL   = ('#d8a030', '#f8d048', '#fff088')
OCHRE = ('#a8742c', '#d8a050', '#f4cc80')
BRICK = ('#7a2e2e', '#b04838', '#d87050')
RED   = ('#8a1c24', '#c83028', '#f06048')
GRN   = ('#3a6a2a', '#6abe30', '#99e550')
DGRN  = ('#2c4a24', '#4b692f', '#6abe30')
WOOD  = ('#663931', '#8f563b', '#d9a066')
GRAY  = ('#45454f', '#696a6a', '#9badb7')
STEEL = ('#5a6a80', '#9aaac0', '#e0e8f0')
SEA   = ('#155ba2', '#186abd', '#4b7dc8')
ROCK  = ('#5a5048', '#8a8070', '#b8ac94')
GLASS = ('#3068a8', '#58a0d8', '#a8e0f8')
PINK  = ('#b86068', '#e89098', '#ffc8c8')
BLUE  = ('#1c3c88', '#2c60c0', '#80b0f0')
ORANGE= ('#b05010', '#e08028', '#ffb050')
SAND  = ('#c0a060', '#d8c880', '#f0e8b0')
ROOF  = ('#8a2c1c', '#c04828', '#e87848')
WHITE = ('#a8b0c8', '#e4e8f0', '#ffffff')
TEAL  = ('#2c6a68', '#48a898', '#98e0c8')
BROWN = ('#3c2820', '#5a3c30', '#8a6048')
GOLD  = ('#b88020', '#e8b830', '#fff080')

class C:
    def __init__(s, wt, ht):
        s.w, s.h = wt * 16, ht * 16
        s.im = Image.new('RGBA', (s.w, s.h), (0, 0, 0, 0)); s.px = s.im.load()
    def p(s, x, y, c):
        x, y = int(x), int(y)
        if c is not None and 0 <= x < s.w and 0 <= y < s.h: s.px[x, y] = hx(c)
    def get(s, x, y):
        return s.px[x, y] if 0 <= x < s.w and 0 <= y < s.h else (0, 0, 0, 0)
    def r(s, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w): s.p(i, j, c)
    def box(s, x, y, w, h, ramp, o=False):
        d, m, l = ramp
        s.r(x, y, w, h, m)
        if w > 2 and h > 2:
            s.r(x, y, w, 1, l); s.r(x, y, 1, h, l)
            s.r(x, y + h - 1, w, 1, d); s.r(x + w - 1, y, 1, h, d)
            s.p(x, y + h - 1, m); s.p(x + w - 1, y, m)
        if o: s.rect_o(x - 1, y - 1, w + 2, h + 2)
    def rect_o(s, x, y, w, h, col=K):
        for i in range(x, x + w): s.p(i, y, col); s.p(i, y + h - 1, col)
        for j in range(y, y + h): s.p(x, j, col); s.p(x + w - 1, j, col)
    def line(s, x0, y0, x1, y1, c, w=1):
        x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
        dx, dy = abs(x1 - x0), -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1
        e = dx + dy
        while True:
            for a in range(w):
                for b in range(w): s.p(x0 + a, y0 + b, c)
            if x0 == x1 and y0 == y1: break
            e2 = 2 * e
            if e2 >= dy: e += dy; x0 += sx
            if e2 <= dx: e += dx; y0 += sy
    # mascaras
    def fill(s, mask, ramp, t=1):
        if isinstance(ramp, str): return s.flat(mask, ramp)
        d, m, l = ramp
        for (x, y) in mask:
            if (x - 1, y) not in mask or (x, y - 1) not in mask: c = l
            elif t > 1 and ((x - 2, y) not in mask or (x, y - 2) not in mask): c = l
            elif (x + 1, y) not in mask or (x, y + 1) not in mask: c = d
            elif t > 1 and ((x + 2, y) not in mask or (x, y + 2) not in mask): c = d
            else: c = m
            s.p(x, y, c)
    def flat(s, mask, c):
        for (x, y) in mask: s.p(x, y, c)
    def tex(s, mask, fn):
        for (x, y) in mask:
            c = fn(x, y)
            if c is not None: s.p(x, y, c)
    def save(s, path):
        im = s.im; px = im.load(); W, H = im.size
        add = []
        for y in range(H):
            for x in range(W):
                if px[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        xx, yy = x + dx, y + dy
                        if 0 <= xx < W and 0 <= yy < H and px[xx, yy][3] != 0 and px[xx, yy] != K:
                            add.append((x, y)); break
        for (x, y) in add: px[x, y] = K
        im.save(path)

def rm(x, y, w, h): return {(i, j) for j in range(y, y + h) for i in range(x, x + w)}
def em(cx, cy, rx, ry, top=False, bot=False):
    out = set()
    for j in range(int(cy - ry - 1), int(cy + ry + 2)):
        if top and j > cy: continue
        if bot and j < cy: continue
        for i in range(int(cx - rx - 1), int(cx + rx + 2)):
            if ((i - cx) / (rx + .5)) ** 2 + ((j - cy) / (ry + .5)) ** 2 <= 1: out.add((i, j))
    return out
def pm(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    x0, y0 = int(min(xs)) - 1, int(min(ys)) - 1
    w, h = int(max(xs)) - x0 + 3, int(max(ys)) - y0 + 3
    im = Image.new('L', (w, h), 0); ImageDraw.Draw(im).polygon([(p[0] - x0, p[1] - y0) for p in pts], fill=255)
    px = im.load()
    return {(i + x0, j + y0) for j in range(h) for i in range(w) if px[i, j]}
def mirror(x, w, W=96): return W - x - w
