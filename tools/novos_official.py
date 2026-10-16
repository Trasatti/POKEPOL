"""Baixa fotos oficiais (Camara/Senado) para os politicos novos com registro verificado. Grava tools/work/official.json"""
import json, os, urllib.request
H = {'User-Agent': 'pokepol-sprites/1.0 (educational satire)', 'Accept': 'application/json'}
HERE = os.path.dirname(os.path.abspath(__file__)); FOTOS = os.path.join(HERE, 'fotos')
CAM = {'betopedagio': 220683, 'deltanpoint': 220705, 'francisfake': 160646, 'onyxcaixa': 74399, 'laranjalvaro': 179000, 'reisfuzil': 160620,
       'yedetran': 73992, 'angorafranco': 74863, 'meurelava': 73781, 'raquelveu': 178998, 'boscopropina': 74052, 'coelhinhodapascoa': 141431,
       'felixterno': 160666, 'dalbarril': 220692, 'underhandinho': 204550, 'adutorao': 74044, 'sepsisalves': 74324, 'robinsonfantasma': 220624,
       'gentilgate': 220707, 'dudufontana': 141421, 'mouradopirambu': 160543, 'azamboiada': 160615, 'oigarcia': 178905, 'fragalhado': 73579,
       'baldeado': 178875, 'draculeao': 204380, 'quadrocrivela': 220599, 'geleria': 146307, 'nikolasfaker': 209787, 'arrudabigode': 172945,
       'heroiepettersen': 204482, 'gilvanquinto': 220526, 'velloso2026graco': 220589, 'goreteindebito': 129618, 'antoniodoidoigapo': 220675,
       'cezinhatransparencia': 204504, 'queirozcastratio': 160161, 'estafetalima': 220634}
SEN = {'bezerrodeouro': 5540, 'ptolomeudo': 4558, 'cassolicitado': 5004, 'selmadois': 5929, 'perildeliver': 4535, 'pandoruda': 46, 'sojamaggi': 111}
def get(u):
    h = dict(H) if 'api' in u or 'dadosabertos' in u else {'User-Agent': H['User-Agent']}
    return urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=60).read()
res = {}
for k, i in CAM.items():
    try:
        d = json.loads(get(f'https://dadosabertos.camara.leg.br/api/v2/deputados/{i}'))['dados']; u = d['ultimoStatus']
        img = get(f'https://www.camara.leg.br/internet/deputado/bandep/{i}.jpg')
        open(os.path.join(FOTOS, k + '.jpg'), 'wb').write(img)
        res[k] = dict(src='cam', id=i, civil=d['nomeCivil'], nasc=d.get('dataNascimento'), party=u['siglaPartido'], uf=u['siglaUf'], leg=u['idLegislatura'], nm=u['nome'],
                      url=f'https://www.camara.leg.br/internet/deputado/bandep/{i}.jpg', bytes=len(img))
    except Exception as e: print('FAIL', k, e)
for k, i in SEN.items():
    try:
        d = json.loads(get(f'https://legis.senado.leg.br/dadosabertos/senador/{i}'))['DetalheParlamentar']['Parlamentar']; ip = d['IdentificacaoParlamentar']
        img = get(f'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador{i}.jpg')
        open(os.path.join(FOTOS, k + '.jpg'), 'wb').write(img)
        res[k] = dict(src='sen', id=i, civil=ip['NomeCompletoParlamentar'], nasc=d.get('DadosBasicosParlamentar', {}).get('DataNascimento'), party=ip.get('SiglaPartidoParlamentar'), uf=ip.get('UfParlamentar'),
                      url=f'https://www.senado.leg.br/senadores/img/fotos-oficiais/senador{i}.jpg', bytes=len(img))
    except Exception as e: print('FAIL', k, e)
json.dump(res, open(os.path.join(HERE, 'work', 'official.json'), 'w'), ensure_ascii=False, indent=1)
for k, v in res.items(): print(k, v['civil'], v['party'], v['uf'], v['nasc'], v['bytes'])
