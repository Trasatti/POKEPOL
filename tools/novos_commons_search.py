"""Busca candidatos de foto na Wikimedia Commons para quem nao tem registro oficial. Saida: tools/work/commons_cands.json"""
import json, os, re, urllib.request, urllib.parse, unicodedata, time
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def api(**kw):
    kw['format'] = 'json'
    for _ in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(kw), headers=H), timeout=60))
        except Exception as e: time.sleep(2); err = e
    raise err
off = json.load(open(os.path.join(HERE, 'work', 'official.json')))
data = json.load(open(os.path.join(ROOT, 'docs', 'politicos-novos-final.json'), encoding='utf-8'))
SEARCH = {'thjoiascv': 'TH Joias', 'marcalaudo': 'Pablo Marçal', 'furlanhospital': 'Antonio Furlan', 'junimdopovoomerta': 'Junim do Povo',
          'brunapraianorte': 'Bruna Gabrielle', 'chiconazariocaapora': 'Chico Nazário'}
out = {}
for p in data:
    if p['id'] in off: continue
    q = SEARCH.get(p['id']) or re.sub(r'\(.*?\)', '', p['real']).strip()
    r = api(action='query', list='search', srsearch=f'"{q}"', srnamespace=6, srlimit=12)
    titles = [x['title'] for x in r['query']['search']]
    cands = []
    if titles:
        r2 = api(action='query', titles='|'.join(titles), prop='imageinfo|categories', iiprop='url|extmetadata|size', iiurlwidth=600, cllimit=30)
        for pg in r2['query']['pages'].values():
            ii = (pg.get('imageinfo') or [{}])[0]; em = ii.get('extmetadata', {})
            g = lambda n: re.sub('<[^>]+>', '', em.get(n, {}).get('value', ''))
            cands.append(dict(title=pg['title'], lic=g('LicenseShortName'), author=g('Artist')[:50], desc=g('ImageDescription')[:110], date=g('DateTimeOriginal')[:12],
                              w=ii.get('width'), h=ii.get('height'), thumb=ii.get('thumburl'), page=ii.get('descriptionurl'), cats=[c['title'][9:] for c in pg.get('categories', [])][:6]))
    out[p['id']] = dict(q=q, c=cands)
    print('##', p['id'], '|', q, '|', p['cargo'][:60])
    for c in cands: print('   ', c['title'], '|', c['lic'], '|', c['author'], '|', c['date'], '|', c['desc'][:80], '|', c['w'], 'x', c['h'])
json.dump(out, open(os.path.join(HERE, 'work', 'commons_cands.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
