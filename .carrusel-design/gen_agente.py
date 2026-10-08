# Mesas de Claude Design del carrusel "Agente 24/7" (4:5, 1080x1350):
# portada y hoja de íconos generadas con guiones/agente-247.mjs, cierre
# reutilizado del carrusel "IA para tu negocio", todo el texto en Sora.
#
# Uso: python gen_agente.py <carpeta root> <carpeta de imágenes>
#   <carpeta de imágenes> tiene el blobs.json {id de blob: archivo} de export.mjs;
#   aquí se invierte para escribir cada /_blob/<id> por nombre de archivo.
import json, datetime, os, sys

root = os.path.join(sys.argv[1], 'project') + os.sep
os.makedirs(root, exist_ok=True)
BLOB = {f: f'/_blob/{i}' for i, f in json.load(open(os.path.join(sys.argv[2], 'blobs.json'), encoding='utf-8')).items()}
W, H, TOTAL = 1080, 1350, 5

CARBON, VERDE, GRIS, CREMA, AMBAR = '#0D0D0D', '#183C35', '#71877E', '#F5F4EF', '#E59A3A'

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
<div style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background: {bg}; font-family: Sora, sans-serif; color: {fg}">
'''
TAIL = '''</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1080,"height":1350}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
'''
ARROW = ('<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="2.4" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>')


def fondo(src, alt):
    return f'<img src="{BLOB[src]}" alt="{alt}" style="position: absolute; left: 0px; top: 0px; width: 1080px; height: 1350px">\n'


def pie(n, oscuro, desliza=True):
    """Logo, número de página y "Desliza", como el pie del carrusel de referencia."""
    fg = CREMA if oscuro else VERDE
    logo = 'logo-repano-crema.svg' if oscuro else 'logo-repano-verde.svg'
    borde = 'rgba(245, 244, 239, 0.35)' if oscuro else 'rgba(24, 60, 53, 0.25)'
    h = f'<img src="{BLOB[logo]}" alt="Repano" style="position: absolute; left: 72px; top: 1240px; width: 120px; height: 48px">\n'
    pag = (f'display: flex; align-items: center; padding: 8px 22px; border-radius: 40px; border: 1.5px solid {borde}; '
           f'font-size: 24px; font-weight: 600; color: {fg}')
    if desliza:
        h += f'<div style="position: absolute; left: 480px; top: 1242px; width: 120px; display: flex; justify-content: center"><span style="{pag}">{n}/{TOTAL}</span></div>\n'
        h += ('<div style="position: absolute; right: 72px; top: 1238px; display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 26px; '
              f'border-radius: 40px; background: {AMBAR}; color: {CARBON}; font-size: 26px; font-weight: 700">Desliza {ARROW}</div>\n')
    else:
        h += f'<div style="position: absolute; left: 216px; top: 1242px; display: flex"><span style="{pag}">{n}/{TOTAL}</span></div>\n'
    return h


boards = []

# 01 · Portada: Repanito con el anillo de luz y los logos en órbita.
h = HEAD.format(title='01 · Portada', bg=CARBON, fg=CREMA)
h += fondo('repano-01-portada.jpg', 'Repanito, la mascota de Repano, dentro de un anillo de luz ámbar')
h += ('<h1 style="position: absolute; left: 0px; top: 104px; width: 1080px; margin: 0px; text-align: center; font-size: 86px; line-height: 1.12; '
      'font-weight: 800; letter-spacing: -0.035em">¿Un agente de IA<br>trabajando <span style="display: inline-block; padding: 0px 22px; border-radius: 22px; '
      f'background: {AMBAR}; color: {CARBON}; transform: rotate(-2deg)">24/7</span><br>para tu negocio?</h1>\n')
h += ('<p style="position: absolute; left: 0px; top: 432px; width: 1080px; margin: 0px; text-align: center; font-size: 34px; font-weight: 400; '
      'color: rgba(245, 244, 239, 0.78)">Conectado a las apps que ya usas.</p>\n')
# Sobre un círculo de radio ~440 alrededor de Repanito, a ±50°, ±85°, ±115° y ±145° desde arriba.
ORBITA = [
    ('whatsapp-icon.svg', 'WhatsApp', 203, 540), ('instagram-icon.svg', 'Instagram', 877, 540),
    ('google-gmail.svg', 'Gmail', 102, 770), ('google-calendar.svg', 'Google Calendar', 978, 770),
    ('google-sheets.svg', 'Google Sheets', 141, 990), ('hubspot-icon.svg', 'HubSpot', 939, 990),
    ('slack-icon.svg', 'Slack', 290, 1158), ('notion-icon.svg', 'Notion', 790, 1158),
]
for f, alt, cx, cy in ORBITA:
    h += (f'<div style="position: absolute; left: {cx - 50}px; top: {cy - 50}px; width: 100px; height: 100px; border-radius: 50px; background: {CREMA}; '
          'display: flex; align-items: center; justify-content: center; box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.5), 0px 0px 0px 2px rgba(229, 154, 58, 0.55), '
          f'0px 0px 32px rgba(229, 154, 58, 0.35)"><img src="{BLOB[f]}" alt="{alt}" style="width: 54px; height: 54px; object-fit: contain"></div>\n')
h += pie(1, True)
h += TAIL
open(root + 'Main.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('Main.dc.html', '01 · Portada'))


def lista(archivo, titulo, n, lineas, bajada, filas):
    """Slide crema: título de tres líneas (la última en ámbar), bajada y tres filas ícono + texto."""
    h = HEAD.format(title=titulo, bg=CREMA, fg=CARBON)
    h += ('<h1 style="position: absolute; left: 72px; top: 110px; width: 936px; margin: 0px; font-size: 92px; line-height: 1.04; font-weight: 800; '
          f'letter-spacing: -0.04em">{lineas[0]}<br>{lineas[1]}<br><span style="color: {AMBAR}">{lineas[2]}</span></h1>\n')
    h += f'<p style="position: absolute; left: 72px; top: 452px; width: 900px; margin: 0px; font-size: 34px; line-height: 1.3; font-weight: 700; color: {VERDE}">{bajada}</p>\n'
    h += '<div style="position: absolute; left: 72px; top: 580px; width: 936px; display: flex; flex-direction: column; gap: 40px">\n'
    for icono, alt, texto in filas:
        h += ('<div style="display: flex; align-items: center; gap: 40px">'
              f'<img src="{BLOB[icono]}" alt="{alt}" style="width: 160px; height: 160px; flex-shrink: 0; object-fit: cover; border-radius: 34px; '
              'box-shadow: 0px 14px 30px rgba(24, 60, 53, 0.14), 0px 0px 0px 1.5px rgba(24, 60, 53, 0.08)">'
              f'<p style="margin: 0px; font-size: 36px; line-height: 1.32; font-weight: 400; color: #2A2A2A">{texto}</p></div>\n')
    h += '</div>\n'
    h += pie(n, False)
    h += TAIL
    open(root + archivo, 'w', encoding='utf-8').write(h)
    boards.append((archivo, titulo))


B = f'font-weight: 700; color: {CARBON}'
lista('S02-Atiende.dc.html', '02 · Atiende', 2, ('Atiende a', 'tus clientes', 'sin pausa'),
      'Tu agente responde por ti, a cualquier hora.', [
          ('icono-chat.png', 'Burbuja de chat', f'<b style="{B}">Responde al instante</b> por WhatsApp, Instagram y correo.'),
          ('icono-calendario.png', 'Calendario con un día marcado', f'<b style="{B}">Revisa tu agenda</b> y reserva la cita solo.'),
          ('icono-lead.png', 'Ficha de cliente con una estrella', f'<b style="{B}">Detecta quién está listo para comprar</b> y te avisa.'),
      ])
lista('S03-Vende.dc.html', '03 · Vende y opera', 3, ('Vende', 'y opera', 'por ti'),
      'Mientras tú te enfocas en hacer crecer tu negocio.', [
          ('icono-seguimiento.png', 'Sobre con una flecha de seguimiento', f'<b style="{B}">Hace seguimiento</b> a quien no respondió.'),
          ('icono-campana.png', 'Campana de notificación', f'<b style="{B}">Envía recordatorios</b> y confirmaciones.'),
          ('icono-reporte.png', 'Portapapeles con un gráfico de barras', f'<b style="{B}">Te manda cada día un resumen</b> con lo importante.'),
      ])

# 04 · Así funciona: un ejemplo en tres pasos, sin capturas.
h = HEAD.format(title='04 · Así funciona', bg=CARBON, fg=CREMA)
h += ('<div style="position: absolute; left: 0px; top: 0px; width: 1080px; height: 1350px; '
      'background: radial-gradient(ellipse at 50% 100%, rgba(229, 154, 58, 0.22) 0%, rgba(24, 60, 53, 0.35) 40%, rgba(13, 13, 13, 0) 75%)"></div>\n')
h += (f'<div style="position: absolute; left: 72px; top: 96px; display: flex; gap: 12px; font-size: 24px; font-weight: 600">'
      f'<span style="padding: 8px 22px; border-radius: 40px; border: 1.5px solid {AMBAR}; color: {AMBAR}">Así funciona</span>'
      '<span style="padding: 8px 22px; border-radius: 40px; border: 1.5px solid rgba(245, 244, 239, 0.3); color: rgba(245, 244, 239, 0.7)">Ejemplo</span></div>\n')
h += ('<h1 style="position: absolute; left: 72px; top: 170px; width: 936px; margin: 0px; font-size: 92px; line-height: 1.04; font-weight: 800; '
      f'letter-spacing: -0.04em">Un mensaje.<br><span style="color: {AMBAR}">Todo resuelto.</span></h1>\n')
# Línea que une los tres pasos, detrás de los números.
h += f'<div style="position: absolute; left: 134px; top: 500px; width: 4px; height: 440px; background: {AMBAR}; opacity: 0.6"></div>\n'
CARD = ('display: flex; align-items: center; gap: 28px; height: 190px; box-sizing: border-box; padding: 0px 32px; border-radius: 30px; '
        'background: rgba(245, 244, 239, 0.06); border: 1.5px solid rgba(229, 154, 58, 0.35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)')
NUM = (f'width: 64px; height: 64px; flex-shrink: 0; border-radius: 32px; background: {AMBAR}; color: {CARBON}; display: flex; align-items: center; '
       'justify-content: center; font-size: 30px; font-weight: 800; box-shadow: 0px 0px 24px rgba(229, 154, 58, 0.5)')
TILE = (f'width: 92px; height: 92px; flex-shrink: 0; border-radius: 24px; background: {CREMA}; display: flex; align-items: center; justify-content: center')
ETQ = f'font-size: 24px; font-weight: 600; color: {GRIS}'
PASOS = [
    ('whatsapp-icon.svg', 'WhatsApp', 'El cliente escribe',
     f'<span style="align-self: flex-start; padding: 14px 24px; border-radius: 24px 24px 24px 6px; background: {CREMA}; color: {CARBON}; '
     'font-size: 34px; font-weight: 600">¿Tienen turno el jueves?</span>'),
    ('google-calendar.svg', 'Google Calendar', 'Repano revisa tu agenda',
     f'<span style="font-size: 34px; line-height: 1.25">Encuentra el hueco y <b style="color: {AMBAR}">agenda la cita</b>.</span>'),
    ('google-sheets.svg', 'Google Sheets', 'Y te deja todo en orden',
     f'<span style="font-size: 34px; line-height: 1.25"><b style="color: {AMBAR}">Registra al cliente</b> en Sheets o tu CRM y te avisa.</span>'),
]
h += '<div style="position: absolute; left: 72px; top: 440px; width: 936px; display: flex; flex-direction: column; gap: 30px">\n'
for i, (f, alt, etq, cuerpo) in enumerate(PASOS, 1):
    h += (f'<div style="{CARD}"><span style="{NUM}">{i}</span><span style="{TILE}"><img src="{BLOB[f]}" alt="{alt}" style="width: 56px; height: 56px; object-fit: contain"></span>'
          f'<div style="display: flex; flex-direction: column; gap: 10px"><span style="{ETQ}">{etq}</span>{cuerpo}</div></div>\n')
h += '</div>\n'
h += ('<p style="position: absolute; left: 72px; top: 1116px; width: 936px; margin: 0px; text-align: center; font-size: 26px; line-height: 1.4; '
      'color: rgba(245, 244, 239, 0.72)">Se conecta con Gmail, Calendar, Sheets, HubSpot, Slack, Notion<br>y cientos de apps más.</p>\n')
h += pie(4, True)
h += TAIL
open(root + 'S04-Asi-funciona.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('S04-Asi-funciona.dc.html', '04 · Así funciona'))

# 05 · Cierre: Repanito con auriculares, abajo a la derecha.
# El fondo de la imagen es exactamente el crema de la marca: va suelta, sin máscara.
h = HEAD.format(title='05 · Comenta DEMO', bg=CREMA, fg=VERDE)
h += (f'<img src="{BLOB["repanito-auriculares.png"]}" alt="Repanito, la mascota de Repano, sonriendo con auriculares y micrófono" '
      'style="position: absolute; left: 300px; top: 560px; width: 780px; height: 780px">
')
h += (f'<h1 style="position: absolute; left: 72px; top: 140px; width: 936px; margin: 0px; font-weight: 800; letter-spacing: -0.04em; color: {VERDE}">'
      f'<span style="display: block; font-size: 104px; line-height: 1">Comenta</span>'
      f'<span style="display: block; font-size: 168px; line-height: 1.05; color: {AMBAR}">“DEMO”</span></h1>\n')
h += (f'<p style="position: absolute; left: 72px; top: 450px; width: 560px; margin: 0px; font-size: 40px; line-height: 1.3; font-weight: 400; color: {VERDE}">'
      'y te mostramos cómo se vería <b style="font-weight: 700">el agente de tu negocio</b>.</p>\n')
h += pie(5, False, desliza=False)
h += TAIL
open(root + 'S05-Cierre.dc.html', 'w', encoding='utf-8').write(h)
boards.append(('S05-Cierre.dc.html', '05 · Comenta DEMO'))

now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
c = {'v': 3, 'createdOnFiles': {'v': 1, 'at': now}, 'title': 'Carrusel Agente 24/7 Repano', 'launch': {'view': 'canvas'}, 'pages': [],
     'boards': {n: {'x': i * (W + 80), 'y': 0, 'w': W, 'h': H, 'title': t} for i, (n, t) in enumerate(boards)},
     'order': [n for n, _ in boards], 'notes': {}, 'designSystems': []}
open(root + 'canvas.json', 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1))
print([n for n, _ in boards])
