"""Lookup de parlamentares (Camara/Senado dados abertos) para os politicos novos. Saida: tools/work/lookup.json"""
import json, os, re, unicodedata, urllib.request, urllib.parse
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire)', 'Accept': 'application/json'}
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60))
def norm(s): return re.sub(r'[^a-z ]', '', unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower())
data = json.load(open(os.path.join(ROOT, 'docs', 'politicos-novos-final.json'), encoding='utf-8'))
cam = {}
for leg in range(51, 58):
    p = 1
    while True:
        r = get(f'https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura={leg}&itens=100&pagina={p}&ordem=ASC&ordenarPor=nome')
        for d in r['dados']: cam.setdefault(d['id'], dict(d, legs=[]))['legs'].append(leg)
        if not any(l['rel'] == 'next' for l in r['links']): break
        p += 1
print('camara', len(cam))
sen = {}
for leg in range(50, 58):
    try: r = get(f'https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/{leg}')
    except Exception as e: print('sen fail', leg, e); continue
    for x in r['ListaParlamentarLegislatura']['Parlamentares']['Parlamentar']:
        i = x['IdentificacaoParlamentar']; k = i['CodigoParlamentar']
        sen.setdefault(k, dict(id=k, nome=i['NomeParlamentar'], completo=i['NomeCompletoParlamentar'], partido=i.get('SiglaPartidoParlamentar'), uf=i.get('UfParlamentar'), foto=i.get('UrlFotoParlamentar'), legs=[]))['legs'].append(leg)
print('senado', len(sen))
out = {}
for p in data:
    nm = re.sub(r'\(.*?\)', '', p['real']).strip(); t = set(norm(nm).split())
    t2 = set(norm(p['real']).split())
    c = []
    for d in cam.values():
        nn = set(norm(d['nome']).split())
        if len(nn) >= 2 and (nn <= t or (t <= nn and len(t) >= 2)): c.append(('cam', d['id'], d['nome'], d['siglaPartido'], d['siglaUf'], d['legs']))
    for s in sen.values():
        nn = set(norm(s['nome']).split()); nc = set(norm(s['completo']).split())
        if (len(nn) >= 2 and nn <= t) or (len(t) >= 2 and t <= nc): c.append(('sen', s['id'], s['completo'], s['partido'], s['uf'], s['legs'], s['foto']))
    out[p['id']] = c
json.dump(out, open(os.path.join(HERE, 'work', 'lookup.json'), 'w'), ensure_ascii=False, indent=0)
for p in data:
    print(p['id'], '|', p['real'], p['uf'], p['party'], '=>', out[p['id']])
