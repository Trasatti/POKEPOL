import json, re, sys, urllib.request, urllib.parse
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
def api(**kw):
    kw['format'] = 'json'
    return json.load(urllib.request.urlopen(urllib.request.Request('https://pt.wikipedia.org/w/api.php?' + urllib.parse.urlencode(kw), headers=H), timeout=60))
for q in sys.argv[1:]:
    r = api(action='query', generator='search', gsrsearch=q, gsrlimit=3, prop='pageimages|extracts', piprop='original|name', exintro=1, explaintext=1, exchars=160)
    print('##', q)
    for p in sorted(r.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 9)):
        print('   ', p['title'], '|', p.get('pageimage'), '|', (p.get('extract') or '').replace('\n', ' ')[:150])
