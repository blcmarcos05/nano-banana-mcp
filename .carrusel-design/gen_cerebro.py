# Mesas de Claude Design del carrusel "cerebro digital" (3:4, 1080x1440):
# fondos generados con guiones/cerebro-digital.mjs + todo el texto en Sora.
#
# Uso: python gen_cerebro.py <carpeta root>  -> escribe <root>/project/*
import json, datetime, os, sys

root = os.path.join(sys.argv[1], 'project') + os.sep
os.makedirs(root, exist_ok=True)
W, H = 1080, 1440

BG = {
    'portada': '/_blob/e9a17f57e321e90633f724f00d0c773a',
    'infra': '/_blob/d58b2792c1b2a7f416bdcaade5fd1e02',
    'arq': '/_blob/a46365650937aead972231aadf16b448',
    'cierre': '/_blob/6cc63bdace2ec279f37268c9386b0da1',
}
LOGO_CREMA = '/_blob/fd834bdc5270a80e12d74d864d8c4aeb'
LOGO_VERDE = '/_blob/5884465ffb547081a3a53e3b0922ee6a'

CARBON, VERDE, GRIS, CREMA, AMBAR = '#0D0D0D', '#183C35', '#71877E', '#F5F4EF', '#E59A3A'

# Logos de apps (Simple Icons, un color, el oficial de cada marca).
APPS = {
    'whatsapp': ('#25D366', 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'),
    'gmail': ('#EA4335', 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z'),
    'calendar': ('#4285F4', 'M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z'),
}


def app(k, cx, cy, size=112):
    color, d = APPS[k]
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" role="img" aria-label="{k}" '
            f'style="position: absolute; left: {cx - size // 2}px; top: {cy - size // 2}px">'
            f'<path fill="{color}" d="{d}"></path></svg>\n')


HEAD = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0;font-family:Sora,sans-serif}}
</style>
</helmet>
<div style="position: relative; width: 1080px; height: 1440px; overflow: hidden; background: {bg}; font-family: Sora, sans-serif; color: {fg}">
<img src="{img}" alt="{alt}" style="position: absolute; left: 0px; top: 0px; width: 1080px; height: 1440px">
'''
TAIL = '''</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1080,"height":1440}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
'''
# Sombra para que el texto claro se lea sobre las cintas de luz.
SOMBRA = 'text-shadow: 0px 4px 28px rgba(13, 13, 13, 0.85), 0px 0px 60px rgba(13, 13, 13, 0.6)'
POINTER = ('<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F5F4EF" stroke-width="1.8" stroke-linecap="round" '
           'stroke-linejoin="round" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>'
           '<path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/>'
           '<path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>')
TREND = ('<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E59A3A" stroke-width="2.2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>')

boards = []

# 01 · Portada
h = HEAD.format(title='01 · Portada', bg=CARBON, fg=CREMA, img=BG['portada'], alt='Cintas de luz ámbar sobre fondo oscuro')
h += f'<img src="{LOGO_CREMA}" alt="Repano" style="position: absolute; left: 72px; top: 72px; width: 150px; height: 60px">\n'
# Velo oscuro detrás del titular: calma las cintas donde va el texto.
h += '<div style="position: absolute; left: 0px; top: 470px; width: 1080px; height: 520px; background: radial-gradient(ellipse at 45% 50%, rgba(13, 13, 13, 0.72) 0%, rgba(13, 13, 13, 0.4) 45%, rgba(13, 13, 13, 0) 72%)"></div>\n'
h += f'<div style="position: absolute; left: 64px; top: 540px; width: 952px; display: flex; flex-direction: column; gap: 0px; font-weight: 800; letter-spacing: -0.04em; {SOMBRA}">\n'
h += ('<div style="display: flex; align-items: flex-end; gap: 22px"><span style="font-size: 132px; line-height: 1">No somos</span>'
      '<span style="font-size: 44px; line-height: 1.05; font-weight: 400; letter-spacing: -0.01em; padding-bottom: 12px">otra empresa</span></div>\n')
h += ('<div style="display: flex; align-items: flex-end; gap: 22px"><span style="font-size: 44px; line-height: 1.05; font-weight: 400; letter-spacing: -0.01em; padding-bottom: 14px">que vende</span>'
      '<span style="font-size: 132px; line-height: 1.02; color: #E59A3A">“inteligencia</span></div>\n')
h += '<div style="display: flex; justify-content: flex-end; padding-right: 40px"><span style="font-size: 132px; line-height: 1.02; color: #E59A3A">artificial”</span></div>\n'
h += '</div>\n'
h += ('<div style="position: absolute; left: 64px; top: 1236px; display: flex; align-items: center; padding: 22px 40px; border-radius: 60px; '
      'background: rgba(245, 244, 239, 0.12); border: 1.5px solid rgba(245, 244, 239, 0.35); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px)">'
      '<span style="font-size: 36px; line-height: 1.2; font-weight: 400; color: #F5F4EF">Creamos el <b style="font-weight: 700; color: #E59A3A">cerebro digital</b><br>de tu empresa</span></div>\n')
h += f'<div style="position: absolute; right: 64px; top: 1270px; display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 700">Desliza {POINTER}</div>\n'
h += TAIL
open(root + 'Main.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('Main.dc.html', '01 · Portada'))

# 02 · Infraestructura
h = HEAD.format(title='02 · La infraestructura que conecta', bg=CARBON, fg=CREMA, img=BG['infra'], alt='Mano en un mouse bajo tres fichas de apps')
h += ('<h1 style="position: absolute; left: 0px; top: 88px; width: 1080px; margin: 0px; text-align: center; font-size: 80px; line-height: 1.08; font-weight: 400; letter-spacing: -0.03em">'
      'La <b style="font-weight: 800; color: #E59A3A">infraestructura</b><br>que conecta:</h1>\n')
h += app('whatsapp', 258, 720) + app('gmail', 540, 637) + app('calendar', 822, 718)
ETQ = 'position: absolute; font-size: 36px; font-weight: 300; font-style: italic; color: #F5F4EF; opacity: 0.9'
h += f'<span style="{ETQ}; left: 120px; top: 452px">datos</span>\n'
h += f'<span style="{ETQ}; left: 760px; top: 440px">sistemas</span>\n'
h += f'<span style="{ETQ}; left: 438px; top: 800px">operaciones</span>\n'
h += f'<span style="{ETQ}; left: 96px; top: 930px">procesos</span>\n'
h += ('<p style="position: absolute; left: 0px; top: 1320px; width: 1080px; margin: 0px; text-align: center; font-size: 42px; font-weight: 400; letter-spacing: -0.01em">'
      f'En <b style="font-weight: 800; color: #E59A3A">una sola plataforma</b> de control total.</p>\n')
h += TAIL
open(root + 'S02-Infraestructura.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('S02-Infraestructura.dc.html', '02 · La infraestructura que conecta'))

# 03 · Arquitectura
CARD = ('position: absolute; display: flex; flex-direction: column; gap: 8px; padding: 26px 30px; border-radius: 24px; '
        'background: rgba(13, 13, 13, 0.58); border: 1.5px solid rgba(229, 154, 58, 0.45); '
        'box-shadow: 0px 0px 40px rgba(229, 154, 58, 0.18); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)')
LBL = 'font-size: 24px; font-weight: 400; color: #71877E'
h = HEAD.format(title='03 · Una arquitectura a la medida', bg=CARBON, fg=CREMA, img=BG['arq'], alt='Cerebro de vidrio ámbar bajo un haz de luz')
h += ('<h1 style="position: absolute; left: 72px; top: 90px; width: 900px; margin: 0px; font-size: 76px; line-height: 1.08; font-weight: 400; letter-spacing: -0.03em">'
      '<b style="font-weight: 800">No es</b> un software<br>que compras.</h1>\n')
h += (f'<div style="{CARD}; left: 60px; top: 330px; width: 330px"><span style="{LBL}">Procesos automatizados</span>'
      '<span style="font-size: 62px; font-weight: 700; letter-spacing: -0.02em">1,204</span>'
      f'<span style="display: flex; align-items: center; gap: 8px; font-size: 22px; color: #E59A3A">{TREND} En operación</span></div>\n')
h += (f'<div style="{CARD}; left: 668px; top: 290px; width: 330px"><span style="{LBL}">Precisión de flujo</span>'
      '<span style="font-size: 62px; font-weight: 700; letter-spacing: -0.02em; color: #E59A3A">98.6%</span></div>\n')
h += (f'<div style="{CARD}; left: 700px; top: 610px; width: 300px"><span style="{LBL}">Flujo de automatización</span>'
      '<span style="display: flex; align-items: center; gap: 12px; font-size: 44px; font-weight: 700">'
      '<span style="width: 16px; height: 16px; border-radius: 8px; background: #E59A3A; box-shadow: 0px 0px 14px #E59A3A"></span>Activo</span></div>\n')
h += ('<p style="position: absolute; left: 60px; top: 1030px; width: 960px; margin: 0px; text-align: center; font-size: 64px; line-height: 1.12; font-weight: 400; letter-spacing: -0.03em">'
      'Es <b style="font-weight: 800; color: #E59A3A">una arquitectura</b><br>que se diseña <b style="font-weight: 800; color: #E59A3A">a la</b><br>'
      '<b style="font-weight: 800; color: #E59A3A">medida</b> de cómo tu<br>empresa realmente<br>opera.</p>\n')
h += TAIL
open(root + 'S03-Arquitectura.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('S03-Arquitectura.dc.html', '03 · Una arquitectura a la medida'))

# 04 · Cierre
PILL = ('position: absolute; left: 110px; width: 860px; height: 200px; border-radius: 100px; display: flex; align-items: center; justify-content: center; '
        'text-align: center; font-size: 56px; line-height: 1.12; font-weight: 600; letter-spacing: -0.02em; transform: rotate(-5deg); '
        'box-shadow: 0px 24px 50px rgba(24, 60, 53, 0.28)')
h = HEAD.format(title='04 · Comenta DEMO', bg=CREMA, fg=VERDE, img=BG['cierre'], alt='Fondo crema con cintas de líneas finas')
h += f'<img src="{LOGO_VERDE}" alt="Repano" style="position: absolute; left: 72px; top: 72px; width: 150px; height: 60px">\n'
h += f'<div style="{PILL}; top: 300px; background: #183C35; color: #F5F4EF">Visibilidad en<br>tiempo real</div>\n'
h += f'<div style="{PILL}; top: 520px; background: #0D0D0D; color: #F5F4EF">Decisiones basadas<br>en datos</div>\n'
h += f'<div style="{PILL}; top: 740px; background: #E59A3A; color: #0D0D0D">Control operativo<br>de punta a punta</div>\n'
h += ('<div style="position: absolute; left: 0px; top: 1040px; width: 1080px; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center">'
      '<span style="font-size: 60px; line-height: 1.1; font-weight: 700; color: #183C35">Comenta<br><span style="color: #E59A3A">“DEMO”</span></span>'
      '<span style="width: 700px; font-size: 32px; line-height: 1.35; font-weight: 400; color: #183C35">Y conoce cómo se vería el Cerebro Digital de tu empresa</span></div>\n')
h += TAIL
open(root + 'S04-Cierre.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('S04-Cierre.dc.html', '04 · Comenta DEMO'))

now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
c = {'v': 3, 'createdOnFiles': {'v': 1, 'at': now}, 'title': 'Carrusel Cerebro Digital Repano', 'launch': {'view': 'canvas'}, 'pages': [],
     'boards': {n: {'x': i * (W + 80), 'y': 0, 'w': W, 'h': H, 'title': t} for i, (n, t) in enumerate(boards)},
     'order': [n for n, _ in boards], 'notes': {}, 'designSystems': []}
open(root + 'canvas.json', 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1))
print([n for n, _ in boards])
