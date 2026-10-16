"""Busca registros oficiais (Camara/Senado) dos ids usados em fetch_photos.py e grava tools/verified.json"""
import urllib.request, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
H={'User-Agent':'Mozilla/5.0 pokepol','Accept':'application/json'}
def get(u): return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=40))
src=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'fetch_photos.py'),encoding='utf-8').read()
ns={}; exec(src.split("here=")[0].replace("import urllib.request, os",""),ns)
out={}
CAM=dict(ns['CAM'],granadeiro=73420,valdemensal=73565,bunkerddel=74544)  # ids de registro (foto vem do Commons)
for k,v in CAM.items():
    d=get(f'https://dadosabertos.camara.leg.br/api/v2/deputados/{v}')['dados']; s=d['ultimoStatus']
    out[k]=dict(src='camara',id=v,civil=d.get('nomeCivil'),nome=s.get('nomeEleitoral') or s.get('nome'),partido=s.get('siglaPartido'),uf=s.get('siglaUf'),leg=s.get('idLegislatura'),nasc=d.get('dataNascimento'),foto=s.get('urlFoto'))
for k,v in ns['SEN'].items():
    d=get(f'https://legis.senado.leg.br/dadosabertos/senador/{v}')['DetalheParlamentar']['Parlamentar']; i=d['IdentificacaoParlamentar']
    out[k]=dict(src='senado',id=v,civil=i.get('NomeCompletoParlamentar'),nome=i.get('NomeParlamentar'),partido=i.get('SiglaPartidoParlamentar'),uf=i.get('UfParlamentar'),nasc=d.get('DadosBasicosParlamentar',{}).get('DataNascimento'))
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'verified.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
for k,v in out.items(): print(k,v)
