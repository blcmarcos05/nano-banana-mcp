# Genera las mesas de trabajo (.dc.html) y el canvas.json de un carrusel de
# Instagram 1080x1350 para Claude Design, con la plantilla de Repano: isotipo
# arriba a la izquierda, badge ámbar con ícono, título en dos líneas (carbón +
# ámbar), línea corta y bajada en Sora.
#
# Plantilla del carrusel "IA para tu negocio" (2026-09-24). Para uno nuevo:
# subir las imágenes al lienzo como assets, pegar sus /_blob/<id> abajo y
# cambiar SLIDES. Escribe en ./root/project, listo para publicar con root.
import json, datetime, os

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'root', 'project') + os.sep
os.makedirs(root, exist_ok=True)
ISO = '/_blob/49c3bf5a82de04ac3a983b9dbf808071'  # logo-repano-isotipo-ambar.svg
IC = {
    'msg': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    'cal': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    'user': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
    'send': '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
}


def svg(k, size, color, sw=2.2):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{IC[k]}</svg>')


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
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0;font-family:Sora,sans-serif;color:#0D0D0D;background:#F5F4EF}}
</style>
</helmet>
<div style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background: #F5F4EF; font-family: Sora, sans-serif; color: #0D0D0D">
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
# Las imágenes que se achican dejan franjas de fondo liso: el borde se funde
# con una máscara para que no se note el corte.
MASK = ("-webkit-mask-image: linear-gradient(to right, transparent 0, #000 90px), linear-gradient(to bottom, transparent 0, #000 70px, #000 calc(100% - 70px), transparent 100%); "
        "-webkit-mask-composite: source-in; mask-image: linear-gradient(to right, transparent 0, #000 90px), linear-gradient(to bottom, transparent 0, #000 70px, #000 calc(100% - 70px), transparent 100%); mask-composite: intersect")


def img(src, s, alt):
    """s < 1 achica la imagen pegada a la derecha para liberar la columna del texto."""
    if s == 1:
        return f'<img src="{src}" alt="{alt}" style="position: absolute; left: 0px; top: 0px; width: 1080px; height: 1350px">\n'
    W = round(1080 * s); H = round(1350 * s); L = 1080 - W; T = round((1350 - H) / 2)
    return f'<img src="{src}" alt="{alt}" style="position: absolute; left: {L}px; top: {T}px; width: {W}px; height: {H}px; {MASK}">\n'


LOGO = f'<img src="{ISO}" alt="Repano" style="position: absolute; left: 72px; top: 72px; width: 104px; height: 28px">\n'

# (archivo, título de la mesa, blob de la imagen, escala, ícono, línea 1, línea 2 ámbar, bajada, alt, píldora)
SLIDES = [
    ('S02-Mensajes.dc.html', '02 · Responder mensajes', '/_blob/11912d8fdc5fb9e2cb9c5358f6a85b61', 0.8, 'msg', 'Responder', 'mensajes',
     'Respuestas al instante por DM, WhatsApp y más.', 'Burbujas de chat 3D con una conversación en español', None),
    ('S03-Citas.dc.html', '03 · Agendar citas', '/_blob/6edee240addfa32105066781094348a6', 0.92, 'cal', 'Agendar', 'citas',
     'La IA revisa la disponibilidad y agenda por ti.', 'Calendario 3D con un día marcado', None),
    ('S04-Prospectos.dc.html', '04 · Calificar prospectos', '/_blob/cf74ad692f1a39f1884cba74270c7e24', 1, 'user', 'Calificar', 'prospectos',
     'La IA hace las preguntas correctas y filtra los mejores prospectos.', 'Ficha de prospecto 3D con checks', None),
    ('S05-Seguimiento.dc.html', '05 · Seguimiento automático', '/_blob/62c2b6b93e7cf0f00145ede063149249', 1, 'send', 'Seguimiento', 'automático',
     'La IA da seguimiento para que nunca pierdas una oportunidad.', 'Sobre 3D con una línea de tiempo de seguimiento', None),
    ('S06-Recordatorios.dc.html', '06 · Enviar recordatorios', '/_blob/89812394bd77b861877a78ac20f3f456', 0.84, 'bell', 'Enviar', 'recordatorios',
     'La IA envía recordatorios inteligentes para que nada se te escape.', 'Teléfono 3D con recordatorios y una campana', None),
    ('S07-24-7.dc.html', '07 · Trabaja 24/7', '/_blob/a399d0d19e58a49e423bc11341c362d9', 0.84, 'clock', 'Trabaja', '24/7',
     'La IA nunca duerme. Tu negocio nunca se detiene.', 'Repanito con audífonos junto a un aro 24/7', ('Siempre activo.', 'Siempre trabajando para ti.')),
]
CHECK = ('<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#E59A3A" stroke-width="2.2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>')

for f, title, src, s, icon, l1, l2, body, alt, pill in SLIDES:
    h = HEAD.format(title=title) + img(src, s, alt) + LOGO
    h += '<div style="position: absolute; left: 72px; top: 230px; width: 440px; display: flex; flex-direction: column; align-items: flex-start">\n'
    h += f'<div style="width: 96px; height: 96px; border-radius: 48px; background: #E59A3A; display: flex; align-items: center; justify-content: center">{svg(icon, 46, "#FFFFFF")}</div>\n'
    h += (f'<h1 style="margin: 40px 0px 0px 0px; font-size: 62px; line-height: 1.04; font-weight: 700; letter-spacing: -0.02em">'
          f'<span style="display: block; color: #0D0D0D">{l1}</span><span style="display: block; color: #E59A3A">{l2}</span></h1>\n')
    h += '<div style="margin-top: 30px; width: 48px; height: 5px; border-radius: 3px; background: #E59A3A"></div>\n'
    h += f'<p style="margin: 28px 0px 0px 0px; width: 360px; font-size: 26px; line-height: 1.45; font-weight: 400; color: #2A2A2A">{body}</p>\n'
    if pill:
        h += (f'<div style="margin-top: 32px; display: flex; align-items: center; gap: 14px; padding: 16px 22px; border-radius: 18px; background: #FBEBD6">{CHECK}'
              f'<div style="display: flex; flex-direction: column; font-size: 19px; line-height: 1.35; color: #0D0D0D">'
              f'<span style="font-weight: 600">{pill[0]}</span><span style="font-weight: 400">{pill[1]}</span></div></div>\n')
    h += '</div>\n' + TAIL
    open(root + f, 'w', encoding='utf-8').write(h)

ARROW = ('<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E59A3A" stroke-width="2.4" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true" style="vertical-align: -6px"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>')
p = HEAD.format(title='01 · Portada') + img('/_blob/302a8103d4ca2dc70b8a9fe7493e06d4', 1, 'Repanito, la mascota de Repano, sonriendo') + LOGO
p += ('<h1 style="position: absolute; left: 72px; top: 230px; width: 760px; margin: 0px; font-size: 104px; line-height: 1.02; font-weight: 700; letter-spacing: -0.03em">'
      '<span style="display: block">¿Y si la <span style="color: #E59A3A">IA</span></span><span style="display: block">trabajara</span>'
      '<span style="display: block">para tu</span><span style="display: block; color: #E59A3A">negocio?</span></h1>\n')
p += (f'<p style="position: absolute; left: 72px; top: 712px; width: 360px; margin: 0px; font-size: 34px; line-height: 1.35; font-weight: 400; color: #2A2A2A">'
      f'Esto es lo que<br>puede hacer. {ARROW}</p>\n')
p += TAIL
open(root + 'Main.dc.html', 'w', encoding='utf-8').write(p)

names = ['Main.dc.html'] + [s[0] for s in SLIDES]
titles = ['01 · Portada'] + [s[1] for s in SLIDES]
boards = {n: {'x': i * 1160, 'y': 0, 'w': 1080, 'h': 1350, 'title': t} for i, (n, t) in enumerate(zip(names, titles))}
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
c = {'v': 3, 'createdOnFiles': {'v': 1, 'at': now}, 'title': 'Carrusel IA Repano', 'launch': {'view': 'canvas'}, 'pages': [],
     'boards': boards, 'order': names, 'notes': {}, 'designSystems': []}
open(root + 'canvas.json', 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1))
print(names)
