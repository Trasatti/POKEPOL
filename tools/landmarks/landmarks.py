from lib import *
from palacios import palm, flag

def hsh(x, y): return ((x * 73856093) ^ (y * 19349663)) & 0xffff

def water(c, x, y, w, h, ramp=SEA):
    c.r(x, y, w, h, ramp[1])
    for j in range(y + 1, y + h, 3):
        for i in range(x, x + w):
            if ((i + j * 5) // 4) % 3 == 0 and (i + j) % 4 < 3 and hsh(i // 4, j) % 3 == 0: c.p(i, j, ramp[2])
    c.r(x, y, w, 1, ramp[2])

def grass(c, x, y, w, h):
    c.r(x, y, w, h, GRN[1])
    for j in range(y, y + h):
        for i in range(x, x + w):
            v = hsh(i, j) % 23
            if v == 0: c.p(i, j, GRN[0]); c.p(i + 1, j, GRN[0])
            elif v == 1: c.p(i, j, GRN[2])
    c.r(x, y, w, 1, GRN[2])

def tree(c, cx, by, r=6):
    c.r(cx - 1, by - 5, 2, 5, WOOD[1]); c.p(cx - 1, by - 5, WOOD[2])
    c.fill(em(cx, by - 5 - r + 2, r, r), DGRN, 2)
    c.fill(em(cx - 1, by - 7 - r + 2, r - 2, r - 2), GRN, 1)

def brick(c, mask, ramp=BRICK):
    c.fill(mask, ramp)
    for (x, y) in mask:
        if y % 3 == 0: c.p(x, y, ramp[0])
        elif (x + (y // 3 % 2) * 3) % 6 == 0: c.p(x, y, ramp[0])
        elif y % 3 == 1 and (x % 6 == 1): c.p(x, y, ramp[2])

def awin(c, x, y, w, h, frame=STONE):  # janela em arco
    m = rm(x, y + w // 2, w, h - w // 2) | em(x + w / 2 - .5, y + w // 2, w / 2 - .5, w / 2 - .5, top=True)
    c.flat(m, '#3a5a98')
    for (i, j) in m:
        if j < y + 3: c.p(i, j, '#80b0e8')
    for (i, j) in m:
        if (i - 1, j) not in m or (i + 1, j) not in m or (i, j - 1) not in m: c.p(i, j, frame[2])
    c.r(x + w // 2, y + 1, 1, h - 1, frame[1])

def sparkle(c, x, y, col='#ffffff'):
    c.p(x, y, col); c.p(x - 1, y, col); c.p(x + 1, y, col); c.p(x, y - 1, col); c.p(x, y + 1, col)

# ------------------------------------------------------------------ SUL
def curitiba():
    c = C(5, 5)
    grass(c, 1, 60, 78, 19)
    GL = ('#58a890', '#a0e0d0', '#e0fff4'); FR = '#2c5a4a'
    def vault(x, y, w, h, ry):
        m = rm(x, y + ry, w, h - ry) | em(x + w / 2 - .5, y + ry, w / 2 - .5, ry, top=True)
        c.fill(m, GL)
        for (i, j) in m:
            if (i - x) % 6 == 0 or (j - y) % 7 == 3: c.p(i, j, FR)
            elif (i - x) % 6 == 1 and (j - y) % 7 != 3: c.p(i, j, GL[2])
        for (i, j) in m:
            if (i - 1, j) not in m or (i, j - 1) not in m or (i + 1, j) not in m: c.p(i, j, FR)
        c.r(x, y + h - 4, w, 4, STONE[1]); c.r(x, y + h - 4, w, 1, STONE[2]); c.r(x, y + h - 1, w, 1, STONE[0])
    vault(4, 42, 24, 22, 9); vault(52, 42, 24, 22, 9)
    vault(20, 18, 40, 46, 17)
    c.fill(em(39.5, 18, 6, 6, top=True), GL); c.r(39, 8, 2, 4, FR); c.p(39, 7, GOLD[1])
    for (i, j) in em(39.5, 18, 6, 6, top=True):
        if (i - 34) % 4 == 0: c.p(i, j, FR)
    c.r(35, 48, 10, 16, '#1c3c34'); c.fill(em(39.5, 48, 5, 4, top=True), ('#1c3c34', '#1c3c34', '#58a890'))
    c.r(39, 50, 2, 14, '#58a890')
    for x in (4, 14, 56, 66):
        c.fill(em(x + 5, 64, 5, 3, top=True), DGRN)
    for (x, y, col) in ((8, 68, '#f04838'), (14, 70, '#f8d818'), (20, 67, '#f06090'), (60, 69, '#f8d818'), (66, 67, '#f04838'), (72, 70, '#f06090'), (30, 70, '#f8d818'), (50, 69, '#f04838')):
        c.p(x, y, col); c.p(x + 1, y, col)
    c.r(36, 66, 8, 12, SAND[1]); c.r(36, 66, 1, 12, SAND[2]); c.r(43, 66, 1, 12, SAND[0])
    return c

def florianopolis():
    c = C(6, 5)
    water(c, 0, 58, 96, 21)
    c.fill(em(5, 56, 14, 8, top=True), GRN); c.fill(em(91, 56, 14, 8, top=True), GRN)
    c.r(0, 58, 96, 1, SEA[0])
    # tabuleiro
    c.box(0, 48, 96, 3, STEEL)
    for x in range(0, 96, 4):
        c.line(x, 51, x + 2, 56, STEEL[0]); c.line(x + 4, 51, x + 2, 56, STEEL[0])
    c.r(0, 56, 96, 1, STEEL[1]); c.r(0, 57, 96, 1, STEEL[0])
    # torres
    for tx in (15, 74):
        c.box(tx, 6, 7, 44, STEEL)
        c.r(tx + 2, 10, 3, 38, STEEL[0]); c.r(tx + 2, 10, 1, 38, STEEL[1])
        for y in range(14, 48, 7): c.r(tx, y, 7, 2, STEEL[2]); c.r(tx, y + 2, 7, 1, STEEL[0])
        c.box(tx - 2, 3, 11, 4, STEEL); c.r(tx + 2, 0, 3, 3, STEEL[1])
    # cabos principais e laterais
    for x in range(18, 78):
        y = 44 - 29 * ((x - 48) / 30.0) ** 2
        c.p(x, round(y), STEEL[2]); c.p(x, round(y) + 1, STEEL[0])
        if x % 4 == 0:
            for j in range(round(y) + 2, 48): c.p(x, j, STEEL[1])
    c.line(18, 7, 0, 46, STEEL[2]); c.line(18, 8, 0, 47, STEEL[0])
    c.line(77, 7, 95, 46, STEEL[2]); c.line(77, 8, 95, 47, STEEL[0])
    for k in range(1, 5):
        x = int(18 - k * 18 / 5); y = 7 + int(k * 39 / 5)
        c.line(x, y, x, 47, STEEL[1])
        x = int(77 + k * 18 / 5); c.line(x, y, x, 47, STEEL[1])
    # pilares na agua
    for x in (14, 75):
        c.box(x, 58, 9, 7, ROCK)
    return c

def portoalegre():
    c = C(5, 5)
    water(c, 0, 68, 80, 11)
    c.r(0, 68, 80, 2, ORANGE[2]); c.r(2, 72, 20, 1, ORANGE[1]); c.r(40, 75, 24, 1, ORANGE[1])
    brick(c, rm(4, 36, 54, 32)); brick(c, rm(56, 52, 20, 16))
    c.fill(pm([(2, 37), (60, 37), (50, 22), (12, 22)]), ('#3a4a60', '#5a6a88', '#8aa0c0'))
    for y in range(24, 37, 3): c.line(6, y, 56, y, '#3a4a60')
    c.box(3, 35, 56, 3, STONE)
    for x in (10, 22, 34, 46):
        awin(c, x, 42, 8, 22, STONE)
    c.fill(rm(56, 50, 22, 3), STONE)
    for x in (60, 68): c.r(x, 56, 6, 8, '#3a5a98'); c.r(x, 56, 6, 2, '#80b0e8'); c.rect_o(x - 1, 55, 8, 10, STONE[1])
    # chamine
    c.fill(rm(63, 6, 8, 46), BRICK);
    for y in range(8, 50, 3): c.r(63, y, 8, 1, BRICK[0])
    c.box(61, 4, 12, 4, STONE); c.r(62, 10, 10, 1, STONE[1])
    c.r(4, 64, 54, 4, STONE[0]); c.r(4, 64, 54, 1, STONE[1])
    c.fill(rm(28, 52, 8, 12), WOOD); awin(c, 28, 50, 8, 14, STONE)
    return c

def saopaulo():
    c = C(6, 5)
    c.r(0, 70, 96, 9, '#9a9aa8'); c.r(0, 70, 96, 1, '#c8c8d4')
    for x in range(0, 96, 8): c.r(x, 76, 4, 1, '#c8c8d4')
    # caixa de vidro inferior ao fundo
    c.r(24, 50, 48, 20, GLASS[0]); c.r(24, 50, 48, 3, GLASS[2]); c.r(24, 53, 48, 17, GLASS[1])
    for x in range(24, 72, 6): c.r(x, 50, 1, 20, GLASS[0])
    # volume suspenso (caixa de vidro)
    c.box(8, 22, 80, 24, GLASS)
    for x in range(8, 88, 5): c.r(x, 22, 1, 24, '#e0e8f0')
    c.r(8, 33, 80, 1, '#e0e8f0')
    c.r(10, 24, 76, 2, GLASS[2])
    # porticos vermelhos
    for px in (12, 74):
        c.box(px, 70 - 56, 10, 56 + 0, RED) if False else None
        c.box(px, 14, 10, 56, RED)
        c.r(px + 3, 20, 4, 44, RED[0]); c.r(px + 3, 20, 1, 44, RED[1])
    c.box(6, 14, 84, 8, RED)
    c.r(6, 15, 84, 1, RED[2])
    c.box(6, 46, 84, 3, RED)
    for x in (4, 86):
        pass
    c.r(8, 68, 3, 2, RED[0]);
    return c

def riodejaneiro():
    c = C(5, 5)
    hill = pm([(0, 79), (0, 68), (8, 60), (18, 54), (28, 48), (34, 44), (46, 44), (54, 48), (64, 54), (72, 60), (79, 68), (79, 79)])
    c.fill(hill, GRN, 2)
    c.tex(hill, lambda x, y: DGRN[1] if hsh(x // 2, y // 2) % 7 == 0 and y > 52 else None)
    rockm = pm([(30, 46), (34, 43), (46, 43), (52, 47), (46, 50), (36, 50)])
    c.fill(rockm, ROCK)
    c.fill(rm(34, 38, 12, 6), STONE)             # pedestal
    c.r(34, 38, 12, 1, STONE[2]); c.r(38, 41, 4, 2, STONE[0])
    # estatua
    robe = pm([(37, 22), (43, 22), (45, 37), (35, 37)])
    c.fill(robe, STONE)
    c.r(39, 22, 1, 15, STONE[0]); c.r(40, 24, 1, 12, STONE[0])
    arms = pm([(17, 17), (62, 17), (62, 20), (57, 21), (44, 23), (35, 23), (22, 21), (17, 20)])
    c.fill(arms, STONE)
    c.r(17, 17, 46, 1, STONE[2])
    c.fill(em(39.5, 13, 3, 4), STONE); c.r(38, 16, 4, 1, STONE[0])
    c.p(38, 13, STONE[0]); c.p(41, 14, STONE[0])
    # sombra do corpo
    c.r(42, 24, 2, 12, STONE[0])
    # detalhes da colina
    for (x, y) in ((12, 64), (60, 62), (24, 58), (70, 68), (8, 72)): tree(c, x, y + 6, 4)
    c.fill(em(40, 79, 26, 7, top=True), ('#3a6a2a', '#4b8a2a', '#6abe30'))
    return c

def vitoria():
    c = C(5, 5)
    water(c, 0, 72, 80, 7)
    cliff = pm([(6, 79), (10, 62), (8, 52), (14, 44), (22, 40), (58, 40), (68, 44), (72, 54), (70, 64), (74, 79)])
    c.fill(cliff, ROCK, 2)
    for (x, y) in cliff:
        if y > 44 and (x * 3 + y // 5) % 11 == 0: c.p(x, y, ROCK[0])
        elif y > 44 and (x * 5 + y // 4) % 17 == 0: c.p(x, y, ROCK[2])
    for (x, y) in ((14, 56), (60, 58), (18, 68), (64, 70)): c.fill(em(x, y, 4, 3), DGRN); c.p(x - 1, y - 1, GRN[2])
    c.fill(rm(10, 38, 58, 3), GRN)
    # convento
    c.box(12, 24, 54, 15, WHITE)
    c.fill(pm([(10, 25), (68, 25), (62, 19), (16, 19)]), ROOF)
    for y in (20, 22, 24): c.line(14, y, 64, y, ROOF[0])
    for x in (16, 24, 48, 56): c.r(x, 29, 4, 6, '#3a5a98'); c.r(x, 29, 4, 1, '#80b0e8')
    # igreja
    c.box(30, 16, 18, 23, WHITE)
    c.fill(pm([(28, 17), (50, 17), (39, 7)]), WHITE)
    c.fill(pm([(32, 16), (46, 16), (39, 10)]), STONE[1])
    c.r(38, 2, 2, 7, '#f0f0f0'); c.r(36, 4, 6, 2, '#f0f0f0')
    c.fill(rm(34, 28, 10, 11), YEL); awin(c, 35, 26, 8, 13, YEL)
    c.r(38, 19, 3, 3, '#3a5a98'); c.rect_o(37, 18, 5, 5, YEL[1])
    # torre sineira
    c.box(56, 12, 9, 13, WHITE); c.fill(pm([(55, 13), (66, 13), (60, 6)]), ROOF)
    c.r(59, 16, 3, 5, '#3a5a98')
    return c

def belohorizonte():
    c = C(5, 5)
    water(c, 0, 68, 80, 11); c.r(0, 66, 80, 3, GRN[1]); c.r(0, 66, 80, 1, GRN[2])
    def parab(cx, base, w, h, ramp):
        m = {(x, y) for y in range(base - h, base) for x in range(cx - w // 2, cx + w // 2 + 1)
             if abs(x - cx) <= (w / 2.0) * ((y - (base - h)) / float(h)) ** 0.5}
        c.fill(m, ramp, 2); return m
    parab(64, 66, 22, 26, WHITE); parab(50, 66, 30, 36, WHITE)
    m1 = parab(30, 66, 38, 46, WHITE)
    # painel de azulejos (Portinari) na fachada
    inner = {(x, y) for (x, y) in m1 if (30 - x) ** 2 / 14.0 ** 2 * 1.0 + 0 < 1 and y > 34 and abs(x - 30) <= 12 * ((y - 20) / 46.0) ** .5 * 1.0}
    c.flat(inner, '#2c60c0')
    for (x, y) in inner:
        if (x + y) % 4 == 0: c.p(x, y, '#80b0e8')
        elif (x - y) % 6 == 0: c.p(x, y, '#e8f0ff')
    c.r(27, 52, 7, 14, WOOD[1]); c.r(30, 52, 1, 14, WOOD[0])
    for (x, y) in m1:
        if abs(x - 30) in (13, 14, 15, 16) and False: pass
    # torre
    c.fill(pm([(4, 66), (12, 66), (10, 12), (6, 12)]), WHITE)
    c.r(7, 20, 2, 40, WHITE[0]); c.box(5, 8, 7, 4, WHITE)
    c.r(5, 8, 7, 1, WHITE[2]); c.r(8, 3, 1, 5, WHITE[0]); c.r(7, 4, 3, 1, WHITE[0])
    for y in (24, 32, 40, 48, 56): c.r(7, y, 2, 3, '#3a5a98')
    return c

# ------------------------------------------------------------------ NORDESTE
def salvador():
    c = C(5, 5)
    water(c, 0, 68, 80, 11)
    c.fill(pm([(52, 22), (80, 22), (80, 68), (46, 68), (50, 46), (52, 34)]), ROCK, 2)
    for (x, y) in rm(52, 30, 28, 38):
        if (x + y * 2) % 13 == 0: c.p(x, y, ROCK[0])
    c.r(52, 22, 28, 2, GRN[1])
    for (x, w, col, rf) in ((56, 8, '#f0d060', ROOF), (65, 7, '#f0a0b8', ROOF), (73, 7, '#80b8f0', ROOF)):
        c.box(x, 12, w, 10, (shade_(col, .75), col, shade_(col, 1.2))); c.fill(pm([(x - 1, 13), (x + w, 13), (x + w - 1, 9), (x, 9)]), rf)
        c.r(x + 2, 15, 2, 3, '#3a5a98')
    # ponte/corredor
    c.box(26, 20, 28, 6, STONE); c.r(26, 22, 28, 1, GLASS[1])
    for x in range(28, 52, 4): c.r(x, 21, 2, 3, '#3a5a98')
    # torre
    c.box(8, 8, 20, 56, STONE)
    c.r(8, 8, 20, 4, CREAM[1]); c.r(8, 8, 20, 1, CREAM[2])
    c.box(6, 4, 24, 5, STONE); c.fill(pm([(10, 4), (26, 4), (18, 0)]), STONE) if False else None
    c.r(14, 1, 8, 3, STONE[1]); c.r(14, 1, 8, 1, STONE[2])
    for y in (14, 24, 34, 44):
        for x in (11, 17, 23):
            c.r(x, y, 3, 7, '#3a5a98'); c.r(x, y, 3, 2, '#80b0e8')
    c.r(8, 56, 20, 8, GRAY[1]); c.r(8, 56, 20, 1, GRAY[2]); c.r(14, 58, 8, 6, '#222034')
    c.r(4, 64, 50, 4, SAND[1]); c.r(4, 64, 50, 1, SAND[2])
    # barquinho
    c.fill(pm([(58, 72), (70, 72), (68, 75), (60, 75)]), WOOD); c.r(64, 64, 1, 8, '#f0f0f0'); c.fill(pm([(65, 64), (65, 71), (71, 71)]), WHITE)
    return c

def shade_(col, f):
    r, g, b = int(col[1:3], 16), int(col[3:5], 16), int(col[5:7], 16)
    return '#%02x%02x%02x' % (min(255, int(r * f)), min(255, int(g * f)), min(255, int(b * f)))

def aracaju():
    c = C(6, 5)
    water(c, 0, 22, 96, 18)
    c.r(0, 36, 96, 5, WHITE[1]); c.r(0, 36, 96, 1, WHITE[2])
    c.r(0, 40, 96, 39, SAND[1]); c.r(0, 40, 96, 1, SAND[2])
    # calcadao
    for x in range(0, 96):
        yy = 66 + int(2.5 * math.sin(x / 4.0))
        c.r(x, 64, 1, 15, '#e8e8f0'); c.r(x, yy, 1, 3, '#222034')
    c.r(0, 64, 96, 1, STONE[0])
    # arcos
    for cx in (17, 48, 79):
        m = em(cx, 38, 14, 28, top=True) - em(cx, 38, 9, 25, top=True)
        m |= rm(cx - 14, 38, 5, 27) | rm(cx + 10, 38, 5, 27)
        m -= (em(cx, 38, 9, 25, top=True) | rm(cx - 9, 38, 19, 27))
        c.fill(m, WHITE, 2)
    palm(c, 6, 64, 26); palm(c, 88, 64, 22, -1)
    return c

def maceio():
    c = C(5, 5)
    water(c, 0, 24, 80, 32)
    c.r(0, 24, 80, 2, '#98c8f0')
    for (x, y) in ((6, 36), (30, 30), (56, 27), (66, 38), (20, 46)):
        c.r(x, y, 5, 1, '#e8f4ff'); c.r(x + 1, y + 1, 3, 1, '#98c8f0')
    c.fill(pm([(0, 58), (80, 50), (80, 79), (0, 79)]), SAND, 2)
    c.r(0, 57, 80, 1, SAND[2])
    for (x, y) in ((10, 66), (30, 72), (52, 64), (70, 70), (22, 62)): c.p(x, y, SAND[0]); c.p(x + 1, y, SAND[0])
    def jangada(x, y, col, sc):
        c.fill(pm([(x, y), (x + 22, y), (x + 20, y + 3), (x + 2, y + 3)]), WOOD)
        for i in range(x + 3, x + 21, 4): c.r(i, y, 1, 3, WOOD[0])
        c.r(x + 10, y - 20, 2, 20, WOOD[0])
        c.fill(pm([(x + 12, y - 20), (x + 12, y - 2), (x + 22, y - 2)]), (sc[0], sc[1], sc[2]))
        c.line(x + 12, y - 19, x + 20, y - 3, sc[0])
        c.r(x - 2, y + 4, 26, 1, '#98c8f0')
    jangada(8, 50, None, WHITE) if False else None
    jangada(26, 46, 0, WHITE); jangada(48, 40, 0, ORANGE)
    palm(c, 8, 68, 34); palm(c, 72, 64, 28, -1)
    return c

def recife():
    c = C(5, 5)
    water(c, 0, 62, 80, 17)
    c.fill(em(40, 70, 36, 9, top=True) | rm(4, 70, 72, 6), STONE, 1)
    c.fill(em(40, 68, 32, 8), ('#a09888', '#d8d0c0', '#f0e8d8'))
    # rosa dos ventos
    for k in range(-9, 10):
        c.p(40 + k * 3, 68, RED[1]) if abs(k) < 8 else None
    c.line(40, 61, 40, 76, '#1c3c88'); c.line(12, 68, 68, 68, '#1c3c88')
    c.fill(pm([(40, 60), (44, 68), (40, 77), (36, 68)]), RED, 1)
    c.fill(pm([(10, 68), (40, 64), (70, 68), (40, 72)]), ('#1c3c88', '#2c60c0', '#80b0e8'))
    # torre de cristal
    t = pm([(33, 62), (47, 62), (44, 8), (36, 8)])
    c.fill(t, GLASS, 2)
    for (x, y) in t:
        if (x - 36) % 4 == 0: c.p(x, y, GLASS[0])
        elif y % 9 == 0: c.p(x, y, GLASS[2])
    c.fill(pm([(36, 8), (44, 8), (40, 1)]), GLASS)
    for (x, y) in ((38, 20), (42, 34), (38, 46), (41, 14)): sparkle(c, x, y) if False else c.p(x, y, '#ffffff')
    c.box(30, 58, 20, 5, STONE)
    return c

def joaopessoa():
    c = C(5, 5)
    water(c, 0, 58, 80, 21)
    cl = pm([(22, 79), (20, 62), (24, 54), (40, 52), (60, 54), (72, 58), (79, 66), (79, 79)])
    c.fill(cl, ORANGE, 2)
    for (x, y) in cl:
        if y > 58:
            if (y // 4) % 3 == 1 and hsh(x // 5, y) % 5 != 0: c.p(x, y, '#f4d8b0')
            elif hsh(x, y // 2) % 11 == 0: c.p(x, y, ORANGE[0])
    c.fill(pm([(22, 54), (40, 52), (60, 54), (72, 58), (22, 58)]), GRN)
    c.r(0, 74, 22, 1, '#e8f4ff'); c.r(4, 70, 10, 1, '#e8f4ff')
    c.fill(pm([(30, 52), (50, 52), (46, 14), (34, 14)]), WHITE, 2)
    c.r(36, 20, 8, 28, WHITE[0]); c.r(36, 20, 1, 28, WHITE[1])
    for y in (24, 34, 44): c.r(36, y, 8, 3, '#3a5a98')
    c.box(30, 10, 20, 5, RED)
    c.box(33, 3, 14, 7, GLASS); c.r(34, 4, 12, 5, '#fff080'); c.r(40, 4, 1, 5, '#e8b830')
    c.fill(pm([(32, 3), (48, 3), (40, 0)]), RED)
    c.fill(rm(34, 44, 12, 9), STONE); c.r(38, 46, 4, 7, '#222034')
    for x in range(24, 80, 7): c.r(x, 77, 4, 1, '#e8f4ff')
    return c

def natal():
    c = C(5, 5)
    water(c, 0, 62, 80, 17)
    for (x, y, w) in ((2, 62, 12), (60, 64, 16), (30, 70, 14)):
        c.fill(em(x + w // 2, y + 2, w // 2, 3, top=True), ROCK)
    c.r(0, 60, 80, 3, SAND[1])
    # muralha
    c.fill(pm([(4, 62), (76, 62), (72, 38), (8, 38)]), CREAM, 2)
    c.fill(pm([(4, 62), (20, 62), (18, 38), (8, 38)]), CREAM[:1] + (CREAM[0], CREAM[1])) if False else None
    for x in range(8, 74, 6): c.r(x, 34, 4, 5, CREAM[1]); c.r(x, 34, 4, 1, CREAM[2]); c.r(x + 3, 34, 1, 5, CREAM[0])
    c.r(8, 38, 64, 1, CREAM[2])
    for x in range(10, 72, 8): c.r(x, 44, 2, 5, CREAM[0])
    # bastioes
    for x in (2, 66):
        c.box(x, 40, 12, 22, CREAM); c.fill(em(x + 6, 40, 6, 5, top=True), RED if False else ROOF)
        c.r(x + 5, 46, 2, 4, '#222034')
    # capela
    c.box(20, 20, 20, 18, WHITE); c.fill(pm([(18, 21), (42, 21), (30, 12)]), WHITE)
    c.fill(pm([(22, 20), (38, 20), (30, 14)]), STONE[1]); c.rect_o(26, 28, 8, 10, STONE[0]) if False else None
    c.r(27, 28, 6, 10, '#3a5a98'); c.fill(em(30, 28, 3, 3, top=True), ('#3a5a98', '#3a5a98', '#80b0e8'))
    c.r(30, 8, 1, 5, '#e8e8e8'); c.r(28, 10, 5, 1, '#e8e8e8')
    c.fill(rm(46, 28, 8, 10), CREAM)
    c.fill(rm(34, 50, 12, 12), ROCK[0]); c.fill(em(40, 50, 6, 5, top=True), ('#222034', '#222034', '#222034'))
    c.r(34, 50, 12, 12, '#222034') if False else None
    flag(c, 58, 18) if False else None
    c.r(62, 24, 1, 14, '#c8ccd8'); c.r(63, 24, 7, 5, '#2a9a3a'); c.r(65, 25, 3, 3, '#f8d818')
    return c

def fortaleza():
    c = C(6, 5)
    water(c, 0, 30, 96, 49)
    # sol baixo
    c.fill(em(70, 30, 10, 10, top=True), ('#e89830', '#f8d048', '#fff088'), 2)
    for y in range(32, 54, 3): c.r(58 + (y % 4), y, 24 - (y % 4) * 2, 1, '#ffb050')
    c.r(0, 30, 96, 1, SEA[2])
    # praia na esquerda
    c.fill(pm([(0, 36), (14, 40), (22, 79), (0, 79)]), SAND, 2)
    # pier
    c.box(10, 46, 82, 4, WOOD)
    c.r(10, 50, 82, 1, WOOD[0])
    for x in range(14, 90, 6):
        c.r(x, 51, 2, 18, GRAY[0]); c.r(x, 51, 1, 18, GRAY[1])
        c.r(x - 1, 51, 4, 1, GRAY[2])
        c.r(x - 1, 64, 4, 2, ROCK[0]) if False else None
    for x in range(14, 90, 6):
        c.r(x, 38, 1, 8, GRAY[0])
    c.r(12, 41, 78, 1, GRAY[1]); c.r(12, 44, 78, 1, GRAY[0])
    for x in (20, 44, 68, 88):
        c.r(x, 28, 2, 18, '#303040'); c.box(x - 2, 24, 6, 5, YEL); c.r(x - 1, 25, 4, 3, '#fff080')
        c.fill(pm([(x - 3, 24), (x + 4, 24), (x + 1, 21)]), GRAY)
    for x in range(14, 90, 6): c.r(x - 1, 70, 4, 1, '#98c8f0')
    return c

def teresina():
    c = C(6, 5)
    water(c, 0, 62, 96, 17, ('#6a5a3a', '#8a7a50', '#a89a70')) if False else water(c, 0, 62, 96, 17)
    c.fill(em(8, 62, 14, 5, top=True), GRN); c.fill(em(88, 62, 14, 5, top=True), GRN)
    # tabuleiro curvo
    for x in range(0, 96):
        y = 54 + int(4 * ((x - 48) / 48.0) ** 2) - 3
        c.r(x, y, 1, 4, STONE[1]); c.p(x, y, STONE[2]); c.p(x, y + 3, STONE[0])
    # estais
    for x in range(6, 91, 4):
        if abs(x - 48) < 4: continue
        y = 54 + int(4 * ((x - 48) / 48.0) ** 2) - 3
        c.line(48, 10, x, y, STEEL[2] if x < 48 else STEEL[1])
    # mastro em X
    c.line(37, 6, 59, 56, STEEL[1], 4); c.line(59, 6, 37, 56, STEEL[1], 4)
    c.line(37, 6, 59, 56, STEEL[2], 1); c.line(59, 6, 37, 56, STEEL[2], 1)
    c.line(40, 6, 62, 56, STEEL[0], 1); c.line(62, 6, 40, 56, STEEL[0], 1)
    c.box(44, 24, 8, 8, STEEL) if False else None
    c.box(46, 8, 4, 6, STEEL)
    c.r(33, 56, 30, 2, STONE[0]) if False else None
    return c

def saoluis():
    c = C(5, 5)
    c.r(0, 70, 80, 9, '#8a7a68'); c.r(0, 70, 80, 1, '#b0a088')
    for x in range(0, 80, 7):
        for y in (73, 76): c.r(x + (y % 2) * 3, y, 4, 2, '#6a5a48')
    def casa(x, w, top, tile, tile2, door, roofc):
        c.box(x, top, w, 70 - top, (shade_(tile, .8), tile, shade_(tile, 1.2)))
        for j in range(top + 3, 70, 3):
            for i in range(x + 1, x + w - 1, 3):
                if (i // 3 + j // 3) % 2 == 0: c.r(i, j, 2, 2, tile2)
                else: c.p(i, j, shade_(tile2, .9))
        c.r(x, top, w, 3, WHITE[1]); c.r(x, top, w, 1, WHITE[2])
        c.fill(pm([(x - 2, top + 1), (x + w + 1, top + 1), (x + w - 2, top - 6), (x + 1, top - 6)]), ROOF)
        for yy in range(top - 5, top, 2): c.line(x, yy, x + w - 1, yy, ROOF[0])
        for wx in (x + 3, x + w - 9):
            c.r(wx - 1, top + 6, 8, 11, WHITE[1]); c.r(wx, top + 7, 6, 9, '#3a5a98'); c.r(wx, top + 7, 6, 2, '#80b0e8'); c.r(wx + 3, top + 7, 1, 9, WHITE[1])
            c.r(wx - 2, top + 17, 10, 2, '#2c2c3c')
        c.r(x + w // 2 - 3, 56, 7, 14, door); c.fill(em(x + w // 2, 56, 3, 3, top=True), (door, door, shade_(door, 1.3)))
        c.r(x + w // 2 - 3, 56, 1, 14, shade_(door, 1.3))
        c.r(x + w // 2 - 4, 55, 9, 1, WHITE[1])
    casa(2, 24, 28, '#2c60c0', '#e8f0ff', '#8f563b', ROOF)
    casa(27, 25, 22, '#e8c038', '#2c8a4a', '#2c8a4a', ROOF)
    casa(53, 25, 30, '#e8e8f0', '#2c60c0', '#b04838', ROOF)
    return c

# ------------------------------------------------------------------ NORTE
def belem():
    c = C(6, 5)
    water(c, 0, 66, 96, 13, ('#6a5a3a', '#8a7a50', '#a89a70'))
    c.r(0, 62, 96, 5, STONE[0]); c.r(0, 62, 96, 1, STONE[1])
    IR = ('#4a6a68', '#7a9a98', '#b8d8d0')
    c.box(18, 34, 60, 28, IR)
    for x in range(20, 76, 4): c.r(x, 36, 1, 24, IR[0])
    for x in (24, 36, 48, 60): c.fill(rm(x, 40, 8, 4), ('#3a5a98', '#3a5a98', '#80b0e8')); c.r(x, 46, 8, 14, '#3a5a98'); c.r(x, 40, 8, 1, STONE[1]); c.r(x + 3, 40, 1, 20, IR[2])
    c.fill(pm([(16, 35), (80, 35), (70, 24), (26, 24)]), ('#3a4a50', '#5a7078', '#98b0b0'))
    for y in (26, 29, 32): c.line(20, y, 76, y, '#3a4a50')
    # torres de canto
    for tx in (10, 74):
        c.box(tx, 28, 12, 34, IR)
        for y in (34, 44, 54): c.r(tx + 4, y, 4, 6, '#3a5a98')
        c.fill(pm([(tx - 2, 29), (tx + 13, 29), (tx + 6, 10)]), ('#3a4a50', '#5a7078', '#98b0b0'))
        c.r(tx + 5, 3, 1, 8, GRAY[2]); c.r(tx + 6, 3, 3, 2, RED[1])
    c.fill(pm([(40, 24), (56, 24), (48, 8)]), ('#3a4a50', '#5a7078', '#98b0b0'))
    c.r(48, 2, 1, 7, GRAY[2])
    # barracas e barcos
    for (x, col) in ((6, '#e84838'), (30, '#f8d048'), (56, '#58b0f0'), (80, '#e84838')):
        c.fill(em(x + 4, 62, 5, 3, top=True), (shade_(col, .7), col, shade_(col, 1.3))); c.r(x + 4, 62, 1, 3, GRAY[0])
    for (x, col) in ((10, '#c04828'), (44, '#2c60c0'), (70, '#e8b830')):
        c.fill(pm([(x, 70), (x + 20, 70), (x + 17, 74), (x + 3, 74)]), WOOD); c.r(x + 2, 69, 16, 1, col); c.r(x + 8, 64, 1, 5, WOOD[0])
        c.fill(rm(x + 10, 66, 6, 4), WHITE)
    return c

def macapa():
    c = C(5, 5)
    c.r(0, 64, 80, 15, '#b8c8a0'); c.r(0, 64, 80, 1, '#d8e8c0')
    water(c, 0, 72, 80, 7)
    c.r(0, 64, 80, 6, SAND[1]); c.r(0, 64, 80, 1, SAND[2])
    # linha do equador
    c.r(0, 66, 80, 3, RED[1]); c.r(0, 66, 80, 1, RED[2]); c.r(0, 68, 80, 1, RED[0])
    for x in range(2, 80, 6): c.r(x, 67, 2, 1, '#ffffff')
    # sol/anel
    c.fill(em(40, 26, 22, 22), ('#e8b830', '#f8d048', '#fff080'), 2)
    c.fill(em(40, 26, 16, 16), ('#222034', '#222034', '#222034')) if False else None
    for (x, y) in em(40, 26, 14, 14): c.px[x, y] = (0, 0, 0, 0)
    for x in range(40, 62, 3): pass
    # marco
    c.fill(pm([(32, 66), (48, 66), (46, 14), (34, 8)]), WHITE, 2)
    c.r(38, 16, 2, 50, WHITE[0]); c.r(36, 12, 8, 1, WHITE[2])
    c.fill(pm([(34, 8), (46, 14), (46, 18), (34, 12)]), STONE)
    c.box(30, 62, 20, 4, STONE)
    for y in range(20, 60, 8): c.r(34, y, 12, 1, STONE[0])
    return c

def boavista():
    c = C(5, 5)
    c.fill(em(40, 70, 36, 9), ('#c8c0a0', '#e8e0c0', '#f8f4e0'))
    c.fill(em(40, 70, 30, 7), ('#4b8a2a', '#6abe30', '#99e550'))
    for (x, y, col) in ((18, 72, '#f04838'), (24, 74, '#f8d818'), (56, 74, '#f06090'), (62, 72, '#f8d818'), (30, 76, '#f04838'), (50, 76, '#f06090')):
        c.p(x, y, col); c.p(x + 1, y, col)
    # pedestal
    c.box(24, 63, 32, 5, STONE); c.box(28, 57, 24, 6, STONE); c.box(32, 40, 16, 17, ROCK)
    c.r(33, 41, 14, 1, ROCK[2])
    c.r(34, 46, 12, 5, GOLD[1]); c.r(34, 46, 12, 1, GOLD[2]); c.r(34, 50, 12, 1, GOLD[0])
    for x in range(36, 45, 2): c.p(x, 48, '#3c2820')
    # garimpeiro (bronze)
    BR = ('#6a4a20', '#a07830', '#d8b050')
    c.fill(rm(35, 30, 4, 10), BR); c.fill(rm(41, 30, 4, 10), BR)
    c.fill(rm(34, 17, 12, 14), BR, 1)
    c.fill(em(39.5, 13, 3, 3), BR)
    c.fill(rm(34, 11, 12, 2), BR); c.fill(rm(36, 8, 8, 4), BR)
    c.line(46, 19, 56, 8, BR[1], 2)
    c.line(34, 20, 28, 33, BR[1], 2)
    c.fill(em(57, 7, 7, 2), ('#4a4a58', '#8a8a98', '#d0d0e0'))
    c.r(52, 6, 10, 1, '#d0d0e0')
    c.line(26, 20, 28, 36, WOOD[1]); c.r(24, 19, 5, 2, GRAY[1])
    return c

def manaus():
    c = C(5, 5)
    c.r(0, 74, 80, 5, STONE[0]); c.r(0, 74, 80, 1, STONE[1])
    # cupula com escamas
    dome = em(39.5, 30, 16, 20, top=True)
    c.fill(dome, ('#2c8a4a', '#2c8a4a', '#2c8a4a'))
    cols = ('#1c7a3c', '#2c60c0', '#f8d048', '#2a9a3a')
    for (x, y) in dome:
        k = ((x + y) // 3) % 3
        c.p(x, y, ('#2a9a3a', '#2c60c0', '#f8d048')[k])
        if (x + y) % 3 == 0: c.p(x, y, ('#1c6a2c', '#1c3c88', '#d8a030')[k])
    for (x, y) in dome:
        if (x - 1, y) not in dome or (x, y - 1) not in dome: c.p(x, y, '#fff080')
        elif (x + 1, y) not in dome: c.p(x, y, '#1c3c88')
    c.fill(rm(34, 4, 12, 7), GOLD, 1); c.fill(em(39.5, 4, 6, 4, top=True), GOLD, 1)
    c.r(39, 0, 2, 3, GOLD[2])
    for y in (22, 28): pass
    c.box(22, 30, 36, 8, PINK)
    for x in (25, 33, 41, 49): c.r(x, 32, 5, 5, '#3a5a98')
    # corpo
    c.box(4, 38, 72, 36, PINK)
    c.box(2, 36, 76, 3, STONE)
    for x in (8, 18, 52, 62):
        c.r(x, 42, 8, 10, '#3a5a98'); c.r(x, 42, 8, 2, '#80b0e8'); c.rect_o(x - 1, 41, 10, 12, STONE[1])
        c.r(x, 56, 8, 14, '#3a5a98'); c.fill(em(x + 3.5, 56, 4, 3, top=True), ('#3a5a98', '#3a5a98', '#80b0e8')); c.rect_o(x - 1, 54, 10, 17, STONE[1])
    # portico central
    c.box(28, 40, 24, 34, STONE)
    c.fill(rm(32, 46, 16, 28), PINK[0])
    for x in (30, 36, 42, 48): c.r(x, 44, 3, 28, STONE[1]); c.r(x, 44, 1, 28, STONE[2]); c.r(x + 2, 44, 1, 28, STONE[0])
    c.fill(rm(34, 58, 12, 16), '#3a2820'); c.fill(em(39.5, 58, 6, 4, top=True), ('#3a2820', '#3a2820', '#3a2820'))
    c.box(26, 38, 28, 3, STONE)
    c.box(24, 70, 32, 3, STONE); c.box(20, 73, 40, 2, STONE)
    return c

def portovelho():
    c = C(6, 5)
    c.r(0, 70, 96, 9, '#8a7a50'); c.r(0, 70, 96, 1, '#a89a70')
    IR = ('#3a3e50', '#5a6078', '#8a90a8')
    # torre de treliça
    c.fill(pm([(16, 70), (22, 38), (46, 38), (52, 70)]), (IR[0], '#222034', IR[1])) if False else None
    for (x0, x1) in ((16, 22), (46, 52)):
        c.line(x0, 70, x0 + 6, 38, IR[1], 2); c.line(x1 + 5, 70, x1 - 1, 38, IR[1], 2) if False else None
    c.line(17, 70, 24, 38, IR[1], 2); c.line(50, 70, 43, 38, IR[1], 2)
    for k in range(0, 4):
        y0 = 38 + k * 8; y1 = y0 + 8
        xl0 = 24 - (y0 - 38) * 7 // 32; xl1 = 24 - (y1 - 38) * 7 // 32
        xr0 = 43 + (y0 - 38) * 7 // 32; xr1 = 43 + (y1 - 38) * 7 // 32
        c.line(xl0, y0, xr1, y1, IR[0]); c.line(xr0, y0, xl1, y1, IR[0])
        c.r(min(xl1, xl0), y1, xr1 - xl1 + 3, 1, IR[2])
    c.box(14, 35, 42, 4, IR)
    RU = ('#5a3a28', '#8a6048', '#c09068')
    for x in (16, 29, 42):
        c.fill(rm(x, 14, 12, 21), GRAY, 2) if False else c.fill(rm(x, 14, 12, 21), ('#6a7888', '#a8b8c8', '#e0e8f0'), 2)
        c.fill(em(x + 5.5, 14, 6, 3, top=True), ('#6a7888', '#a8b8c8', '#e0e8f0'))
        for y in (20, 27): c.r(x, y, 12, 1, '#6a7888')
        c.r(x + 8, 16, 1, 18, '#6a7888')
        for (i, j) in ((x + 2, 29), (x + 5, 31), (x + 3, 22)): c.p(i, j, '#a06848')
    # trilhos
    c.r(0, 74, 96, 2, GRAY[1]); c.r(0, 74, 96, 1, GRAY[2])
    for x in range(0, 96, 5): c.r(x, 76, 3, 3, WOOD[0])
    # locomotiva
    c.fill(rm(60, 54, 22, 11), ('#14141c', '#2c2c38', '#585868'), 1)
    c.r(60, 60, 22, 1, GOLD[1])
    c.fill(rm(76, 46, 5, 8), ('#14141c', '#2c2c38', '#585868')); c.r(75, 45, 7, 2, GOLD[1])
    c.fill(em(68, 46, 2, 2), ('#e8e8f0', '#e8e8f0', '#ffffff')) if False else None
    c.fill(rm(46, 46, 14, 20), RED, 1); c.r(48, 49, 10, 6, '#3a5a98'); c.r(48, 49, 10, 2, '#80b0e8')
    c.fill(rm(44, 44, 18, 3), ('#14141c', '#2c2c38', '#585868'))
    c.fill(pm([(82, 66), (88, 74), (82, 74)]), GRAY)
    for x in (52, 64, 76):
        c.fill(em(x, 69, 4, 4), ('#14141c', '#585868', '#9badb7')); c.p(x, 69, '#e8e8f0')
    c.r(60, 65, 22, 2, '#14141c')
    # fumaca
    for (x, y, r) in ((80, 38, 3), (84, 31, 4), (88, 22, 4)):
        c.fill(em(x, y, r, r), ('#a8b0c0', '#e0e4ec', '#ffffff'))
    return c

def riobranco():
    c = C(6, 5)
    c.r(0, 60, 96, 19, '#8a6a40'); c.r(0, 60, 96, 1, '#b08a50')
    for x in range(3, 96, 9): c.r(x, 66 + (x % 5), 5, 1, '#a87a48')
    c.fill(em(5, 62, 14, 5, top=True), GRN); c.fill(em(91, 62, 14, 5, top=True), GRN)
    tree(c, 8, 60, 5); tree(c, 88, 60, 5)
    c.box(0, 54, 96, 3, STEEL)
    c.r(0, 57, 96, 1, STEEL[0])
    # arco
    for x in range(4, 93):
        t = (x - 48.0) / 44.0
        y = int(54 - 42 * (1 - t * t) ** 0.5)
        c.r(x, y, 1, 3, STEEL[1]); c.p(x, y, STEEL[2]); c.p(x, y + 2, STEEL[0])
        if x % 5 == 0:
            for j in range(y + 3, 54): c.p(x, j, STEEL[1])
    for x in range(0, 96, 2): c.p(x, 52, STEEL[2]) if x % 4 == 0 else None
    c.r(0, 51, 96, 1, STEEL[0])
    c.box(2, 50, 5, 8, STEEL); c.box(89, 50, 5, 8, STEEL)
    return c

# ------------------------------------------------------------------ CENTRO-OESTE
def cuiaba():
    c = C(5, 5)
    c.r(0, 70, 80, 9, '#9a9aa8'); c.r(0, 70, 80, 1, '#c8c8d4')
    W2 = ('#c88890', '#f4c8c8', '#fff0e8')
    c.box(26, 30, 28, 40, W2)
    c.fill(pm([(24, 31), (56, 31), (40, 14)]), W2)
    c.fill(pm([(30, 31), (50, 31), (40, 20)]), WHITE)
    c.fill(em(39.5, 29, 4, 4), ('#1c3c88', '#2c60c0', '#80b0e8'))
    for t in (14, 56):
        c.box(t, 28, 12, 42, W2)
        c.fill(pm([(t - 1, 29), (t + 12, 29), (t + 6, 2)]), ('#3a4a60', '#5a6a88', '#8aa0c0'))
        for y in (8, 14, 20): c.r(t + 5, y, 2, 1, STONE[2])
        c.r(t + 4, 34, 4, 10, '#3a5a98'); c.r(t + 5, 33, 2, 1, '#80b0e8'); c.fill(pm([(t + 4, 35), (t + 8, 35), (t + 6, 31)]), ('#3a5a98', '#3a5a98', '#80b0e8'))
        c.r(t + 4, 50, 4, 10, '#3a5a98'); c.r(t, 46, 12, 1, W2[0])
    c.fill(rm(34, 52, 12, 18), STONE); c.fill(rm(36, 54, 8, 16), '#3a2820'); c.fill(pm([(36, 55), (44, 55), (40, 48)]), ('#3a2820', '#3a2820', '#3a2820'))
    c.fill(pm([(33, 53), (47, 53), (40, 45)]), STONE) if False else None
    c.box(30, 70, 20, 2, STONE)
    c.r(39, 4, 1, 4, '#e8e8e8') if False else None
    return c

def campogrande():
    c = C(6, 5)
    grass(c, 0, 66, 96, 13)
    c.r(24, 66, 48, 13, SAND[1]); c.r(24, 66, 48, 1, SAND[2])
    OC = ('#c89048', '#f0c878', '#fff0b8')
    c.box(6, 30, 84, 38, OC)
    c.box(4, 28, 88, 3, STONE)
    c.fill(rm(6, 24, 84, 5), STONE)
    for x in range(6, 90, 4): c.r(x, 23, 2, 6, STONE[1]); c.r(x, 22, 2, 1, STONE[2])
    c.r(4, 46, 88, 2, STONE[1])
    c.fill(rm(34, 12, 28, 12), OC); c.fill(pm([(32, 13), (64, 13), (48, 3)]), STONE)
    c.fill(pm([(38, 13), (58, 13), (48, 6)]), OC)
    c.fill(em(47.5, 18, 4, 4), ('#3a5a98', '#3a5a98', '#80b0e8'))
    for x in (12, 24, 62, 74):
        c.r(x, 33, 8, 11, '#3a5a98'); c.r(x, 33, 8, 2, '#80b0e8'); c.rect_o(x - 1, 32, 10, 13, STONE[1])
        c.r(x - 3, 33, 2, 11, DGRN[1]); c.r(x + 9, 33, 2, 11, DGRN[1])
        c.r(x, 50, 8, 17, '#3a5a98'); c.fill(em(x + 3.5, 50, 4, 3, top=True), ('#3a5a98', '#3a5a98', '#80b0e8')); c.rect_o(x - 1, 48, 10, 20, STONE[1])
    c.fill(rm(38, 46, 20, 22), STONE)
    c.fill(rm(40, 50, 16, 18), '#3a2820'); c.fill(em(47.5, 50, 8, 5, top=True), ('#3a2820', '#3a2820', '#3a2820'))
    c.box(36, 66, 24, 2, STONE)
    palm(c, 4, 70, 26);
    return c

def goiania():
    c = C(5, 5)
    c.r(0, 70, 80, 9, '#c8c0a0'); c.r(0, 70, 80, 1, '#e8e0c0')
    c.box(14, 64, 52, 6, STONE); c.box(20, 58, 40, 6, STONE); c.box(26, 52, 28, 6, STONE)
    figs = ((18 + 14, 26, ('#7a3a28', '#b86840', '#e09868'), 38), (40, 8, ('#6a4a30', '#a0784c', '#d8a878'), 36), (62 - 14, 26, ('#2a1c18', '#4a3028', '#7a5a48'), 38))
    for (cx, top, ramp, w) in figs:
        pass
    for (cx, top, ramp) in ((29, 22, ('#7a3a28', '#b86840', '#e09868')), (51, 22, ('#2a1c18', '#4a3028', '#7a5a48')), (40, 8, ('#c8b898', '#f0e0c0', '#fffaf0'))):
        c.fill(rm(cx - 4, top + 8, 9, 52 - top - 8), ramp, 1)
        c.fill(em(cx, top + 4, 4, 4), ramp, 1)
        c.r(cx - 6, top + 12, 3, 3, ramp[1]); c.r(cx + 4, top + 12, 3, 3, ramp[1])
        c.r(cx - 1, top + 16, 3, 28, ramp[0])
    c.fill(rm(29, 36, 22, 3), ('#c8b898', '#f0e0c0', '#fffaf0')) if False else None
    c.fill(rm(26, 50, 28, 2), STONE)
    return c

def palmas():
    c = C(5, 5)
    c.fill(em(40, 66, 38, 10), ('#c8c0a0', '#e8e0c0', '#f8f4e0'))
    c.fill(em(40, 66, 32, 8), ('#a8a090', '#c8c0a0', '#e8e0c0'))
    for k in range(16):
        a = k * math.pi / 8
        x = 40 + 28 * math.cos(a); y = 66 + 6 * math.sin(a)
        c.line(40, 66, round(x), round(y), '#b0a888')
    # colunas
    for k in range(16):
        a = k * math.pi / 8
        x = int(40 + 28 * math.cos(a)); y = int(66 + 6 * math.sin(a))
        if math.sin(a) > 0:
            c.fill(rm(x - 1, y - 8, 3, 8), ('#4a4850', '#7a7880', '#b0aeb8'))
    # girassol
    c.fill(rm(39, 28, 3, 38), DGRN, 1)
    c.fill(pm([(41, 50), (50, 44), (49, 48), (41, 54)]), GRN); c.fill(pm([(39, 54), (30, 48), (31, 52), (39, 58)]), GRN)
    cx, cy = 40, 20
    for k in range(16):
        a = k * math.pi / 8
        px = cx + 14 * math.cos(a); py = cy + 14 * math.sin(a)
        c.fill(em(round(px), round(py), 3, 3), ('#d89818', '#f8c818', '#fff080'))
    for k in range(16):
        a = k * math.pi / 8 + math.pi / 16
        px = cx + 11 * math.cos(a); py = cy + 11 * math.sin(a)
        c.fill(em(round(px), round(py), 3, 3), ('#e8a818', '#f8d848', '#fff8a0'))
    c.fill(em(cx, cy, 8, 8), ('#3c2010', '#6a4020', '#9a6a38'), 2)
    for (x, y) in em(cx, cy, 8, 8):
        if (x + y) % 3 == 0 and (x - cx) ** 2 + (y - cy) ** 2 < 49: c.p(x, y, '#3c2010')
    return c

def brasilia():
    c = C(6, 6)
    cx = 47.5
    water(c, 0, 84, 96, 11)
    c.r(0, 80, 96, 5, STONE[1]); c.r(0, 80, 96, 1, STONE[2])
    c.fill(em(cx, 80, 44, 8, top=True), STONE, 1) if False else None
    # hiperboloide
    def half(y):
        t = (y - 46) / 36.0
        return 1.22 * (11 + 22 * t * t if y > 46 else 11 + 7 * ((46 - y) / 30.0) ** 2)
    body = set()
    for y in range(14, 82):
        h = half(y)
        for x in range(int(cx - h), int(cx + h) + 1): body.add((x, y))
    c.fill(body, GLASS, 1)
    for (x, y) in body:
        if y % 5 == 0: c.p(x, y, GLASS[2])
    # costelas
    for k in range(-8, 9):
        pass
    for k in range(0, 16):
        a = (k + .5) * math.pi / 8  # 0..2pi, visivel apenas a face frontal
        s = math.cos(a)  # -1..1
        for y in range(12, 82):
            h = half(y)
            x = int(round(cx + h * s * 1.0))
            col = WHITE[2] if s < 0 else (WHITE[1] if s < .8 else WHITE[0])
            c.p(x, y, col); c.p(x + 1, y, WHITE[0] if s > -.4 else WHITE[1]) if abs(s) < .95 else None
    # coroa
    c.r(int(cx - 18), 12, 38, 2, WHITE[1]); c.r(int(cx - 18), 12, 38, 1, WHITE[2])
    c.fill(em(cx, 12, 15, 4, top=True), WHITE) if False else None
    for k in range(-3, 4):
        c.line(int(cx + k * 5), 14, int(cx + k * 6), 6, WHITE[1], 2)
    c.r(int(cx - 12), 12, 26, 1, WHITE[0])
    c.fill(em(cx, 6, 3, 3), GOLD)
    # base
    c.box(int(cx - 31), 76, 62, 6, WHITE)
    c.fill(rm(int(cx - 6), 70, 12, 10), '#14202c'); c.fill(em(cx, 70, 6, 4, top=True), ('#14202c', '#14202c', '#14202c'))
    # campanario
    c.fill(rm(6, 50, 4, 32), WHITE, 1); c.fill(rm(14, 50, 4, 32), WHITE, 1); c.fill(rm(22, 50, 4, 32), WHITE, 1) if False else None
    c.r(5, 46, 14, 4, WHITE[1]); c.r(5, 46, 14, 1, WHITE[2]); c.r(10, 52, 4, 5, GOLD[1])
    return c

LANDMARKS = [
    ('curitiba', 5, 5, 'Jardim Botânico', curitiba),
    ('florianopolis', 6, 5, 'Ponte Hercílio Luz', florianopolis),
    ('portoalegre', 5, 5, 'Usina do Gasômetro', portoalegre),
    ('saopaulo', 6, 5, 'MASP', saopaulo),
    ('riodejaneiro', 5, 5, 'Cristo Redentor', riodejaneiro),
    ('vitoria', 5, 5, 'Convento da Penha', vitoria),
    ('belohorizonte', 5, 5, 'Igreja da Pampulha', belohorizonte),
    ('salvador', 5, 5, 'Elevador Lacerda', salvador),
    ('aracaju', 6, 5, 'Arcos da Orla de Atalaia', aracaju),
    ('maceio', 5, 5, 'Jangadas de Maceió', maceio),
    ('recife', 5, 5, 'Marco Zero e Torre de Cristal', recife),
    ('joaopessoa', 5, 5, 'Farol do Cabo Branco', joaopessoa),
    ('natal', 5, 5, 'Forte dos Reis Magos', natal),
    ('fortaleza', 6, 5, 'Ponte dos Ingleses', fortaleza),
    ('teresina', 6, 5, 'Ponte Estaiada', teresina),
    ('saoluis', 5, 5, 'Casarões de Azulejos', saoluis),
    ('belem', 6, 5, 'Ver-o-Peso', belem),
    ('macapa', 5, 5, 'Marco Zero do Equador', macapa),
    ('boavista', 5, 5, 'Monumento ao Garimpeiro', boavista),
    ('manaus', 5, 5, 'Teatro Amazonas', manaus),
    ('portovelho', 6, 5, 'Três Caixas d\'Água', portovelho),
    ('riobranco', 6, 5, 'Passarela Joaquim Macêdo', riobranco),
    ('cuiaba', 5, 5, 'Igreja do Bom Despacho', cuiaba),
    ('campogrande', 6, 5, 'Morada dos Baís', campogrande),
    ('goiania', 5, 5, 'Monumento às Três Raças', goiania),
    ('palmas', 5, 5, 'Praça dos Girassóis', palmas),
    ('brasilia', 6, 6, 'Catedral Metropolitana', brasilia),
]
