import urllib.request, json, sys, unicodedata
H={'User-Agent':'Mozilla/5.0 pokepol-sprites','Accept':'application/json'}
def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=40))
out={}
for leg in range(48,58):
    p=1
    while True:
        try: d=get(f'https://dadosabertos.camara.leg.br/api/v2/deputados?idLegislatura={leg}&itens=100&pagina={p}')
        except Exception as e: print(leg,p,e); break
        for x in d['dados']: out.setdefault(x['id'],x)['leg']=leg
        if len(d['dados'])<100: break
        p+=1
    print(leg,len(out),file=sys.stderr)
json.dump(list(out.values()),open(sys.argv[1],'w'))
