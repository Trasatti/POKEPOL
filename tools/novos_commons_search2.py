import json, re, sys, urllib.request, urllib.parse, unicodedata, time
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
def api(**kw):
    kw['format'] = 'json'
    return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(kw), headers=H), timeout=60))
n = lambda s: re.sub(r'[^a-z ]', '', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower())
for q in sys.argv[1:]:
    toks = [t for t in n(q).split() if len(t) > 2]
    r = api(action='query', list='search', srsearch=q, srnamespace=6, srlimit=30)
    print('##', q)
    for x in r['query']['search']:
        if all(t in n(x['title']) for t in toks[:2]): print('   ', x['title'])
