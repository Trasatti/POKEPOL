"""POKEPOL v3 - caricaturas pintadas (256x256 RGBA, suavizadas) a partir de fotos oficiais.

Uso: python tools/make_caricatures.py [id ...]   (sem args = todos de POLITICOS com foto em tools/fotos/)
Saida: web/sprites/{id}.png (frente, figura inteira) e {id}_back.png (costas), web/sprites/index.json,
       docs/sprites-preview.png (contact sheet frente+costas).
Dino e ignorado (usa arte de terceiros). Fotos sao tratadas como dados (Pillow/OpenCV apenas).
"""
import os, re, sys, json, math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
FOTOS = os.path.join(HERE, 'fotos'); OUT = os.path.join(ROOT, 'web', 'sprites'); DOCS = os.path.join(ROOT, 'docs')
OUTSIZE, SS = 256, 3
N = OUTSIZE * SS
INK = (36, 24, 22, 255)
HX0, HX1, HY0, HY1 = 56, 200, 38, 174          # head box (design units, 256 space)
SKIP = {'dino'}

# ------------------------------------------------------------------ data
def load_meta():
    src = open(os.path.join(ROOT, 'web', 'js', 'data.js'), encoding='utf-8').read()
    res = {}
    for m in re.finditer(r"\{ id: '(\w+)',.*?\n\s+art: (\{[^\n]*?\}),?\n", src, re.S):
        art = {}
        for k, v in re.findall(r"(\w+):\s*('[^']*'|\"[^\"]*\"|true|false)", m.group(2)):
            art[k] = True if v == 'true' else False if v == 'false' else v.strip("'\"")
        res[m.group(1)] = art
    pk = {}
    docs = os.path.join(ROOT, 'docs')
    try:
        s = open(os.path.join(docs, 'mapeamento-v2-crime-tipo.md'), encoding='utf-8').read()
        pk.update(json.loads(re.findall(r"```json(.*?)```", s, re.S)[0]))
        s = open(os.path.join(docs, 'novos-politicos-atuais.md'), encoding='utf-8').read()
        for x in json.loads(re.findall(r"```json(.*?)```", s, re.S)[0]):
            pk[x['id']] = dict(pokemon=x['pokemon'], exaggerate=x['caricature'], trait='')
    except Exception as e:
        print('aviso docs', e)
    return res, pk

NEW_ACC = {'sacostenes': 'saco', 'jordyaluga': 'carro', 'discalculayer': 'calc', 'friasdark': 'claquete', 'ceperjao': 'papel',
           'vazacellar': 'papel', 'dovalento': 'mic', 'respiralima': 'mascara', 'ciromaster': 'envelope',
           'maranhaozito': 'cash', 'blitzvinei': 'cone', 'emprestinho': 'arma', 'cidelator': 'papel'}

def warps_from_text(t):
    t = (t or '').lower(); w = []
    def add(k, cond):
        if cond and k not in w: w.append(k)
    add('jaw', any(x in t for x in ('queixo', 'mandíbula', 'maxilar', 'papada', 'robust', 'pescoço')))
    add('forehead', any(x in t for x in ('testa', 'careca', 'cabeça', 'cabeção', 'topete', 'cabelo', 'capilar', 'franja', 'lisa')))
    add('nose', 'nariz' in t)
    add('cheeks', any(x in t for x in ('bochecha', 'rosto redondo', 'rosto jovem', 'papo', 'barriga')))
    add('ears', 'orelha' in t)
    add('brows', any(x in t for x in ('sobrancelha', 'olheira', 'bigode', 'barba', 'óculos')))
    add('eyes', any(x in t for x in ('olhos', 'arregalad', 'olhar')))
    add('mouth', any(x in t for x in ('sorriso', 'boca', 'língua')))
    return w or ['jaw', 'cheeks']

_sess = None
def seg_session():
    global _sess
    if _sess is None:
        from rembg import new_session
        _sess = new_session('u2net_human_seg')
    return _sess
from rembg import remove
SEG_MASK = None

# ------------------------------------------------------------------ face / head
_casc = None
def detect_face(img):
    global _casc
    w, h = img.size
    if _casc is None:
        _casc = [cv2.CascadeClassifier(cv2.data.haarcascades + n) for n in
                 ('haarcascade_frontalface_default.xml', 'haarcascade_frontalface_alt2.xml')]
    sc = max(1.0, 400.0 / max(w, h))
    g = cv2.equalizeHist(cv2.cvtColor(np.array(img.convert('RGB').resize((int(w * sc), int(h * sc)), Image.LANCZOS)), cv2.COLOR_RGB2GRAY))
    for c in _casc:
        for mn in (6, 4, 2):
            fs = c.detectMultiScale(g, 1.08, mn, minSize=(40, 40))
            if len(fs):
                f = max(fs, key=lambda f: f[2] * f[3]); return tuple(v / sc for v in f)
    return (w * 0.28, h * 0.17, w * 0.44, w * 0.44)

HW, HH = (HX1 - HX0) * SS, (HY1 - HY0) * SS

def bulge(X, Y, cx, cy, rx, ry, strength):
    """inverse-mapping radial bulge (magnify centre) applied to coordinate maps."""
    dx, dy = (X - cx) / rx, (Y - cy) / ry
    r2 = dx * dx + dy * dy
    k = np.where(r2 < 1, 1 - strength * (1 - r2) ** 2, 1.0)
    return cx + (X - cx) * k, cy + (Y - cy) * k

def make_head(img, wlist, fixgreen=False):
    fx, fy, fw, fh = detect_face(img)
    pad = False
    if fw > 0.55 * img.width:
        p = int(fw * 0.5); bgc = tuple(int(v) for v in np.median(np.array(img.convert('RGB'))[:4].reshape(-1, 3), axis=0))
        big = Image.new('RGB', (img.width + 2 * p, img.height + 2 * p), bgc); big.paste(img.convert('RGB'), (p, p))
        img = big; fx += p; fy += p
    k = max(1.0, 800.0 / img.height)
    if k > 1.05:
        img = img.convert('RGB').resize((int(img.width * k), int(img.height * k)), Image.LANCZOS); fx, fy, fw, fh = fx * k, fy * k, fw * k, fh * k
    global SEG_MASK
    SEG_MASK = np.array(remove(img.convert('RGB'), session=seg_session(), only_mask=True))
    W, H = HW, HH
    cw = fw * 1.62; ch = cw * H / W
    cx, cy = fx + fw / 2, fy + fh * 0.40
    box = (cx - cw / 2, cy - ch / 2)
    crop = img.convert('RGB').transform((W, H), Image.AFFINE, (cw / W, 0, box[0], 0, ch / H, box[1]), resample=Image.BICUBIC, fillcolor=(255, 255, 255))
    a = np.array(crop)
    sx, sy = W / cw, H / ch
    L = lambda u, v: ((fx + u * fw - box[0]) * sx, (fy + v * fh - box[1]) * sy)     # landmark in working px
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rxy = 0.49 - 0.17 * np.clip((yy / H - 0.45) / 0.45, 0, 1)
    ell = (((xx / W - 0.5) / rxy) ** 2 + ((yy / H - 0.47) / 0.53) ** 2) <= 1.0
    # --- segmentation: rembg (u2net human) on the upscaled photo, cropped with the same transform
    mimg = Image.fromarray(SEG_MASK).transform((W, H), Image.AFFINE, (cw / W, 0, box[0], 0, ch / H, box[1]), resample=Image.BICUBIC, fillcolor=0)
    soft = np.array(mimg).astype(np.float32) / 255
    mask = (soft > 0.5) & ell
    fxc, fyc = L(0.5, 0.5)
    em = lambda x0, y0, rx, ry: (((xx - x0) / rx) ** 2 + ((yy - y0) / ry) ** 2) <= 1
    mask = mask | (em(fxc, fyc + 0.02 * fh * sy, 0.45 * fw * sx, 0.54 * fh * sy) & ell)
    mask = ndimage.binary_opening(mask, iterations=4)
    lab, n = ndimage.label(mask)
    if n > 1: mask = lab == (1 + int(np.argmax(ndimage.sum(mask, lab, range(1, n + 1)))))
    mask = ndimage.binary_fill_holes(mask)
    chin = L(0.5, 1.0)[1]; mask[int(min(H, chin + 0.07 * fh * sy)):, :] = False
    # --- colour fixes
    mm = mask & (np.abs(xx - fxc) < 0.3 * fw * sx) & (np.abs(yy - fyc) < 0.35 * fh * sy)
    af = a.astype(np.float32)
    if mm.sum() > 100:
        mean = af[mm].mean(0); mx, mn_ = af[mm].max(1), af[mm].min(1)
        sat = float(np.mean((mx - mn_) / np.maximum(mx, 1)))
        if sat < 0.12:
            lum = af.mean(-1) / 255; t = np.clip((lum - 0.30) / 0.62, 0, 1)[..., None]
            col = np.array([150, 88, 66], np.float32) + (np.array([244, 204, 176], np.float32) - np.array([150, 88, 66], np.float32)) * t
            dk = np.clip((0.34 - lum) / 0.12, 0, 1)[..., None]
            af = col * (1 - dk) + np.array([40, 34, 32], np.float32) * dk
        else:
            tgt = np.array([1.0, 0.78, 0.66]) * mean.mean() / 0.8133
            gain = np.clip(tgt / np.maximum(mean, 1), 0.6, 1.6)
            af = np.clip(af * (gain if mean[1] > 0.80 * mean[0] else gain ** 0.5), 0, 255)
    # --- caricature warps (inverse maps in working space)
    X, Y = xx.copy(), yy.copy()
    enl = 1.0
    def Wp(kind, k=1.0):
        nonlocal X, Y
        if kind == 'nose':
            c = L(0.5, 0.62); X, Y = bulge(X, Y, c[0], c[1] + 0.03 * fh * sy, 0.34 * fw * sx, 0.40 * fh * sy, 0.60 * k)
        elif kind == 'eyes':
            for u in (0.3, 0.7):
                c = L(u, 0.40); X, Y = bulge(X, Y, c[0], c[1], 0.22 * fw * sx, 0.18 * fh * sy, 0.50 * k)
        elif kind == 'cheeks':
            for u in (0.14, 0.86):
                c = L(u, 0.70); X, Y = bulge(X, Y, c[0], c[1], 0.34 * fw * sx, 0.34 * fh * sy, 0.55 * k)
        elif kind == 'mouth':
            c = L(0.5, 0.80); X, Y = bulge(X, Y, c[0], c[1], 0.36 * fw * sx, 0.20 * fh * sy, 0.55 * k)
        elif kind == 'brows':
            c = L(0.5, 0.31); X, Y = bulge(X, Y, c[0], c[1], 0.50 * fw * sx, 0.14 * fh * sy, 0.50 * k)
        elif kind == 'ears':
            for u in (-0.02, 1.02):
                c = L(u, 0.52); X, Y = bulge(X, Y, c[0], c[1], 0.26 * fw * sx, 0.30 * fh * sy, 0.50 * k)
        elif kind == 'jaw':
            y0 = L(0, 0.55)[1]; t = np.clip((Y - y0) / (chin - y0 + 1), 0, 1.2); f = 1 + 0.30 * k * np.sin(np.minimum(t, 1) * math.pi / 2)
            X = fxc + (X - fxc) / f
            ys = np.clip((Y - L(0, 0.75)[1]) / (0.3 * fh * sy), 0, 1); Y = Y - 0.10 * fh * sy * k * ys * ys * 0   # (chin length via mask only)
        elif kind == 'forehead':
            y1 = L(0, 0.38)[1]; t = np.clip(1 - Y / y1, 0, 1)           # upper third stretched taller
            Y = Y + (y1 - Y) * 0.30 * k * np.clip(t, 0, 1) * (Y < y1)
            f = 1 + 0.16 * k * np.clip(t, 0, 1); X = fxc + (X - fxc) / f
    Wp(wlist[0], 0.85)
    for k in wlist[1:3]: Wp(k, 0.5)
    Wp('cheeks', 0.25)               # a little puffiness for everybody
    # global enlargement of the face to fill the head box
    Mx = X.astype(np.float32); My = Y.astype(np.float32)
    wimg = cv2.remap(af.astype(np.float32), Mx, My, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    wm = cv2.remap(mask.astype(np.float32), Mx, My, cv2.INTER_LINEAR, borderValue=0)
    # --- painted look
    bgr = cv2.cvtColor(np.clip(wimg, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    bgr = cv2.bilateralFilter(bgr, 9, 35, 9)
    lab0 = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    lab0[..., 0] = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(4, 4)).apply(lab0[..., 0])
    bgr = cv2.cvtColor(lab0, cv2.COLOR_LAB2BGR)
    for sg, am in ((3.0, 0.5), (1.4, 0.4)):
        blur = cv2.GaussianBlur(bgr, (0, 0), sg); bgr = cv2.addWeighted(bgr, 1 + am, blur, -am, 0)   # sharpen
    lab_ = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    Lc = lab_[..., 0] / 255
    q = np.round(Lc * 5) / 5; bl = np.clip((0.62 - Lc) / 0.3, 0, 1)
    lab_[..., 0] = np.clip((Lc * (1 - 0.25 * bl) + q * 0.25 * bl) * 255 * 1.03 + 6, 0, 255)
    bgr = cv2.cvtColor(lab_.astype(np.uint8), cv2.COLOR_LAB2BGR)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.18, 0, 255)
    if fixgreen:      # tame green casts (hue 28-100 deg) and push skin hues towards warm
        hh = hsv[..., 0] * 2
        gm_ = ((hh > 50) & (hh < 190)).astype(np.float32)
        gm_ = cv2.GaussianBlur(gm_, (0, 0), 3)
        hsv[..., 1] *= (1 - 0.85 * gm_)
        yel = ((hh > 38) & (hh <= 50)).astype(np.float32); hsv[..., 0] = np.where(yel > 0, hsv[..., 0] - 6, hsv[..., 0])
    bgr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
    bgr[..., 2] *= 1.03; bgr[..., 0] *= 0.96
    bgr = np.clip(bgr, 0, 255).astype(np.uint8)
    # soft alpha (feathered, slightly eroded)
    al = cv2.GaussianBlur((wm > 0.5).astype(np.float32), (0, 0), 3)
    al = np.clip((al - 0.5) * 3 + 0.5, 0, 1)
    al = cv2.erode(al, np.ones((5, 5), np.uint8))
    # ink lines on features
    g = cv2.GaussianBlur(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), (0, 0), 2.2)
    ed = cv2.Canny(g, 30, 80)
    ed = cv2.dilate(ed, np.ones((2, 2), np.uint8))
    inner = cv2.erode((al > 0.9).astype(np.uint8), np.ones((19, 19), np.uint8)) > 0
    ed = (ed > 0) & inner
    edf = cv2.GaussianBlur(ed.astype(np.float32), (0, 0), 1.0) * 0.40
    rgb = bgr[..., ::-1].astype(np.float32)
    ink = np.array(INK[:3], np.float32)
    rgb = rgb * (1 - edf[..., None]) + ink * edf[..., None]
    head = np.dstack([rgb, al * 255]).astype(np.uint8)
    skin = np.median(rgb[(al > 0.9) & (np.abs(xx - W / 2) < 0.15 * W) & (yy > 0.55 * H) & (yy < 0.75 * H)], axis=0) if ((al > 0.9)).any() else np.array([220, 170, 140])
    top = (al > 0.9) & (yy < H * 0.30)
    hair = np.median(rgb[top], axis=0) if top.sum() > 50 else skin
    return Image.fromarray(head, 'RGBA'), tuple(int(v) for v in skin), tuple(int(v) for v in hair)

# ------------------------------------------------------------------ drawing helpers (design units, supersampled)
def shade(c, f): return tuple(max(0, min(255, int(v * f))) for v in c[:3])
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

class Cv:
    def __init__(s): s.im = Image.new('RGBA', (N, N), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)
    def P(s, pts): return [(x * SS, y * SS) for x, y in pts]
    def poly(s, pts, fill, ink=True, w=1.6):
        s.d.polygon(s.P(pts), fill=tuple(fill[:3]) + (255,), outline=INK if ink else None, width=int(w * SS) if ink else 0)
    def ell(s, box, fill, ink=True, w=1.6):
        s.d.ellipse([box[0] * SS, box[1] * SS, box[2] * SS, box[3] * SS], fill=tuple(fill[:3]) + (255,), outline=INK if ink else None, width=int(w * SS) if ink else 0)
    def rr(s, box, r, fill, ink=True, w=1.6):
        s.d.rounded_rectangle([box[0] * SS, box[1] * SS, box[2] * SS, box[3] * SS], radius=r * SS, fill=tuple(fill[:3]) + (255,), outline=INK if ink else None, width=int(w * SS) if ink else 0)
    def line(s, pts, fill, w=1.6):
        s.d.line(s.P(pts), fill=tuple(fill[:3]) + (255,), width=int(w * SS), joint='curve')
    def glow(s, kind, box_or_pts, color, alpha):
        t = Image.new('RGBA', (N, N), (0, 0, 0, 0)); td = ImageDraw.Draw(t); c = tuple(color[:3]) + (alpha,)
        if kind == 'ell': td.ellipse([v * SS for v in box_or_pts], fill=c)
        else: td.polygon(s.P(box_or_pts), fill=c)
        s.im.alpha_composite(t.filter(ImageFilter.GaussianBlur(2.5 * SS)))

C = dict(green=(70, 170, 90), dgreen=(36, 110, 60), gold=(244, 200, 60), white=(246, 246, 240), gray=(150, 150, 165), dgray=(80, 80, 96),
         red=(216, 58, 48), dred=(140, 30, 36), brown=(160, 100, 52), dbrown=(96, 58, 30), blue=(80, 160, 232), pink=(240, 150, 170),
         purple=(130, 80, 170), dpurple=(84, 50, 120), orange=(240, 140, 40), yellow=(250, 224, 80), cream=(240, 228, 190), black=(40, 40, 52), teal=(70, 170, 190))

# ---- props (anchor: right hand, bottom centre) -------------------------------------------------
def prop(cv, kind, x=202, y=236):
    c = C
    if kind == 'cash':
        for i, dy in enumerate((0, -10, -20)):
            cv.rr((x - 30, y - 24 + dy, x + 30, y - 4 + dy), 3, c['green'] if i % 2 == 0 else (90, 190, 105))
            cv.ell((x - 8, y - 20 + dy, x + 8, y - 8 + dy), c['gold'], w=1.0)
        cv.rr((x - 6, y - 46, x + 6, y - 4), 1, c['white'], w=1.0)
    elif kind in ('mala', 'malas'):
        n = 1 if kind == 'mala' else 3
        cols = [c['brown'], c['dred'], (190, 140, 80)]
        for i in range(n):
            by = y - 4 - i * 28; w2 = 34 - i * 4
            cv.rr((x - 8, by - 50 + 0, x + 8, by - 42), 3, (0, 0, 0), ink=True, w=1.6) if False else None
            cv.rr((x - w2, by - 28, x + w2, by), 5, cols[i % 3])
            cv.line([(x - 10, by - 28), (x - 10, by - 36), (x + 10, by - 36), (x + 10, by - 28)], c['dgray'], 2.2)
            cv.rr((x - 5, by - 18, x + 5, by - 10), 2, c['gold'], w=1.0)
            cv.glow('ell', (x - w2 + 4, by - 26, x + w2 - 6, by - 20), (255, 255, 255), 60)
    elif kind == 'gravador':
        cv.rr((x - 16, y - 62, x + 16, y - 4), 6, c['dgray']); cv.rr((x - 10, y - 56, x + 10, y - 36), 3, c['gray'])
        cv.ell((x - 5, y - 28, x + 5, y - 18), c['red'], w=1.0); cv.line([(x - 9, y - 12), (x + 9, y - 12)], c['gray'], 1.4)
    elif kind == 'papel':
        cv.poly([(x - 26, y - 62), (x + 18, y - 62), (x + 28, y - 52), (x + 28, y - 4), (x - 26, y - 4)], c['white'])
        for i in range(5): cv.line([(x - 18, y - 48 + i * 9), (x + 20, y - 48 + i * 9)], (150, 150, 165), 1.8)
    elif kind == 'celular':
        cv.rr((x - 18, y - 64, x + 18, y - 4), 7, c['black']); cv.rr((x - 14, y - 58, x + 14, y - 12), 3, c['blue'], w=1.0)
        cv.poly([(x - 14, y - 58), (x + 2, y - 58), (x - 14, y - 36)], (170, 215, 250), ink=False)
    elif kind == 'arma':
        cv.poly([(x - 34, y - 42), (x + 22, y - 42), (x + 22, y - 28), (x - 4, y - 28), (x - 4, y - 8), (x - 18, y - 8), (x - 20, y - 28), (x - 34, y - 28)], c['dgray'])
        cv.line([(x - 30, y - 38), (x + 18, y - 38)], c['gray'], 1.8)
    elif kind == 'granada':
        cv.ell((x - 20, y - 52, x + 20, y - 6), c['dgreen']); cv.rr((x - 8, y - 62, x + 8, y - 50), 2, c['gray'])
        cv.ell((x + 4, y - 70, x + 20, y - 58), (0, 0, 0), ink=True, w=1.6); cv.glow('ell', (x - 14, y - 46, x - 2, y - 28), (255, 255, 255), 70)
    elif kind == 'chocolate':
        cv.rr((x - 18, y - 60, x + 18, y - 4), 3, c['dbrown']); cv.rr((x - 18, y - 60, x + 18, y - 38), 3, c['red'])
        cv.rr((x - 18, y - 52, x + 18, y - 46), 1, c['gold'], w=1.0)
        for i in range(3):
            for j in range(2): cv.rr((x - 15 + j * 16, y - 34 + i * 10, x - 3 + j * 16, y - 26 + i * 10), 1, c['brown'], w=1.0)
    elif kind == 'boi':
        cv.poly([(x - 30, y - 64), (x - 22, y - 50), (x - 32, y - 46)], c['yellow']); cv.poly([(x + 30, y - 64), (x + 22, y - 50), (x + 32, y - 46)], c['yellow'])
        cv.ell((x - 24, y - 56, x + 24, y - 10), c['white']); cv.ell((x - 22, y - 50, x - 6, y - 36), c['black'], ink=False)
        cv.ell((x - 14, y - 22, x + 14, y - 4), c['pink']); cv.ell((x - 10, y - 16, x - 6, y - 10), c['dred'], ink=False); cv.ell((x + 6, y - 16, x + 10, y - 10), c['dred'], ink=False)
        cv.ell((x - 14, y - 40, x - 8, y - 33), c['black'], ink=False); cv.ell((x + 8, y - 40, x + 14, y - 33), c['black'], ink=False)
    elif kind == 'aviao':
        cv.poly([(x - 36, y - 26), (x - 4, y - 38), (x + 8, y - 38), (x - 12, y - 18)], c['blue']); cv.poly([(x - 36, y - 10), (x - 4, y - 2), (x + 8, y - 2), (x - 12, y - 22)], c['blue'])
        cv.ell((x - 32, y - 34, x + 34, y - 10), c['white']); cv.poly([(x - 30, y - 34), (x - 36, y - 52), (x - 20, y - 34)], c['red']); cv.ell((x + 12, y - 30, x + 28, y - 20), c['blue'], w=1.0)
    elif kind == 'carro':
        cv.rr((x - 38, y - 30, x + 34, y - 10), 7, c['red']); cv.poly([(x - 20, y - 30), (x - 12, y - 46), (x + 12, y - 46), (x + 22, y - 30)], c['red'])
        cv.poly([(x - 16, y - 31), (x - 10, y - 43), (x - 1, y - 43), (x - 1, y - 31)], c['blue'], w=1.0); cv.poly([(x + 3, y - 31), (x + 3, y - 43), (x + 11, y - 43), (x + 18, y - 31)], c['blue'], w=1.0)
        for wx in (x - 22, x + 18): cv.ell((wx - 9, y - 18, wx + 9, y), c['black']); cv.ell((wx - 4, y - 13, wx + 4, y - 5), c['gray'], w=1.0)
    elif kind == 'mandado':
        cv.rr((x - 14, y - 64, x + 14, y - 4), 6, c['cream']); cv.ell((x - 14, y - 70, x + 14, y - 58), (226, 210, 170)); cv.ell((x - 14, y - 10, x + 14, y + 2), (226, 210, 170))
        cv.line([(x - 14, y - 36), (x + 14, y - 36)], c['red'], 4); cv.ell((x - 8, y - 44, x + 8, y - 28), c['red']); cv.ell((x - 3, y - 39, x + 3, y - 33), c['dred'], ink=False)
    elif kind == 'saco':
        cv.poly([(x - 8, y - 62), (x + 8, y - 62), (x + 6, y - 50), (x - 6, y - 50)], c['black'])
        for i, px in enumerate((-12, 0, 12)): cv.rr((x + px - 7, y - 70 - i % 2 * 5, x + px + 7, y - 52), 2, c['green'], w=1.2)
        cv.ell((x - 30, y - 56, x + 30, y - 2), c['black']); cv.glow('ell', (x - 22, y - 50, x - 6, y - 28), (255, 255, 255), 80)
    elif kind == 'calc':
        cv.rr((x - 22, y - 62, x + 22, y - 4), 5, c['gray']); cv.rr((x - 17, y - 56, x + 17, y - 42), 2, (190, 225, 190), w=1.0)
        for i in range(3):
            for j in range(3): cv.rr((x - 16 + j * 12, y - 36 + i * 11, x - 8 + j * 12, y - 28 + i * 11), 1, c['dgray'], w=1.0)
        cv.line([(x - 8, y - 62), (x, y - 44), (x - 4, y - 30), (x + 6, y - 4)], c['black'], 1.6)
    elif kind == 'claquete':
        cv.rr((x - 30, y - 42, x + 30, y - 4), 3, c['black']); cv.poly([(x - 30, y - 44), (x + 24, y - 62), (x + 30, y - 52), (x - 28, y - 36)], c['white'])
        for i in range(4): cv.poly([(x - 26 + i * 14, y - 42), (x - 18 + i * 14, y - 44), (x - 12 + i * 14, y - 56), (x - 20 + i * 14, y - 54)], c['black'], ink=False)
        cv.line([(x - 22, y - 28), (x + 22, y - 28)], c['white'], 1.6)
    elif kind == 'mic':
        cv.rr((x - 5, y - 36, x + 5, y - 4), 3, c['dgray']); cv.ell((x - 14, y - 66, x + 14, y - 34), c['gold']); cv.glow('ell', (x - 8, y - 60, x, y - 46), (255, 255, 255), 110)
        cv.line([(x - 12, y - 50), (x + 12, y - 50)], c['dbrown'], 1.2)
    elif kind == 'envelope':
        cv.rr((x - 32, y - 48, x + 32, y - 4), 3, c['cream']); cv.line([(x - 32, y - 48), (x, y - 24), (x + 32, y - 48)], (190, 170, 120), 1.8)
        cv.ell((x - 8, y - 36, x + 8, y - 20), c['red']); cv.line([(x - 3, y - 32), (x + 3, y - 32), (x - 3, y - 26), (x + 3, y - 26)], c['white'], 1.2)
    elif kind == 'cone':
        cv.rr((x - 24, y - 8, x + 24, y), 2, c['black']); cv.poly([(x - 18, y - 8), (x - 5, y - 66), (x + 5, y - 66), (x + 18, y - 8)], c['orange'])
        cv.poly([(x - 14, y - 26), (x + 14, y - 26), (x + 11, y - 38), (x - 11, y - 38)], c['white'], ink=False)
    elif kind in ('bone', 'guardanapo', 'medalha', 'faixa', 'mascara'):
        pass

def prop_over_head(cv, kind):
    c = C
    if kind == 'guardanapo':
        cv.poly([(56, 56), (62, 26), (90, 10), (128, 6), (166, 10), (194, 26), (200, 56), (170, 46), (128, 42), (86, 46)], c['white'])
        for xx in (82, 108, 134, 160): cv.line([(xx, 14), (xx + 4, 44)], (205, 205, 215), 1.6)
        cv.ell((44, 46, 62, 66), c['white']); cv.ell((194, 46, 212, 66), c['white'])
    elif kind == 'bone':
        cv.poly([(58, 62), (62, 30), (90, 12), (128, 6), (166, 12), (194, 30), (198, 62), (128, 50)], c['red'])
        cv.poly([(190, 56), (236, 62), (232, 72), (186, 64)], c['dred']); cv.ell((112, 26, 144, 44), c['white'], w=1.2)
        cv.line([(128, 8), (128, 50)], c['dred'], 1.4)
    elif kind == 'mascara':
        cv.glow('ell', (98, 122, 158, 160), (200, 230, 250), 150)
        cv.ell((100, 118, 156, 160), (190, 225, 245), w=1.6); cv.ell((114, 132, 142, 150), (150, 200, 230), w=1.2)
        cv.line([(100, 130), (62, 118)], c['dgray'], 1.8); cv.line([(156, 130), (194, 118)], c['dgray'], 1.8)
        cv.line([(128, 160), (126, 196), (150, 214), (176, 226)], c['dgray'], 3)
        cv.rr((150, 200, 196, 232), 4, c['red'], w=1.4); cv.line([(158, 210), (188, 210)], c['white'], 1.4)

# ---- Pokemon traits ----------------------------------------------------------------------------
def ears(cv, col, inner, y=44, h=34):
    y += 12
    for s in (-1, 1):
        cx = 128 + s * 50
        cv.poly([(cx - s * 22, y + 14), (cx + s * 4, y - h), (cx + s * 34, y + 18)], col)
        cv.poly([(cx - s * 10, y + 12), (cx + s * 4, y - h + 14), (cx + s * 22, y + 14)], inner, ink=False)

def wings(cv, col, dark, big=1.0, bat=False):
    for s in (-1, 1):
        x0 = 128 + s * 66
        pts = [(x0, 176), (x0 + s * 50 * big, 140), (x0 + s * 78 * big, 150), (x0 + s * 70 * big, 186), (x0 + s * 52 * big, 214), (x0 + s * 20, 206)]
        if bat: pts = [(x0, 176), (x0 + s * 40, 120), (x0 + s * 80 * big, 110), (x0 + s * 70 * big, 150), (x0 + s * 84 * big, 170), (x0 + s * 56 * big, 180), (x0 + s * 50 * big, 210), (x0 + s * 20, 200)]
        cv.poly(pts, col); cv.line([(x0 + s * 10, 178), (x0 + s * 50 * big, 160)], dark, 2.2); cv.line([(x0 + s * 14, 192), (x0 + s * 54 * big, 184)], dark, 2.2)

def cloud(cv, cols, skull=False):
    for (x, y, r), col in zip([(34, 150, 22), (22, 120, 17), (46, 186, 18), (222, 150, 22), (234, 120, 17), (210, 186, 18), (60, 208, 14), (196, 208, 14)], cols * 8):
        cv.ell((x - r, y - r, x + r, y + r), col); cv.glow('ell', (x - r * .5, y - r * .8, x + r * .3, y - r * .1), (255, 255, 255), 60)

def spikes(cv, col, n=7, y0=60, r=40):
    for i in range(n):
        a = math.pi + (i + 0.5) * math.pi / n; x = 128 + math.cos(a) * 82; y = 100 + math.sin(a) * 94
        cv.poly([(128 + math.cos(a - .12) * 74, 100 + math.sin(a - .12) * 84), (128 + math.cos(a) * 112, 100 + math.sin(a) * 126), (128 + math.cos(a + .12) * 74, 100 + math.sin(a + .12) * 84)], col)

def horn(cv, col, size=1.0, x=128):
    cv.poly([(x - 14 * size, 44), (x, 44 - 46 * size), (x + 14 * size, 44)], col)
    cv.line([(x - 8 * size, 38), (x + 8 * size, 28)], (255, 255, 255), 1.4)

def magnets(cv):
    for (x, y, rot) in ((46, 60, 0), (214, 60, 1), (128, 8, 2)):
        cv.rr((x - 14, y - 10, x + 14, y + 10), 3, C['gray'])
        cv.rr((x - 14, y - 10, x - 2, y + 10), 3, C['red']); cv.rr((x + 2, y - 10, x + 14, y + 10), 3, C['blue'])

def trait(cv_b, cv_f, name, view):
    """cv_b: drawn BEHIND the figure, cv_f: IN FRONT. view: 'front'|'back'"""
    c = C; fr = view == 'front'
    n = name
    if n in ('Meowth', 'Persian'):
        ears(cv_b if False else cv_f, (240, 220, 160) if n == 'Meowth' else (250, 240, 215), (230, 150, 150) if n == 'Meowth' else (200, 140, 160))
        if fr:
            if n == 'Meowth': cv_f.ell((116, 26, 140, 50), c['gold'], w=1.6); cv_f.line([(128, 30), (128, 46)], c['dbrown'], 1.4)
            else: cv_f.poly([(128, 22), (138, 34), (128, 48), (118, 34)], c['red']);
    elif n == 'Eevee':
        ears(cv_f, (190, 130, 80), (250, 230, 200), y=48, h=40)
        for s in (-1, 1): cv_b.poly([(128 + s * 20, 176), (128 + s * 90, 200), (128 + s * 70, 240)], (250, 232, 200))
        cv_f.poly([(76, 172), (92, 196), (108, 172), (128, 204), (148, 172), (164, 196), (180, 172), (160, 166), (96, 166)], (250, 232, 200))
    elif n == 'Abra':
        ears(cv_f, (240, 200, 90), (255, 240, 180), y=40, h=56)
        if fr: cv_f.poly([(128, 70), (118, 52), (138, 52)], (160, 100, 60), w=1.2)
    elif n in ('Gengar', 'Haunter', 'Gastly'):
        col = (110, 70, 150) if n != 'Gastly' else (80, 60, 120)
        if n == 'Gengar': spikes(cv_b, col, 6); ears(cv_f, col, (160, 110, 190), y=40, h=36)
        elif n == 'Haunter':
            cloud(cv_b, [(150, 110, 190), (120, 80, 160)]);
            if fr:
                for s in (-1, 1): cv_f.ell((128 + s * 98 - 16, 190, 128 + s * 98 + 16, 220), (130, 90, 170))
        else: cloud(cv_b, [(110, 80, 150), (70, 50, 110)])
    elif n in ('Koffing', 'Weezing'):
        cloud(cv_b, [(170, 120, 210), (130, 90, 180)] if n == 'Koffing' else [(150, 110, 190), (110, 80, 150)])
        if fr and n == 'Koffing':
            cv_f.ell((112, 188, 144, 216), c['white'], w=1.4); cv_f.ell((118, 196, 124, 202), c['black'], ink=False); cv_f.ell((132, 196, 138, 202), c['black'], ink=False)
    elif n in ('Pidgeot', 'Fearow', 'Aerodactyl'):
        col = {'Pidgeot': (190, 140, 90), 'Fearow': (170, 100, 70), 'Aerodactyl': (150, 140, 180)}[n]
        wings(cv_b, col, shade(col, .6), 1.0, bat=n == 'Aerodactyl')
        crest = {'Pidgeot': [(230, 70, 60), (250, 200, 60), (230, 70, 60)], 'Fearow': [(170, 100, 70)] * 3, 'Aerodactyl': [(150, 140, 180)] * 3}[n]
        for i, (dx, hh) in enumerate(((-18, 30), (0, 46), (18, 30))): cv_f.poly([(128 + dx - 12, 40), (128 + dx, 40 - hh), (128 + dx + 12, 40)], crest[i])
    elif n == 'Golbat': wings(cv_b, (120, 90, 190), (70, 50, 130), 1.1, bat=True)
    elif n in ('Rhyhorn', 'Rhydon'):
        horn(cv_f, (190, 190, 200), 1.0 if n == 'Rhyhorn' else 1.5); ears(cv_f, (130, 130, 145), (170, 170, 185), y=50, h=14)
    elif n == 'Tauros':
        for s in (-1, 1): cv_f.poly([(128 + s * 66, 50), (128 + s * 96, 40), (128 + s * 108, 8), (128 + s * 84, 26), (128 + s * 64, 24)], (240, 230, 200))
        ears(cv_f, (150, 90, 50), (200, 150, 110), y=60, h=10)
    elif n in ('Kangaskhan', 'Snorlax', 'Chansey'):
        ears(cv_f, (150, 100, 70) if n != 'Snorlax' else (60, 90, 100), (200, 150, 110) if n != 'Snorlax' else (110, 140, 150), y=46, h=18)
        if fr: cv_f.ell((92, 180, 164, 232), (240, 225, 190) if n != 'Chansey' else (250, 190, 200), w=1.8)
    elif n in ('Kabuto', 'Cloyster', 'Golem'):
        col = {'Kabuto': (160, 120, 70), 'Cloyster': (120, 90, 160), 'Golem': (140, 140, 150)}[n]
        cv_b.ell((30, 4, 226, 200), col); cv_b.ell((52, 24, 204, 196), shade(col, .8), ink=False)
        for a in range(-3, 4): cv_b.line([(128, 100), (128 + a * 34, 4)], shade(col, .6), 2.0)
    elif n == 'Magneton': magnets(cv_f)
    elif n in ('Seadra',):
        for s in (-1, 1):
            cv_f.poly([(128 + s * 70, 80), (128 + s * 110, 60), (128 + s * 90, 110)], c['teal'])
        cv_f.poly([(112, 40), (128, 0), (144, 40), (128, 30)], c['blue'])
    elif n == 'Exeggutor':
        for i, a in enumerate((-70, -35, 0, 35, 70)):
            r = math.radians(a - 90); cv_f.poly([(128, 44), (128 + math.cos(r - .3) * 60, 44 + math.sin(r - .3) * 60), (128 + math.cos(r) * 100, 44 + math.sin(r) * 100), (128 + math.cos(r + .3) * 60, 44 + math.sin(r + .3) * 60)], (70, 170, 70))
    elif n == 'Jynx':
        for s in (-1, 1): cv_b.poly([(128 + s * 70, 60), (128 + s * 104, 120), (128 + s * 96, 220), (128 + s * 60, 180)], (40, 30, 60))
        cv_f.poly([(80, 18), (128, 6), (176, 18), (176, 44), (80, 44)], (40, 30, 60)) if fr else None
    elif n in ('Drowzee', 'Hypno', 'Kadabra'):
        col = (240, 210, 90) if n != 'Hypno' else (250, 240, 220)
        cv_f.poly([(64, 170), (92, 196), (112, 170), (128, 200), (144, 170), (164, 196), (192, 170), (176, 160), (80, 160)], col)
        if n != 'Kadabra': cv_f.line([(214, 130), (232, 196)], c['dgray'], 1.4); cv_f.ell((222, 192, 242, 212), c['gold'])
        else:
            ears(cv_f, (240, 210, 90), (255, 240, 170), y=44, h=48)
            cv_f.line([(236, 150), (228, 232)], (210, 190, 200), 3); cv_f.ell((222, 138, 252, 170), (230, 220, 230))
    elif n in ('Hitmonchan', 'Hitmonlee', 'Primeape', 'Mankey'):
        gc = c['red'] if n in ('Hitmonchan',) else (180, 120, 70)
        for s in (-1, 1): cv_f.ell((128 + s * 96 - 22, 168, 128 + s * 96 + 22, 214), gc)
        if n in ('Mankey', 'Primeape') and fr: cv_f.line([(114, 48), (128, 60), (142, 48)], c['red'], 2.6)
    elif n == 'Rapidash':
        for i in range(5): cv_f.poly([(60 + i * 34, 52), (70 + i * 34, 0 + (i % 2) * 14), (92 + i * 34, 52)], (250, 160, 50))
    elif n == 'Dugtrio':
        cv_f.poly([(54, 56), (66, 30), (128, 12), (190, 30), (202, 56)], c['yellow']); cv_f.rr((46, 50, 210, 64), 5, (240, 190, 40))
        cv_b.ell((10, 224, 246, 262), (140, 100, 60))
    elif n == 'Sandslash': spikes(cv_b, (170, 120, 70), 8)
    elif n == 'Porygon':
        cv_f.poly([(70, 52), (128, 0), (186, 52)], (240, 110, 130)); cv_f.poly([(70, 52), (128, 0), (128, 52)], (90, 160, 230))
    elif n == 'Ditto':
        cv_b.ell((8, 130, 248, 262), (200, 160, 230)); cv_f.ell((60, 190, 70, 198), c['black'], ink=False) if False else None
    elif n == 'Tentacool':
        for s in (-1, 1): cv_b.poly([(128 + s * 70, 120), (128 + s * 100, 190), (128 + s * 84, 244), (128 + s * 62, 190)], (90, 130, 220))
        for dx in (-36, 36): cv_f.ell((128 + dx - 8, 40, 128 + dx + 8, 56), c['red'], w=1.2)
    elif n == 'Jigglypuff':
        cv_f.ell((108, 14, 148, 54), c['pink']) if fr else None; ears(cv_f, c['pink'], (250, 200, 210), y=48, h=26)
    elif n == 'Lickitung':
        if fr: cv_f.rr((114, 150, 142, 200), 12, (240, 120, 140), w=1.8); cv_f.line([(128, 156), (128, 190)], (200, 80, 110), 1.6)

# ---- body ----------------------------------------------------------------------------------------
def draw_body(art, skin, view):
    cv = Cv(); c = C
    robe = art.get('robe'); female = art.get('female')
    suit = hexrgb(art.get('suit', '#2c3558')); dark = shade(suit, .68); light = shade(suit, 1.35)
    tie = hexrgb(art.get('tie', '#d83a30')); shirt = hexrgb(art.get('shirt', '#f4f4f0'))
    pants = shade(suit, .82) if not art.get('suit') else shade(suit, .75)
    # legs & shoes
    for x0 in (98, 132):
        cv.rr((x0, 220, x0 + 26, 248), 3, pants)
    for x0, x1 in ((86, 126), (130, 170)): cv.ell((x0, 242, x1, 256), (30, 24, 28))
    # arms
    cv.poly([(76, 176), (92, 170), (86, 224), (66, 222)], suit); cv.poly([(180, 176), (164, 170), (170, 224), (190, 222)], suit)
    cv.ell((62, 214, 84, 236), skin); cv.ell((172, 214, 194, 236), skin)
    if robe: cv.poly([(80, 196), (176, 196), (186, 248), (70, 248)], suit)
    # torso
    cv.poly([(84, 168), (172, 168), (178, 190), (170, 232), (86, 232), (78, 190)], suit)
    cv.glow('poly', [(128, 168), (172, 168), (178, 190), (170, 232), (128, 232)], dark, 120)
    cv.glow('ell', (86, 170, 112, 200), light, 100)
    cv.line([(128, 214), (128, 232)], dark, 1.6)
    cv.rr((106, 150, 150, 180), 6, shade(skin, .86), ink=False)                       # neck
    if view == 'front':
        if robe:
            cv.poly([(104, 168), (152, 168), (128, 204)], shirt); cv.poly([(96, 168), (112, 168), (128, 206), (110, 232), (92, 196)], dark)
            cv.poly([(160, 168), (144, 168), (128, 206), (146, 232), (164, 196)], dark)
        elif female:
            cv.poly([(106, 168), (150, 168), (128, 204)], skin); cv.line([(106, 168), (128, 204), (150, 168)], dark, 1.6)
        else:
            cv.poly([(106, 168), (150, 168), (128, 208)], shirt)
            cv.poly([(98, 168), (112, 168), (128, 210), (108, 230), (92, 194)], dark); cv.poly([(158, 168), (144, 168), (128, 210), (148, 230), (164, 194)], dark)
            cv.poly([(120, 168), (136, 168), (133, 178), (123, 178)], tie)
            cv.poly([(123, 178), (133, 178), (140, 214), (128, 232), (116, 214)], tie); cv.glow('poly', [(128, 178), (133, 178), (140, 214), (128, 232)], shade(tie, .6), 150)
    else:
        cv.poly([(106, 168), (150, 168), (128, 180)], shirt) if not female else None
    return cv.im

def draw_acc_body(cv, acc):
    c = C
    if acc == 'faixa':
        cv.poly([(88, 168), (104, 168), (176, 214), (176, 232), (164, 232), (84, 186)], c['green'])
        cv.line([(88, 168), (170, 232)], c['yellow'], 2.2); cv.line([(104, 168), (176, 216)], c['yellow'], 2.2)
        cv.ell((150, 208, 170, 228), c['yellow'], w=1.4); cv.ell((156, 214, 164, 222), c['blue'], ink=False)
    elif acc == 'medalha':
        for i, col in enumerate((c['red'], c['blue'], c['yellow'])): cv.rr((92 + i * 7, 186, 98 + i * 7, 204), 1, col, w=1.0)
        cv.ell((92, 202, 112, 222), c['gold'], w=1.4)
        cv.ell((142, 190, 158, 206), c['gold'], w=1.2)

# ------------------------------------------------------------------ compose
def ink_silhouette(im, grow=3.2):
    a = np.array(im)[..., 3]
    k = int(grow * SS) * 2 + 1
    d = cv2.dilate((a > 8).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    o = np.zeros((N, N, 4), np.uint8); o[..., :3] = INK[:3]; o[..., 3] = d
    return Image.fromarray(o, 'RGBA')

def back_head(head, skin, hair, art):
    """Back of the head: silhouette of the front head painted with hair colour."""
    a = np.array(head)[..., 3].astype(np.float32) / 255
    h, w = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    bald = art.get('hair') == 'bald' and not art.get('sides')
    base = np.array(skin if bald else hair, np.float32)
    if not bald and np.abs(base - np.array(skin)).sum() < 60: base = np.array(hexrgb('#3a2c26'), np.float32) if art.get('hc', 'dark') in ('dark', 'brown') else np.array({'gray': (140, 140, 140), 'white': (215, 215, 215), 'dgray': (80, 74, 70), 'blonde': (225, 190, 90)}.get(art.get('hc', 'dark'), (60, 50, 44)), np.float32)
    g = np.clip(1.15 - 0.55 * (yy / h) - 0.35 * np.abs(xx / w - 0.45) * 2, 0.55, 1.25)[..., None]
    col = np.clip(base * g, 0, 255)
    # strand strokes
    rng = np.random.RandomState(7)
    img = Image.fromarray(col.astype(np.uint8)); d = ImageDraw.Draw(img)
    for i in range(26):
        x0 = rng.uniform(.2, .8) * w; y0 = rng.uniform(.05, .35) * h
        d.line([(x0, y0), (x0 + (x0 - w / 2) * .3, y0 + rng.uniform(.2, .5) * h)], fill=tuple(int(v) for v in np.clip(base * 0.72, 0, 255)), width=3)
    if not bald: d.line([(w * .5, h * .04), (w * .5, h * .3)], fill=tuple(int(v) for v in np.clip(base * 0.55, 0, 255)), width=5)
    out = np.dstack([np.array(img.filter(ImageFilter.GaussianBlur(1.2))), (a * 255)]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    # ears
    full = Image.new('RGBA', im.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(full)
    row = a[int(h * .56)] > 0.5
    xs_ = np.where(row)[0]
    if len(xs_):
        for ex in (xs_[0] - 0.045 * w, xs_[-1] - 0.035 * w):
            fd.ellipse([ex, h * .46, ex + 0.08 * w, h * .66], fill=tuple(skin) + (255,))
    full.alpha_composite(im)
    return full

def build(pid, art, pk, view):
    photo = Image.open(os.path.join(FOTOS, pid + '.jpg')); photo.load()
    warps = warps_from_text(pk.get('exaggerate', '')) if pk else (['cheeks', 'forehead'] if pid == 'dino' else ['jaw', 'cheeks'])
    head, skin, hair = make_head(photo, warps, pid in ('temerario', 'golpenaro'))
    art = dict(art)
    if pid in NEW_ACC and 'acc' not in art: art['acc'] = NEW_ACC[pid]
    art['acc'] = {'faixa': 'mala', 'medalha': 'papel', 'bone': 'aviao', 'guardanapo': 'mala', 'mascara': 'papel'}.get(art.get('acc'), art.get('acc'))
    if pid == 'dino': art = dict(robe=True, suit='#15151d', shirt='#f4f4f0', acc='mandado')
    else:
        for kx in ('suit', 'tie', 'shirt', 'robe'): art.pop(kx, None)
    poke = (pk or {}).get('pokemon', '')
    scale = 1.0 if view == 'front' else 1.0
    if view == 'back':
        head = back_head(head, skin, hair, art)
    body = draw_body(art, skin, view)
    cb, cf = Cv(), Cv()
    hx, hy = HX0 * SS, HY0 * SS
    layers = [cb.im, body]
    headl = Image.new('RGBA', (N, N), (0, 0, 0, 0)); headl.alpha_composite(head, (hx, hy))
    front = Cv()
    if view == 'front':
        pass
    over = Cv()
    prp = Cv()
    if view == 'front' and art.get('acc'): prop(prp, art['acc'])
    stack = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for l in (cb.im, body, headl, front.im, cf.im, over.im, prp.im):
        stack.alpha_composite(l)
    sil = ink_silhouette(stack)
    final = Image.new('RGBA', (N, N), (0, 0, 0, 0)); final.alpha_composite(sil)
    # head ink outline stays; compose
    final.alpha_composite(stack)
    # gentle contrast on body parts only? keep
    bb = final.getbbox()
    if bb:
        top, bot = bb[1], bb[3]; sc = (OUTSIZE - 8) * SS / (bot - top)
        sc = min(sc, 1.12)
        w2, h2 = int(N * sc), int(N * sc)
        big = final.resize((w2, h2), Image.LANCZOS)
        canvas = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        ox = N // 2 - w2 // 2; oy = (OUTSIZE - 4) * SS - int(bot * sc)
        canvas.paste(big, (ox, oy))
        final = canvas
    return final.resize((OUTSIZE, OUTSIZE), Image.LANCZOS)

def contact(ids):
    cell = 176; cols = 12 if len(ids) > 40 else 8
    rows = (len(ids) * 2 + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, 60 + rows * (cell + 16)), (240, 238, 228)); d = ImageDraw.Draw(sheet)
    try: f1 = ImageFont.truetype('arialbd.ttf', 28); f2 = ImageFont.truetype('arial.ttf', 12)
    except Exception: f1 = f2 = ImageFont.load_default()
    d.text((14, 14), 'POKEPOL - caricaturas (frente + costas)', fill=(40, 40, 60), font=f1)
    items = []
    for i in ids: items += [i, i + '_back']
    for k, nm in enumerate(items):
        x, y = (k % cols) * cell, 60 + (k // cols) * (cell + 16)
        im = Image.open(os.path.join(OUT, nm + '.png')).convert('RGBA').resize((cell - 8, cell - 8), Image.LANCZOS)
        sheet.paste(im, (x + 4, y), im); d.text((x + 6, y + cell - 6), nm, fill=(30, 30, 50), font=f2)
    os.makedirs(DOCS, exist_ok=True); sheet.save(os.path.join(DOCS, 'sprites-preview.png'))

def main():
    arts, pks = load_meta(); arts.setdefault('dino', {})
    ids = [k for k in arts if k not in SKIP and os.path.exists(os.path.join(FOTOS, k + '.jpg'))]
    want = [a for a in sys.argv[1:]] or ids
    os.makedirs(OUT, exist_ok=True)
    for pid in want:
        for view in ('front', 'back'):
            try:
                im = build(pid, arts[pid], pks.get(pid), view)
                im.save(os.path.join(OUT, pid + ('_back' if view == 'back' else '') + '.png'))
            except Exception as e:
                import traceback; traceback.print_exc(); print('ERRO', pid, view, e)
    miss = [k for k in arts if k not in SKIP and k not in ids]
    print('feitos', len(want), 'sem foto', miss)
    done = [k for k in ids if os.path.exists(os.path.join(OUT, k + '_back.png'))]
    idx = []
    for k in done: idx += [k, k + '_back']
    idx.append('dino') if os.path.exists(os.path.join(OUT, 'dino.png')) else None
    json.dump(idx, open(os.path.join(OUT, 'index.json'), 'w'))
    contact(done)

if __name__ == '__main__':
    main()
