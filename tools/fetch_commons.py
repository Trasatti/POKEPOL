"""Baixa retratos da Wikimedia Commons (fallback) e grava metadados de licenca em tools/commons_meta.json"""
import urllib.request,urllib.parse,json,os,re
H={'User-Agent':'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
F={'pezao':'Pezão (cropped).jpg','witzel':'Wilson Witzel 01 (cropped).jpg','carluxo':'Carlos Nantes Bolsonaro.jpg',
'cabralzao':'Sérgio Cabral Senador.jpg','minutorres':'Anderson Torres.jpg',
'generalzao':'Foto Oficial do Sr Ministro da Defesa Walter Braga Netto.jpg',
'valdemensal':'Foto da Convenção do PL (cropped2).jpg','bunkerddel':'Geddel Vieira.jpg',
'granadeiro':'2022 ROBERTO JEFFERSON CANDIDATO PRESIDENTE TSE (280001655452).jpg',
'dino':'Ministro do STF, Flávio Dino (cropped).jpg',
'ceperjao':'Cláudio Castro, governador do Rio de Janeiro.jpg','vazacellar':'Rodrigo Bacellar na posse de Castro (cropped).jpg',
'respiralima':'Wilson Lima, January 2023 (cropped).jpg','blitzvinei':'Silvinei Vasques (cropped).png',
'emprestinho':'Jair Renan Bolsonaro em 2024 - TSE.jpg','cidelator':'Mauro Cid, 2023.jpg',
'pedalita':'Dilma Rousseff - foto oficial 2011-01-09 2 (cropped).jpg'}
here=os.path.dirname(os.path.abspath(__file__)); out=os.path.join(here,'fotos'); os.makedirs(out,exist_ok=True)
meta={}
for k,t in F.items():
    q=urllib.parse.urlencode(dict(action='query',titles='File:'+t,prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=600,format='json'))
    r=json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+q,headers=H),timeout=40))
    ii=list(r['query']['pages'].values())[0]['imageinfo'][0]; em=ii['extmetadata']
    g=lambda n:re.sub('<[^>]+>','',em.get(n,{}).get('value',''))
    meta[k]=dict(title=t,page=ii['descriptionurl'],license=g('LicenseShortName'),author=g('Artist'),url=ii['thumburl'])
    open(os.path.join(out,k+'.jpg'),'wb').write(urllib.request.urlopen(urllib.request.Request(ii['thumburl'],headers=H),timeout=60).read())
    print(k,meta[k]['license'],'|',meta[k]['author'][:60])
json.dump(meta,open(os.path.join(here,'commons_meta.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
