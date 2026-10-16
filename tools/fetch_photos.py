"""Baixa retratos oficiais (Camara/Senado) para tools/fotos/{id}.jpg. Uso: python tools/fetch_photos.py"""
import urllib.request, os
H={'User-Agent':'Mozilla/5.0 pokepol-sprites (educational satire)'}
CAM={'palocciu':74701,'garotinho':160539,'janonudo':204515,'silveirao':204454,'azeredinho':160647,'malaloures':141532,
'codevasfo':178886,'boiadeiro':220633,'zambellina':204507,'machadao':73755,'mensaleiro':74782,
'tarifardo':92346,'abinzinho':220619,'cunhamon':74173,'lirassauro':160541,'temerario':73552,'gravecio':74646,
'malufante':132056,'golpenaro':74847,
'sacostenes':178947,'jordyaluga':204460,'discalculayer':220568,'friasdark':220655,'maranhaozito':204563}
SEN={'delcidiao':3360,'rachadinho':5894,'renanzilla':70,'jucazord':73,'dovalento':5942,'ciromaster':739,'confiscollor':4525}
here=os.path.dirname(os.path.abspath(__file__)); out=os.path.join(here,'fotos'); os.makedirs(out,exist_ok=True)
src=[]
for k,v in CAM.items(): src.append((k,f'https://www.camara.leg.br/internet/deputado/bandep/{v}.jpg'))
for k,v in SEN.items(): src.append((k,f'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador{v}.jpg'))
for k,u in src:
    try:
        d=urllib.request.urlopen(urllib.request.Request(u,headers=H),timeout=40).read()
        open(os.path.join(out,k+'.jpg'),'wb').write(d); print('ok',k,len(d),u)
    except Exception as e: print('FAIL',k,u,e)
