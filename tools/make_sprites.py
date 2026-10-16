"""POKEPOL - gera sprites 48x48 estilo Fire Red (caricatura chibi) a partir de fotos oficiais.

Uso:  python tools/make_sprites.py [id ...]     (sem args = todos com foto em tools/fotos/)
Saida: web/sprites/{id}.png (96x96 RGBA, alpha 0/255, <=16 cores) e docs/sprites-preview.png
As fotos sao tratadas apenas como dados (abertas com Pillow).
"""
import os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FOTOS = os.path.join(HERE, 'fotos')
OUT = os.path.join(ROOT, 'web', 'sprites')
DOCS = os.path.join(ROOT, 'docs')
OUTLINE = (0x1c, 0x1c, 0x28)

# ---------------------------------------------------------------- data.js
def load_art():
    src = open(os.path.join(ROOT, 'web', 'js', 'data.js'), encoding='utf-8').read()
    res = {}
    for m in re.finditer(r"\{ id: '(\w+)', name: '([^']*)', real: '([^']*)'.*?art: \{([^}]*)\}", src, re.S):
        art = {}
        for k, v in re.findall(r"(\w+):\s*('[^']*'|true|false)", m.group(4)):
            art[k] = True if v == 'true' else False if v == 'false' else v.strip("'")
        res[m.group(1)] = dict(name=m.group(2), real=m.group(3), art=art)
    # personagens fora do POLITICOS (mentor): toga preta + mandado enrolado
    res['dino'] = dict(name='Flávio Dino', real='Flávio Dino', art=dict(hair='short', suit='#16161e', robe=True, acc='mandado'))
    return res

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)

# ---------------------------------------------------------------- face
_cascade = None
def detect_face(img):
    global _cascade
    try:
        import cv2
    except ImportError:
        cv2 = None
    w, h = img.size
    if cv2 is not None:
        if _cascade is None:
            _cascade = [cv2.CascadeClassifier(cv2.data.haarcascades + n) for n in
                        ('haarcascade_frontalface_default.xml', 'haarcascade_frontalface_alt2.xml')]
        sc = max(1.0, 400.0 / max(w, h))
        g = cv2.cvtColor(np.array(img.convert('RGB').resize((int(w * sc), int(h * sc)), Image.LANCZOS)), cv2.COLOR_RGB2GRAY)
        g = cv2.equalizeHist(g)
        for casc in _cascade:
            for mn in (6, 4, 2):
                fs = casc.detectMultiScale(g, 1.08, mn, minSize=(int(60 * sc / 1.5), int(60 * sc / 1.5)))
                if len(fs):
                    # prefer large faces near the upper center
                    best = max(fs, key=lambda f: f[2] * f[3] - 0.5 * abs(f[0] + f[2] / 2 - g.shape[1] / 2) * f[3] * 0.3)
                    return tuple(v / sc for v in best)
    return (w * 0.28, h * 0.17, w * 0.44, w * 0.44)

# ---------------------------------------------------------------- head
HW, HH = 60, 56          # target head size (px) in the 96x96 sprite
S = 5                    # working supersample

def make_head(img, art, face):
    fx, fy, fw, fh = face
    big = art.get('big')
    cw = fw * 1.34
    ch = fw * 1.52
    cx = fx + fw / 2
    cy = fy + fh * 0.44
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    W, H = HW * S, HH * S
    crop = img.convert('RGB').transform((W, H), Image.AFFINE,
        (cw / W, 0, box[0], 0, ch / H, box[1]), resample=Image.BICUBIC, fillcolor=(255, 255, 255))
    yy, xx = np.mgrid[0:H, 0:W]
    ex, ey = (xx + 0.5) / W - 0.5, (yy + 0.5) / H - 0.5
    ell = ((ex / 0.50) ** 2 + ((ey + 0.03) / 0.51) ** 2) <= 1.0
    a = np.array(crop).astype(np.float32)
    # --- GrabCut segmentation seeded around the detected face
    import cv2
    fxc, fyc = (fx + fw / 2 - box[0]) / cw * W, (fy + fh / 2 - box[1]) / ch * H
    sx_, sy_ = W / cw, H / ch
    gm = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
    gm[~ell] = cv2.GC_BGD
    def ellipse_mask(cx_, cy_, rx, ry):
        return (((xx - cx_) / rx) ** 2 + ((yy - cy_) / ry) ** 2) <= 1.0
    gm[ellipse_mask(fxc, fyc - 0.12 * fh * sy_, 0.62 * fw * sx_, 0.80 * fh * sy_)] = cv2.GC_PR_FGD
    gm[ellipse_mask(fxc, fyc, 0.30 * fw * sx_, 0.34 * fh * sy_)] = cv2.GC_FGD
    bgm_, fgm_ = np.zeros((1, 65)), np.zeros((1, 65))
    try:
        sm = cv2.resize(np.array(crop), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        gsm = cv2.resize(gm, (W // 2, H // 2), interpolation=cv2.INTER_NEAREST)
        cv2.grabCut(cv2.cvtColor(sm, cv2.COLOR_RGB2BGR), gsm, None, bgm_, fgm_, 6, cv2.GC_INIT_WITH_MASK)
        fg = cv2.resize(((gsm == cv2.GC_FGD) | (gsm == cv2.GC_PR_FGD)).astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST) > 0
    except Exception:
        fg = ell
    face_sat = 0.3
    mask = (fg | ellipse_mask(fxc, fyc + 0.02 * fh * sy_, 0.47 * fw * sx_, 0.56 * fh * sy_)) & ell
    from scipy import ndimage
    mask = ndimage.binary_closing(mask, iterations=4)
    mask = ndimage.binary_opening(mask, iterations=4)
    lab, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, lab, range(1, n + 1)); mask = lab == (1 + int(np.argmax(sizes)))
    mask = ndimage.binary_fill_holes(mask)
    # --- colour fixes on the crop (inside the mask)
    mm = mask & (np.abs(xx - fxc) < 0.3 * fw * sx_) & (np.abs(yy - fyc) < 0.35 * fh * sy_)
    if mm.sum() > 50:
        mean = a[mm].mean(0); mx, mn = a[mm].max(1), a[mm].min(1)
        sat = float(np.mean((mx - mn) / np.maximum(mx, 1)))
        if sat < 0.12:      # grayscale photo -> colorize (hair stays dark, skin gets a warm ramp)
            lum = a.mean(-1) / 255.0
            t = np.clip((lum - 0.30) / 0.62, 0, 1)[..., None]
            shadow, light = np.array([150, 88, 66], np.float32), np.array([244, 204, 176], np.float32)
            col = shadow + (light - shadow) * t
            dark = np.clip((0.34 - lum) / 0.12, 0, 1)[..., None]
            a = col * (1 - dark) + np.array([40, 34, 32], np.float32) * dark
        else:            # white balance the face towards a typical skin ratio (strong when greenish)
            tgt = np.array([1.0, 0.78, 0.66]) * mean.mean() / np.array([1.0, 0.78, 0.66]).mean()
            gain = np.clip(tgt / np.maximum(mean, 1), 0.6, 1.6)
            gain = gain if mean[1] > 0.80 * mean[0] else gain ** 0.5
            a = np.clip(a * gain, 0, 255)
        face_sat = sat
    # cut the lower part (neck/collar) below the chin
    chin = (fy + fh - box[1]) / ch * H
    cut = chin + 0.05 * H
    mask[int(min(H, cut)):, :] = False
    # soft the bottom a bit to a rounded chin
    # ---- caricature: jaw / cheek widening (stretch lower part horizontally)
    amt = 0.30 if big else 0.22
    out_rgb = np.zeros((H, int(W * 1.0), 3), np.float32); out_m = np.zeros((H, W), bool)
    rgb = a.copy()
    cutrow = min(H - 1, max(1, int(cut)))
    for y in range(H):
        t = max(0.0, min(1.0, (y / cutrow - 0.40) / 0.45))
        f = 1.0 + amt * t * t * (3 - 2 * t)
        # sample source x for each dest x (scale about center)
        sx = (np.arange(W) - W / 2) / f + W / 2
        sxi = np.clip(sx.astype(int), 0, W - 1)
        out_rgb[y] = rgb[y, sxi]
        out_m[y] = mask[y, sxi] & (sx >= 0) & (sx < W)
    # premultiplied downscale
    al = out_m.astype(np.float32)
    pre = out_rgb * al[..., None]
    im_pre = Image.fromarray(np.clip(pre, 0, 255).astype(np.uint8)).resize((HW, HH), Image.BOX)
    im_a = Image.fromarray((al * 255).astype(np.uint8)).resize((HW, HH), Image.BOX)
    pa = np.array(im_a).astype(np.float32) / 255
    col = np.array(im_pre).astype(np.float32) / np.maximum(pa[..., None], 1e-3)
    col = np.clip(col, 0, 255).astype(np.uint8)
    solid = pa >= 0.75
    solid = ndimage.binary_erosion(solid, structure=ndimage.generate_binary_structure(2, 1))   # kill fringe
    band = solid & ~ndimage.binary_erosion(solid, iterations=3)
    solid = solid & ~(band & (col.min(-1) > 205))     # whitish background fringe on the edge
    solid = solid & ~(solid & ~ndimage.binary_erosion(solid, iterations=1) & (col.min(-1) > 180))
    # fill non-solid colour with neighbours is unnecessary (alpha cut) -> binary alpha
    himg = Image.fromarray(col)
    # pixel-art look: contrast/saturation/sharpen
    himg = ImageEnhance.Contrast(himg).enhance(1.25)
    himg = ImageEnhance.Color(himg).enhance(float(np.interp(face_sat, [0.30, 0.50], [1.35, 1.0])))
    himg = himg.filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=2))
    return himg, solid

def quantize_head(himg, solid, ncol=10):
    """Quantize only opaque pixels to ncol colors."""
    arr = np.array(himg)
    pts = arr[solid]
    if len(pts) == 0:
        return himg
    tmp = Image.fromarray(pts.reshape(1, -1, 3))
    q = tmp.quantize(ncol, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    arr[solid] = np.array(q).reshape(-1, 3)
    return Image.fromarray(arr)

# ---------------------------------------------------------------- accessories (ascii pixel art)
PAL = {
    'k': (0x1c, 0x1c, 0x28), 'w': (0xf4, 0xf4, 0xf0), 'n': (0xb4, 0xb4, 0xc0), 'N': (0x62, 0x62, 0x74),
    'g': (0x4c, 0xb0, 0x58), 'G': (0x2a, 0x78, 0x3a), 'y': (0xf4, 0xcc, 0x30), 'Y': (0xb8, 0x88, 0x18),
    'r': (0xd8, 0x3a, 0x30), 'R': (0x8a, 0x1e, 0x26), 'b': (0x9a, 0x62, 0x30), 'B': (0x5c, 0x38, 0x1e),
    'c': (0x58, 0xa8, 0xe8), 'p': (0xf0, 0x9a, 0xa8), 's': (0xe8, 0xb4, 0x8c), 'o': (0xe8, 0x8a, 0x28),
}

def art_img(rows, mapping=None):
    w = max(len(r) for r in rows); h = len(rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            ch = (mapping or {}).get(ch, ch)
            if ch in PAL: px[x, y] = PAL[ch] + (255,)
    return im

MALA = ["...kkkkkk...", "...k....k...", "..kkkkkkkk..", ".kbbbbbbbbk.", ".kbBBBBBBbk.", ".kbbbyybbbk.",
        ".kbbbbbbbbk.", ".kbBBBBBBbk.", ".kbbbbbbbbk.", "..kkkkkkkk.."]
CASH = ["..kkkkkkkkk.", ".kgggggggggk", "kgGGgyygGGgk", "kgGgyggygGgk", "kgGGgyygGGgk", "kgggggggggGk",
        ".kGGGGGGGGGk", "..kkkkkkkkk."]
CASH2 = ["...kkkkkkkk.", "..kgggggggGk", ".kgggggggGkk", "kkkkkkkkkkGk", "kgGGgyygGGgk", "kgGgyggygGgk",
         "kgGGgyygGGgk", "kgggggggggGk", ".kGGGGGGGGGk", "..kkkkkkkkk."]
MANDADO = ['..kkkkk..', '.kwwnnwk.', '.kwwwwwk.', '.kwwwwwk.', '.kwrrrwk.', '.kwrRrwk.', '.kwrrrwk.', '.kwwwwwk.', '.kwwwwwk.', '.kwwnnwk.', '..kkkkk..']
GRANADA = ["...kk...", "..kyYk..", "...kk...", "..kkkk..", ".kGggGk.", "kGggggGk", "kGgGGggk", "kGggggGk", ".kGggGk.", "..kkkk.."]
ARMA = [".kkkkkkkkkk..", "kNnnnnnnnnNk.", "kNnnnnnnnnNk.", "kNNNNNNNNNNk.", ".kkkNNkkkkkk.", "...kNNk......", "...kNNk......", "...kNNNk.....", "...kkkkk....."]
CELULAR = [".kkkkk.", "knNNNNk", "kNcccNk", "kNcwcNk", "kNcccNk", "kNcccNk", "kNcccNk", "kNcccNk", "kNNNNNk", "knNNNnk", ".kkkkk."]
GRAVADOR = [".kkkkk.", "kNNNNNk", "kNwwwNk", "kNwwwNk", "kNNNNNk", "kNnnnNk", "kNnrnNk", "kNnnnNk", "kNNNNNk", ".kkkkk."]
PAPEL = [".kkkkkkk.", ".kwwwwwk.", ".kwnnnwk.", ".kwwwwwk.", ".kwnnnwk.", ".kwwwwwk.", ".kwnnnwk.", ".kwwwwwk.",
         ".kwnnwwk.", ".kwwwwwk.", ".kkkkkkk."]
CHOC = [".kkkkkk.", "kryyyyrk", "krrrrrrk", "kkbbkbbk", "kbBbkbBk", "kkkkkkkk", "kbbBkbbk", "kbBbkbBk", "kkkkkkkk", "kbbBkbbk", ".kkkkkk."]
BOI = ["y..........y", "yk........ky", ".kkkkkkkkkk.", "kwwwwwwwwwwk", "kwkwwwwwwkwk", "kwwwkkwwwwwk", "kwwwkkwwkkwk",
       "kwkwwwwwkkwk", ".kwwwwwwwwk.", ".kppppppppk.", ".kpkppppkpk.", ".kkppppppkk.", "..kkkkkkkk.."]
def _sym(l, c):
    return l + c + l[::-1]
AVIAO = [_sym(".....", "kkk"), _sym("....k", "www"), _sym("....k", "wcw"), _sym("....k", "www"), _sym("..kkk", "www"),
         _sym(".kccc", "www"), _sym("kcccc", "www"), _sym("kkkkk", "www"), _sym("....k", "www"), _sym("...kc", "www"),
         _sym("..kcc", "www"), _sym("...kk", "www")]
PLANE_S = [".....kk.....", "....kwwk....", "....kwwk....", "kkkkkwwkkkkk", "kccccwwcccck", "kkkkkwwkkkkk", "....kwwk....", "...kccck....", "....kkkk...."]


def draw_acc(canvas, kind, art, head_box):
    """Draw accessory onto the RGBA canvas (48x48). Body-held items go bottom right."""
    d = ImageDraw.Draw(canvas)

    def put(rows, x, y, mapping=None):
        canvas.alpha_composite(art_img(rows, mapping), (x, y))

    def hand(x, y):
        d.rectangle([x, y, x + 2, y + 2], fill=PAL['s'] + (255,), outline=None)

    if kind == 'cash':
        put(CASH2, 34, 36); hand(33, 43)
    elif kind == 'mala':
        put(MALA, 35, 36); hand(33, 43)
    elif kind == 'malas':
        put(MALA, 35, 36, {'b': 'r', 'B': 'R'})
        put(MALA, 35, 29, {})
        put(["..kkkkkkkk.."], 35, 28)
    elif kind == 'mandado':
        put(MANDADO, 37, 35); hand(35, 43)
    elif kind == 'granada':
        put(GRANADA, 36, 36); hand(34, 43)
    elif kind == 'arma':
        put(ARMA, 35, 38); hand(34, 43)
    elif kind == 'celular':
        put(CELULAR, 38, 35); hand(36, 43)
    elif kind == 'gravador':
        put(GRAVADOR, 38, 36); hand(36, 43)
    elif kind == 'papel':
        put(PAPEL, 37, 35); hand(35, 43)
    elif kind == 'chocolate':
        put(CHOC, 38, 35); hand(36, 43)
    elif kind == 'boi':
        put(BOI, 35, 33)
    elif kind == 'aviao':
        put(AVIAO, 34, 33)
    elif kind == 'bone':
        put(AVIAO, 35, 33)
        hx0, hy0, hx1, hy1 = head_box
        cx = (hx0 + hx1) / 2
        d.ellipse([hx0 - 0.5, hy0 - 1.5, hx1 + 0.5, hy0 + 11], fill=PAL['r'] + (255,))
        d.rectangle([hx0 - 1, hy0 + 6, hx1 + 1, hy0 + 7], fill=PAL['R'] + (255,))
        d.line([hx0 + 8, hy0 + 7, hx1 + 5, hy0 + 7], fill=PAL['R'] + (255,))   # brim
        d.line([hx0 + 8, hy0 + 8, hx1 + 4, hy0 + 8], fill=PAL['k'] + (255,))
        d.rectangle([cx - 4, hy0 + 2, cx + 3, hy0 + 5], fill=PAL['w'] + (255,))
        d.point([cx, hy0 + 1], fill=PAL['R'] + (255,))
    elif kind == 'guardanapo':
        hx0, hy0, hx1, hy1 = head_box
        cx = (hx0 + hx1) / 2
        wc, sc = PAL['w'] + (255,), PAL['n'] + (255,)
        d.ellipse([hx0 + 1, hy0 - 3, hx1 - 1, hy0 + 5], fill=wc)
        d.line([hx0 + 2, hy0 + 3, hx1 - 2, hy0 + 3], fill=sc)
        for i in range(hx0 + 4, hx1 - 3, 5):
            d.line([i, hy0, i + 1, hy0 + 4], fill=sc)
        for kx in (hx0 - 2, hx1 + 1):               # knots
            d.rectangle([kx, hy0 + 4, kx + 2, hy0 + 6], fill=wc)
        d.point([cx, hy0 - 3], fill=wc)
    elif kind == 'medalha':
        for i, c in enumerate('rcyr'):
            d.rectangle([14 + i * 3, 36, 15 + i * 3, 38], fill=PAL[c] + (255,))
        d.rectangle([15, 39, 19, 43], fill=PAL['y'] + (255,), outline=PAL['k'] + (255,))
        d.point([17, 41], fill=PAL['r'] + (255,))
        d.rectangle([29, 37, 32, 39], fill=PAL['y'] + (255,)); d.point([30, 38], fill=PAL['r'] + (255,))
    elif kind == 'bike':
        gc = PAL['k'] + (255,)
        d.ellipse([32, 39, 39, 46], outline=gc); d.ellipse([40, 39, 47, 46], outline=gc)
        d.line([36, 42, 41, 38], fill=PAL['r'] + (255,)); d.line([41, 38, 43, 42], fill=PAL['r'] + (255,))
        d.line([36, 42, 40, 42], fill=PAL['r'] + (255,)); d.line([41, 38, 40, 36], fill=PAL['N'] + (255,))
        d.line([34, 37, 37, 37], fill=gc); d.point([36, 42], fill=PAL['y'] + (255,))
        d.point([36, 42], fill=PAL['y'] + (255,))
    elif kind == 'carro':
        x0, y0 = 33, 37
        d.rectangle([x0, y0 + 3, x0 + 13, y0 + 7], fill=PAL['r'] + (255,), outline=PAL['k'] + (255,))
        d.polygon([(x0 + 3, y0 + 3), (x0 + 5, y0), (x0 + 9, y0), (x0 + 11, y0 + 3)], fill=PAL['c'] + (255,), outline=PAL['k'] + (255,))
        d.line([x0 + 7, y0 + 1, x0 + 7, y0 + 3], fill=PAL['k'] + (255,))
        for wx in (x0 + 2, x0 + 9):
            d.ellipse([wx, y0 + 6, wx + 3, y0 + 9], fill=PAL['N'] + (255,), outline=PAL['k'] + (255,))
        d.point([x0 + 13, y0 + 4], fill=PAL['y'] + (255,))
    # 'faixa' is drawn on the body (see make_body)

# ---------------------------------------------------------------- body
def make_body(canvas, art, skin):
    d = ImageDraw.Draw(canvas)
    suit = hexrgb(art.get('suit', '#2b3350'))
    tie = hexrgb(art.get('tie', '#d83a30'))
    shirt = hexrgb(art.get('shirt', '#f4f4f0'))
    female = art.get('female')
    hi = shade(suit, 1.5); lo = shade(suit, 0.7)
    sc = skin + (255,)
    # neck
    d.rectangle([21, 28, 27, 34], fill=shade(skin, 0.82) + (255,))
    # torso
    body = [(7, 46), (7, 40), (9, 36), (14, 33), (20, 32), (28, 32), (34, 33), (39, 36), (41, 40), (41, 46)]
    d.polygon(body, fill=suit + (255,))
    # arms (separation lines) + hands
    d.line([11, 38, 11, 46], fill=lo + (255,)); d.line([37, 38, 37, 46], fill=lo + (255,))
    d.rectangle([8, 44, 10, 46], fill=sc); d.rectangle([38, 44, 40, 46], fill=sc)
    if art.get('robe'):
        fold = shade(suit, 2.2) + (255,)
        d.line([11, 38, 11, 46], fill=fold); d.line([37, 38, 37, 46], fill=fold)
        d.line([(24, 36), (24, 46)], fill=fold)
        d.polygon([(19, 32), (29, 32), (24, 40)], fill=shirt + (255,))
        d.polygon([(19, 32), (22, 32), (24, 38), (22, 41), (17, 36)], fill=suit + (255,))
        d.polygon([(29, 32), (26, 32), (24, 38), (26, 41), (31, 36)], fill=suit + (255,))
        d.rectangle([21, 32, 27, 33], fill=shirt + (255,))
    elif female:
        d.polygon([(20, 32), (28, 32), (24, 40)], fill=sc)
        d.line([(20, 32), (24, 41)], fill=lo + (255,)); d.line([(28, 32), (24, 41)], fill=lo + (255,))
        d.line([(24, 41), (24, 46)], fill=lo + (255,))
    else:
        d.polygon([(19, 32), (29, 32), (24, 42)], fill=shirt + (255,))
        d.polygon([(19, 32), (22, 32), (24, 38), (22, 41), (17, 36)], fill=lo + (255,))    # lapels
        d.polygon([(29, 32), (26, 32), (24, 38), (26, 41), (31, 36)], fill=lo + (255,))
        d.polygon([(22, 33), (26, 33), (25, 35), (23, 35)], fill=tie + (255,))                 # knot
        d.polygon([(23, 35), (25, 35), (27, 41), (24, 46), (21, 41)], fill=tie + (255,))        # blade
        pass
    if art.get('acc') == 'faixa':
        gc, yc = PAL['g'] + (255,), PAL['y'] + (255,)
        for o in range(-2, 3):
            d.line([(13 + o, 32), (41, 44 + o)], fill=gc)
        d.line([(10, 32), (41, 41)], fill=yc); d.line([(16, 32), (41, 47)], fill=yc)
        d.ellipse([34, 41, 39, 46], fill=yc, outline=PAL['Y'] + (255,)); d.point([36, 43], fill=PAL['G'] + (255,))
        # keep inside body silhouette
        arr = np.array(canvas); m = np.zeros((48, 48), np.uint8)
        md = Image.new('L', (48, 48), 0); ImageDraw.Draw(md).polygon(body, fill=255)
        arr[(np.array(md) == 0) & (arr[..., 3] > 0) & False] = 0
    return body

# ---------------------------------------------------------------- compose
def count_colors(im):
    arr = np.array(im); m = arr[..., 3] > 0
    return len(np.unique(arr[m][:, :3], axis=0))

def up2(im):
    return im.resize((im.width * 2, im.height * 2), Image.NEAREST)

def build(pid, art):
    """Body + accessories are drawn on a 48 grid and doubled; the head is native 60x56 from the photo."""
    photo = Image.open(os.path.join(FOTOS, pid + '.jpg')); photo.load()
    face = detect_face(photo)
    if face[2] > 0.55 * photo.width:      # tight crop: pad with the border colour so hair/ears fit
        pad = int(face[2] * 0.5); bgc = tuple(int(v) for v in np.median(np.array(photo.convert('RGB'))[:4].reshape(-1, 3), axis=0))
        big = Image.new('RGB', (photo.width + 2 * pad, photo.height + 2 * pad), bgc); big.paste(photo.convert('RGB'), (pad, pad))
        photo = big; face = (face[0] + pad, face[1] + pad, face[2], face[3])
    himg, solid = make_head(photo, art, face)
    ha = np.array(himg)
    ys, xs = np.where(solid)
    sel = (ys > HH * 0.55) & (ys < HH * 0.8) & (abs(xs - HW / 2) < HW * 0.2)
    skin = tuple(int(v) for v in np.median(ha[ys[sel], xs[sel]], axis=0)) if sel.any() else (222, 170, 140)
    hx48, hy48 = 9, 3
    hbox = (hx48 + 2, hy48, hx48 + 28, hy48 + 28)
    body = Image.new('RGBA', (48, 48), (0, 0, 0, 0)); make_body(body, art, skin)
    acc = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    if art.get('acc'):
        draw_acc(acc, art['acc'], art, hbox)
    both = body.copy(); both.alpha_composite(acc)
    arr = np.array(both); m = arr[..., 3] > 0
    cols = {tuple(c) for c in arr[m][:, :3]} - {OUTLINE}
    ncol = max(8, min(16, 23 - len(cols)))
    himg = quantize_head(himg, solid, ncol)
    ha = np.array(himg)
    canvas = up2(body)
    head_rgba = np.dstack([ha, solid.astype(np.uint8) * 255])
    canvas.alpha_composite(Image.fromarray(head_rgba, 'RGBA'), (hx48 * 2, hy48 * 2))
    canvas.alpha_composite(up2(acc))
    arr = np.array(canvas)
    arr[..., 3] = np.where(arr[..., 3] >= 128, 255, 0)
    a = arr[..., 3] > 0
    pad = np.pad(a, 1)
    edge = (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]) & ~a
    rgb = arr[..., :3].copy()
    if len(np.unique(rgb[a].reshape(-1, 3), axis=0)) > 23:      # safety net
        q = Image.fromarray(rgb[a].reshape(1, -1, 3)).quantize(23, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
        rgb[a] = np.array(q).reshape(-1, 3)
    arr[..., :3] = rgb
    arr[edge] = OUTLINE + (255,)
    arr[arr[..., 3] == 0] = 0
    return Image.fromarray(arr, 'RGBA')

# ---------------------------------------------------------------- contact sheet
def contact(ids, meta):
    cell_w, cell_h = 48 * 4 + 20, 48 * 4 + 34
    cols = 6; rows = (len(ids) + cols - 1) // cols
    top = 58
    sheet = Image.new('RGB', (cols * cell_w, top + rows * cell_h), (236, 240, 226))
    d = ImageDraw.Draw(sheet)
    try:
        f1 = ImageFont.truetype('arialbd.ttf', 30); f2 = ImageFont.truetype('arial.ttf', 13)
    except Exception:
        f1 = f2 = ImageFont.load_default()
    d.text((16, 12), 'POKÉPOL - sprites 96x96 (2x)', fill=(40, 40, 60), font=f1)
    for i, pid in enumerate(ids):
        x, y = (i % cols) * cell_w, top + (i // cols) * cell_h
        d.rectangle([x + 4, y + 4, x + cell_w - 6, y + cell_h - 6], fill=(214, 224, 200), outline=(120, 130, 110))
        im = Image.open(os.path.join(OUT, pid + '.png')).resize((192, 192), Image.NEAREST)
        sheet.paste(im, (x + 10, y + 8), im)
        d.text((x + 10, y + 204), meta[pid]['name'] + ' (' + pid + ')', fill=(30, 30, 50), font=f2)
    os.makedirs(DOCS, exist_ok=True)
    sheet.save(os.path.join(DOCS, 'sprites-preview.png'))

def main():
    meta = load_art()
    os.makedirs(OUT, exist_ok=True)
    want = sys.argv[1:] or [k for k in meta if os.path.exists(os.path.join(FOTOS, k + '.jpg'))]
    done, missing = [], [k for k in meta if not os.path.exists(os.path.join(FOTOS, k + '.jpg'))]
    for pid in want:
        try:
            build(pid, meta[pid]['art']).save(os.path.join(OUT, pid + '.png'))
            done.append(pid)
        except Exception as e:
            print('ERRO', pid, repr(e))
    print('feitos', len(done), 'sem foto', missing)
    ids = [k for k in meta if os.path.exists(os.path.join(OUT, k + '.png'))]
    import json
    json.dump(ids, open(os.path.join(OUT, 'index.json'), 'w'))
    contact(ids, meta)

if __name__ == '__main__':
    main()
