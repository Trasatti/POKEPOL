import json, re, sys, urllib.request, urllib.parse, unicodedata
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire; emaildotrasatti@gmail.com)'}
def api(**kw):
    kw['format'] = 'json'
    return json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(kw), headers=H), timeout=60))
n = lambda s: re.sub(r'[^a-z ]', '', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower())
Q = [('CANDIDATO PREFEITO VITORINO FREIRE TSE', 'luanna'), ('CANDIDATO PREFEITO CABEDELO TSE', 'leto'), ('CANDIDATO PREFEITO PARATINGA TSE', 'marcel'),
     ('CANDIDATO PREFEITO BOQUIRA TSE', 'alan'), ('CANDIDATO PREFEITO PEDRO CANARIO TSE', 'kleilson'), ('CANDIDATO PREFEITO PEDRO CANARIO TSE', 'bruno'),
     ('CANDIDATO PREFEITO LAJEADO TSE', 'caumo'), ('CANDIDATO PREFEITO RIACHO DE SANTANA TSE', 'laranjeira'), ('CANDIDATO PREFEITO TRES MARIAS TSE', 'danilo'),
     ('CANDIDATO PREFEITO TURIACU TSE', 'edesio'), ('CANDIDATO PREFEITO CAAPORA TSE', 'nazario'), ('CANDIDATO PREFEITO EQUADOR RN TSE', 'cletson'),
     ('CANDIDATO PREFEITO PRAIA NORTE TSE', 'bruna'), ('CANDIDATO PREFEITO CORRENTINA TSE', 'sobral'), ('CANDIDATO VEREADOR SOBRAL CE TSE Mario Vicktor', 'vicktor'),
     ('CANDIDATO VEREADOR SOBRAL TSE JUNIM', 'junim'), ('NENO RAZUK CANDIDATO DEPUTADO ESTADUAL MS TSE', 'razuk'), ('GREG DUARTE CANDIDATO VEREADOR ANGRA DOS REIS TSE', 'greg'),
     ('MARCINHO BELOTA CANDIDATO DEPUTADO ESTADUAL RR TSE', 'belota'), ('NININHO CANDIDATO DEPUTADO ESTADUAL MT TSE', 'nininho'), ('AUDIC MOTA CANDIDATO DEPUTADO ESTADUAL CE TSE', 'audic'),
     ('JULIO GARCIA CANDIDATO DEPUTADO ESTADUAL SC TSE', 'garcia'), ('MARCUS VINICIUS AMIM CANDIDATO TSE', 'amim'), ('SILVAL BARBOSA CANDIDATO TSE', 'silval'), ('MARCELO CAUMO TSE', 'caumo'),
     ('CARLINHOS SOBRAL TSE', 'carlinhos'), ('Dr Furlan Macapa', 'furlan'), ('Mauro Moraes deputado estadual Paraná', 'moraes'), ('Cletson Rivaldo', 'cletson'), ('Leto Viana prefeito', 'leto')]
for q, t in Q:
    r = api(action='query', list='search', srsearch=q, srnamespace=6, srlimit=40)
    hits = [x['title'] for x in r['query']['search'] if t in n(x['title'])]
    print('##', q, '->', hits[:8])
