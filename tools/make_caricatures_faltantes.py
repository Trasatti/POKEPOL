"""POKEPOL - sprites dos politicos que faltavam (fotos verificadas em tools/fotos). Uso: python tools/make_caricatures_faltantes.py id ..."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import make_caricatures_novos as mn
mn.data.append(dict(id='vorcaro', pokemon='Meowth', caricature='Banqueiro com mala de dinheiro vivo', short='Banco Master', photoHint=''))
mn.data.append(dict(id='cidelator', pokemon='Zubat', caricature='Ajudante de ordens com papel de delacao premiada', short='Delator', photoHint=''))
OVR = {'cidelator': (90, 160, 450, 540), 'cassolicitado': (145, 70, 190, 230), 'garnierfragata': (139, 46, 213, 277), 'wajnjoias': (130, 170, 480, 540)}  # caixa do rosto na foto original (x,y,w,h)
CUR = [None]; _det = mn.mc.detect_face; _prep = mn.prep
mn.mc.detect_face = lambda im: OVR[CUR[0]] if CUR[0] in OVR else _det(im)
from PIL import Image
def prep2(pid):
    if pid in OVR: Image.open(os.path.join(HERE, 'fotos', pid + '.jpg')).convert('RGB').save(os.path.join(mn.WORK, pid + '.jpg'), quality=95)
    else: _prep(pid)
mn.prep = prep2
mn.FACE.update({'cidelator': (90, 160, 450, 540), 'cassolicitado': (145, 70, 190, 230), 'garnierfragata': (139, 46, 213, 277), 'wajnjoias': (130, 170, 480, 540)})
for pid in sys.argv[1:]:
    CUR[0] = pid
    try: mn.run(pid); print('ok', pid)
    except Exception as e:
        import traceback; traceback.print_exc(); print('ERRO', pid, e)
