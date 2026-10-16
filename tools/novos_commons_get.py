"""Baixa as fotos escolhidas da Commons (titulo claramente identifica a pessoa). Grava tools/work/commons_meta.json e tools/fotos/{id}.jpg"""
import json, os, re, urllib.request, urllib.parse, io
from PIL import Image
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
HERE = os.path.dirname(os.path.abspath(__file__)); FOTOS = os.path.join(HERE, 'fotos')
PICK = {
 'pimentacronimo': 'O governador de Minas Gerais, Fernando Pimentel (cropped).jpg',
 'rosinhadagua': 'Rosinha Garotinho.jpg',
 'thjoiascv': 'TH Joias em 2022.jpg',
 'marcalaudo': 'Pablo Marçal (cropped).png',
 'gabinetino': '2020-07-16 Solenidade de Posse do senhor Milton Ribeiro, Ministro de Estado da Educação (videoconferência) 03 (cropped).jpg',
 'canellafuzil': '2024 MÁRCIO CANELLA CANDIDATO PREFEITO RJ BELFORD ROXO TSE (190002028900).jpg',
 'salvarotumulo': 'Clésio Salvaro 01 (cropped).jpg',
 'ruyveu': '2016 RUY MUNIZ CANDIDATO PREFEITO MG MONTES CLAROS TSE (130000050522).jpg',
 'wajnjoias': 'Fábio Wajngarten (cropped).jpg',
 'pastorgilpina': 'Pastor Gil.jpg',
 'petrolinando': '2020 MIGUEL COELHO CANDIDATO PREFEITO PE PETROLINA TSE (170000666523).jpg',
 'calvarinho': 'Ricardo Coutinho 2011.jpg',
 'binhogalinhadeira': 'FBA50001610379 div Binho Galinha.jpg',
 'yurydoparedao': 'Deputado Yuri do Paredão.jpg',
 'cestabasico': 'Antonio Denarium (cropped).jpg',
 'carlessado': 'Mauro Carlesse, governador do Tocantins.jpg',
 'lamapuccinelli': 'Foto oficial do deputado federal André Puccinelli.jpg',
 'ibaneisolado': 'Ibaneis Rocha, January 2023 (cropped).jpg',
 'reidogado': 'Marcelo Miranda Gov TO no Senado.png',
 'helderbellum': 'Helder Barbalho, January 2023 (cropped).jpg',
 'wanderfome': 'Wanderlei Barbosa, Governador em exercício do Tocantins (cropped).jpg',
 'maurodoi': 'Mauro Mendes em 5 de junho de 2019.jpg',
 'helenoalerta': 'Augusto Heleno (cropped).jpg',
 'boizebuamorim': 'Rodrigo Amorim - Deputado ALERJ (cropped).jpg',
 'englerfake': 'Bruno Engler.png',
 'sheilafake': 'Delegada Sheila.png',
 'mangacopiacola': 'Rodrigo manga 15.jpg',
 'copalivre': 'Jairo Jorge em outubro de 2018 (cropped).jpg',
 'assumcaotornozeleira': 'Deputado Capitão Assumção (cropped).jpg',
 'vilmarexoneramais': 'Vilmar Mariano.png',
 'furlanhospital': 'Dr. Furlan Candidato a Prefeito de Macapá 2024 - TSE.jpg',
 'siqueirapalmassisamnes': '2024 EDUARDO SIQUEIRA CAMPOS CANDIDATO PREFEITO TO PALMAS TSE (270002318894).jpg',
 'garnierfragata': 'Almir Garnier 3x4.jpg',
 'nogueiraescudo': '14-04-2022 - Foto oficial do Sr Ministro da Defesa Paulo Sérgio Nogueira de Oliveira (52005140979).jpg',
 'martinstwitter': 'Filipe Garcia Martins em maio de 2019.png',
 'cuiabamensalinho': 'Emanuel Pinheiro, prefeito eleito de Cuiabá 2016.png',
 'neysantosxibalba': '2020 NEY SANTOS CANDIDATO PREFEITO SP EMBU DAS ARTES TSE (250001009058).jpg',
 'pioneiroflagrante': 'Manoel Carlos Antunes 2022 140001650188.jpg',
 'juliocatraz': 'JulioGarcia.jpg',
 'fundebao': '2020 FABIO GENTIL CANDIDATO PREFEITO MA CAXIAS TSE (100001040533).jpg',
 'estafetalima': '2024 MARCELO LIMA CANDIDATO PREFEITO SP SAO BERNARDO DO CAMPO TSE (250002152251).jpg',
 'arrudabigode': 'Ricardo Arruda - foto Orlando Kissner - 190319 (36) (47443463211).jpg',
}
def api(**kw):
    kw['format'] = 'json'
    return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(kw), headers=H), timeout=60))
meta = {}
for k, t in PICK.items():
    try:
        r = api(action='query', titles='File:' + t, prop='imageinfo|categories', iiprop='url|extmetadata|size', iiurlwidth=1000, cllimit=40)
        pg = list(r['query']['pages'].values())[0]
        if 'imageinfo' not in pg: print('MISSING', k, t); continue
        ii = pg['imageinfo'][0]; em = ii['extmetadata']
        g = lambda n: re.sub('<[^>]+>', '', em.get(n, {}).get('value', ''))
        raw = urllib.request.urlopen(urllib.request.Request(ii.get('thumburl') or ii['url'], headers=H), timeout=90).read()
        im = Image.open(io.BytesIO(raw)); im.load(); im.convert('RGB').save(os.path.join(FOTOS, k + '.jpg'), quality=95)
        meta[k] = dict(title=t, page=ii['descriptionurl'], license=g('LicenseShortName'), author=g('Artist')[:80], desc=g('ImageDescription')[:200], cats=[c['title'][9:] for c in pg.get('categories', [])][:8], size=im.size)
        print('ok', k, im.size, meta[k]['license'], '|', meta[k]['author'][:40])
    except Exception as e: print('FAIL', k, t, e)
json.dump(meta, open(os.path.join(HERE, 'work', 'commons_meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
