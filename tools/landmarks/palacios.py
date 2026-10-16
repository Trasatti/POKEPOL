from lib import *

def flag(c, x, y):
    c.r(x, y, 1, 11, '#c8ccd8')
    c.r(x + 1, y, 8, 6, '#2a9a3a')
    for dx, dy in ((5,1),(6,1),(4,2),(5,2),(6,2),(7,2),(4,3),(5,3),(6,3),(7,3),(5,4),(6,4)): c.p(x+dx, y+dy, '#f8d818')
    c.r(x+5, y+2, 2, 2, '#2848c0')
    c.r(x + 1, y + 5, 8, 1, '#1c7a2c')

def plaque(c, x, y, w, col='#f0d060'):
    c.r(x, y, w, 3, col); c.r(x, y + 2, w, 1, '#b88020')
    for i in range(x + 2, x + w - 2, 2): c.p(i, y + 1, '#3c2820')

def door(c, wood=WOOD, arch=False, glass=False):
    # ocupa o tile inferior-central: x 40..55, y 48..62
    x0, y0 = 40, 48
    c.box(x0, y0, 16, 15, STONE)
    if arch:
        for (i, j) in ((40,48),(41,48),(40,49),(55,48),(54,48),(55,49)): c.px[i, j] = (0,0,0,0)
    if glass:
        c.r(x0 + 2, y0 + 2, 12, 13, '#3068a8'); c.r(x0 + 2, y0 + 2, 12, 3, '#a8e0f8')
        c.r(x0 + 7, y0 + 2, 2, 13, '#d0d6e4')
        c.r(x0 + 5, y0 + 8, 1, 2, '#fff080'); c.r(x0 + 10, y0 + 8, 1, 2, '#fff080')
    else:
        c.r(x0 + 2, y0 + 2, 12, 13, wood[1]); c.r(x0 + 2, y0 + 2, 12, 2, '#58a0d8')
        c.r(x0 + 2, y0 + 4, 12, 1, wood[0])
        c.r(x0 + 3, y0 + 6, 4, 8, wood[2]); c.r(x0 + 9, y0 + 6, 4, 8, wood[2])
        c.r(x0 + 4, y0 + 7, 2, 6, wood[0]); c.r(x0 + 10, y0 + 7, 2, 6, wood[0])
        c.r(x0 + 7, y0 + 4, 2, 11, wood[0])
        c.p(x0 + 6, y0 + 10, '#fff080'); c.p(x0 + 9, y0 + 10, '#fff080')
    c.r(x0, y0 + 14, 16, 1, STONE[0])

def win(c, x, y, w, h, shut=None, frame=STONE):
    c.r(x - 1, y - 1, w + 2, h + 2, frame[1]); c.r(x - 1, y - 1, w + 2, 1, frame[2]); c.r(x - 1, y + h, w + 2, 1, frame[0])
    c.r(x, y, w, h, '#3a5a98'); c.r(x, y, w, 2, '#80b0e8')
    c.r(x, y, 1, h - 1, '#5888c8'); c.r(x + w // 2, y, 1, h, frame[1])
    if shut:
        c.r(x - 3, y - 1, 2, h + 2, shut[1]); c.r(x + w + 1, y - 1, 2, h + 2, shut[1])
        c.r(x - 3, y - 1, 1, h + 2, shut[2]); c.r(x + w + 2, y - 1, 1, h + 2, shut[0])

def wins(c, xs, y, w, h, **k):
    for x in xs:
        win(c, x, y, w, h, **k); win(c, mirror(x, w), y, w, h, **k)

def palm(c, x, y, h=22, lean=1):
    for t in range(h):
        ox = lean * ((t * t) // (h * 3))
        c.p(x + ox, y - t, WOOD[1] if t % 3 else WOOD[0]); c.p(x + ox + 1, y - t, WOOD[0] if t % 3 else WOOD[0])
        if t % 3 == 1: c.p(x + ox, y - t, WOOD[2])
    tx, ty = x + lean * ((h * h) // (h * 3)), y - h
    for sx in (-1, 1):
        for (L, up) in ((11, 0.7), (11, 0.25), (9, -0.15)):
            for t in range(1, L + 1):
                px = tx + sx * t; py = ty - int(up * t) + int(t * t / (L * 1.4))
                c.p(px, py, GRN[1]); c.p(px, py - 1, GRN[2] if t % 2 else GRN[1]); c.p(px, py + 1, GRN[0] if t % 2 == 0 else None)
    for t in range(1, 5): c.p(tx, ty - t, GRN[2]); c.p(tx + 1, ty - t + 1, GRN[1])
    c.p(tx - 1, ty + 1, '#8a4a20'); c.p(tx + 1, ty + 1, '#8a4a20'); c.p(tx, ty + 2, '#8a4a20')

def classic(c, P):
    wall, trim, roof = P['wall'], P.get('trim', STONE), P['roof']
    c.box(4, 24, 88, 38, wall)
    c.r(4, 56, 88, 6, wall[0]); c.r(4, 56, 88, 1, wall[1])
    for x in range(4, 92, 4): c.p(x, 59, wall[1])
    c.r(4, 40, 88, 1, wall[0])
    if P.get('hip'):
        for sx in (0, 1):
            pts = [(2, 25), (25, 25), (21, 14), (7, 14)] if sx == 0 else [(94, 25), (71, 25), (75, 14), (89, 14)]
            m = pm(pts); c.fill(m, roof)
            for (px_, py_) in m:
                if py_ in (16, 19, 22) and (px_ - 1, py_) in m and (px_ + 1, py_) in m: c.p(px_, py_, roof[0])
    else:
        c.box(2, 21, 92, 4, trim)
        for x in range(4, 92, 3):
            if not 22 <= x <= 72: c.r(x, 17, 2, 4, trim[1]); c.p(x, 17, trim[2])
    for y in (28, 43):
        wins(c, (6, 14), y, 6, 9, shut=P.get('shut'), frame=trim)
    c.r(24, 22, 48, 40, wall[0])
    if P.get('dome'):
        dc = P.get('domec', roof)
        c.box(28, 17, 40, 6, trim)
        c.fill(rm(37, 11, 22, 6), trim); win(c, 41, 12, 3, 3, frame=trim); win(c, 52, 12, 3, 3, frame=trim)
        c.fill(em(47.5, 11, 12, 9, top=True), dc, 2)
        for k in (-7, -3, 0, 3, 7): c.line(47 + k, 11, 47 + k, 11 - int(8 * (1 - (k / 12.0) ** 2) ** .5) + 1, dc[0])
        c.r(47, 0, 2, 3, GOLD[1])
        flag(c, 49, 0)
        plaque(c, 38, 19, 20)
    else:
        c.fill(pm([(23, 20), (47, 10), (48, 10), (72, 20)]), trim)
        c.flat(pm([(29, 19), (47, 13), (48, 13), (66, 19)]), wall[0])
        c.r(46, 15, 4, 3, GOLD[1]); c.r(47, 15, 2, 1, GOLD[2])
        c.box(22, 20, 52, 4, trim)
        plaque(c, 38, 21, 20)
        flag(c, 48, 0)
    for x in (27, 34, 58, 65):
        c.r(x, 25, 4, 31, trim[1]); c.r(x, 25, 1, 31, trim[2]); c.r(x + 3, 25, 1, 31, trim[0])
        c.r(x - 1, 24, 6, 2, trim[2]); c.r(x - 1, 25, 6, 1, trim[0]); c.r(x - 1, 55, 6, 2, trim[1]); c.r(x - 1, 56, 6, 1, trim[0])
    c.box(21, 57, 54, 3, trim); c.box(18, 60, 60, 2, trim)
    door(c, wood=P.get('door', WOOD), arch=P.get('arch', False))
    if P.get('lions'):
        for x in (22, 68):
            c.fill(rm(x, 52, 6, 5), OCHRE); c.fill(rm(x + 1, 48, 4, 4), OCHRE); c.p(x + 2, 49, K); c.p(x + 3, 49, K)

def colonial(c, P):
    wall, trim, roof = P['wall'], P.get('trim', WHITE), P.get('roof', ROOF)
    shut = P.get('shut', DGRN)
    c.box(4, 22, 88, 40, wall)
    c.r(4, 56, 88, 6, trim[1]); c.r(4, 56, 88, 1, trim[2]); c.r(4, 61, 88, 1, trim[0])
    c.box(3, 22, 90, 3, trim)
    m = pm([(1, 23), (95, 23), (87, 9), (9, 9)]); c.fill(m, roof)
    for (px_, py_) in m:
        if (px_ - 1, py_) in m and (px_ + 1, py_) in m and (px_, py_ + 1) in m:
            if py_ in (11, 14, 17, 20): c.p(px_, py_, roof[0])
            elif py_ in (10, 13, 16, 19) and (px_ + py_) % 5 == 0: c.p(px_, py_, roof[2])
    c.fill(pm([(36, 10), (47, 3), (48, 3), (60, 10)]), trim)
    c.fill(rm(38, 9, 20, 3), trim)
    if P.get('tower'):
        c.box(6, 8, 14, 15, trim); c.fill(pm([(4, 8), (22, 8), (13, 0)]), roof)
        c.r(11, 13, 4, 6, '#3a5a98'); c.r(11, 13, 4, 2, '#80b0e8')
        flag(c, 60, 0)
    else:
        flag(c, 48, 0) if False else flag(c, 48, 0)
    for y in (28, 44):
        wins(c, (9, 20, 30), y, 6, 9, shut=shut, frame=trim)
    plaque(c, 38, 24, 20, P.get('plq', '#f0d060'))
    win(c, 43, 30, 9, 8, frame=trim)
    c.r(40, 38, 16, 2, trim[1]); c.r(40, 38, 16, 1, trim[2])
    for x in range(40, 56, 2): c.r(x, 36, 1, 2, '#2c2c3c')
    c.r(40, 36, 16, 1, '#2c2c3c')
    door(c, wood=P.get('door', WOOD), arch=True)

def modern(c, P):
    mode, slab, glass = P['mode'], P['slab'], P.get('glass', GLASS)
    acc = P.get('acc', RED)
    def ribbon(x, y, w, h):
        c.r(x, y, w, h, glass[1]); c.r(x, y, w, 1, glass[2]); c.r(x, y + h - 1, w, 1, glass[0])
        for i in range(x + 6, x + w, 6): c.r(i, y, 1, h, slab[1])
    fy = 0
    if mode == 'pilotis':
        c.r(5, 32, 86, 30, glass[0]); c.r(5, 34, 86, 28, glass[1]); c.r(5, 34, 86, 3, glass[2])
        for i in range(5, 91, 7): c.r(i, 34, 1, 28, glass[0])
        c.box(2, 10, 92, 22, slab)
        ribbon(5, 14, 86, 6); ribbon(5, 23, 86, 6)
        c.r(2, 31, 92, 1, slab[0])
        for x in (4, 20, 34, 59, 73, 89): c.box(x, 33, 3, 29, slab)
        fy = 0
    elif mode == 'colonnade':
        c.r(6, 22, 84, 40, glass[1]); c.r(6, 22, 84, 3, glass[2])
        for i in range(6, 90, 6): c.r(i, 22, 1, 40, glass[0])
        c.box(2, 10, 92, 12, slab); c.r(2, 18, 92, 1, slab[0])
        for x in (4, 12, 20, 28, 34, 59, 65, 73, 81, 89): c.box(x, 22, 3, 40, slab)
        fy = 0
    elif mode == 'tower':
        c.box(30, 30, 62, 32, slab); ribbon(32, 34, 58, 6); ribbon(32, 44, 58, 6)
        c.r(30, 58, 62, 4, slab[0]); c.r(30, 58, 62, 1, slab[1])
        c.box(6, 4, 24, 58, glass)
        for y in range(8, 58, 6): c.r(8, y, 20, 3, glass[2]); c.r(8, y + 3, 20, 1, glass[0])
        for x in (8, 17, 26): c.r(x, 6, 2, 54, slab[1])
        fy = 17
    elif mode == 'canopy':
        c.r(8, 26, 80, 36, glass[1]); c.r(8, 26, 80, 3, glass[2])
        for i in range(8, 88, 5): c.r(i, 26, 1, 36, glass[0])
        c.fill(em(47.5, 26, 46, 16, top=True), slab, 2)
        c.fill(em(47.5, 26, 38, 9, top=True), glass, 1)
        c.box(2, 25, 92, 3, slab)
        for x in (10, 28, 63, 81): c.box(x, 28, 3, 34, slab)
        fy = 0
    elif mode == 'fins':
        c.box(4, 20, 88, 42, slab)
        c.r(6, 24, 84, 34, glass[1]); c.r(6, 24, 84, 3, glass[2])
        for x in range(6, 90, 6): c.box(x, 20, 3, 42, slab)
        c.box(2, 16, 92, 5, slab); c.r(2, 18, 92, 1, acc[1])
        fy = 5
    if P.get('band'): c.r(2, P['band'], 92, 2, acc[1])
    c.r(39, 47, 18, 1, slab[0])
    door(c, glass=True)
    plaque(c, 38, 43, 20)
    flag(c, 47, fy)

def arcade(c, P):
    wall, trim, roof = P['wall'], P.get('trim', WHITE), P.get('roof', ROOF)
    c.box(4, 18, 88, 44, wall)
    c.box(2, 14, 92, 5, trim)
    for x in range(4, 92, 3): c.r(x, 11, 2, 3, trim[1]); c.p(x, 11, trim[2])
    c.box(3, 33, 90, 3, trim)
    for xs in (6, 14, 22, 30):
        win(c, xs, 22, 6, 9, frame=trim, shut=P.get('shut')); win(c, mirror(xs, 6), 22, 6, 9, frame=trim, shut=P.get('shut'))
    for cx in (9, 21, 33, 63, 75, 87):
        c.r(cx - 3, 43, 7, 19, '#3a5a98'); c.fill(em(cx, 43, 3, 3, top=True), ('#3a5a98', '#3a5a98', '#80b0e8'))
    for x in (3, 15, 27, 36, 57, 69, 81, 91): c.box(x, 40, 3, 22, trim)
    c.box(36, 36, 24, 4, trim)
    c.box(36, 12, 24, 4, wall)
    plaque(c, 38, 26, 20)
    door(c, arch=True)
    c.box(2, 59, 92, 3, trim)
    flag(c, 48, 0)

def make(cid, P):
    c = C(6, 4)
    {'classic': classic, 'colonial': colonial, 'modern': modern, 'arcade': arcade}[P['style']](c, P)
    return c
