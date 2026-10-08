/**
 * Guion para repano-carrusel.mjs (REPANO_GUION): carrusel "Miedos de la IA",
 * 5 slides en 4:5 (1080x1350), adaptado del carrusel de agentlyxai de
 * beneficios numerados (foto real + tarjeta con pestaña de carpeta + cierre
 * de color sólido), pero con dudas del dueño en vez de beneficios: los
 * beneficios (agenda, leads, respuestas) ya salieron en carruseles anteriores.
 *
 * Copy (todo el texto va en Claude Design, en Sora):
 *   01 portada  "TODO LO QUE TE DA MIEDO DE PONER UNA IA EN TU NEGOCIO"
 *               (MIEDO en ámbar) · bajada "Y por qué no debería."
 *   02 duda 1   "¿Va a sonar a robot?" → "Habla con tu tono."
 *   03 duda 2   "¿Y si no sabe qué responder?" → "Te pasa la conversación a ti."
 *   04 duda 3   "¿No es complicado de montar?" → "Lo montamos nosotros."
 *   05 cierre   "Comenta DUDA y te la respondemos" (no se genera: fondo verde
 *               bosque sólido, logo crema y texto, armado en Design).
 *
 * Tarjeta de las slides 2-4: cuerpo crema con la pestaña verde bosque y el
 * número en ámbar, sobre el 38% inferior. Por eso cada escena deja la cara y
 * la acción entre el 12% y el 60% de la altura.
 *
 * Sin mascota: las cuatro son fotos realistas con la misma dueña. La portada
 * se genera primero y el runner la adjunta como ancla a las demás, que es lo
 * que mantiene su cara y la luz. Para regenerar solo una (REPANO_SOLO), pasar
 * la portada aprobada con REPANO_ESTILO: sin ella no hay ancla adjunta.
 */
export const alto = 1350;

// La protagonista va aparte y explícita en ropa y rasgos, igual que la
// mascota en los otros guiones: una regla de estilo común no debe tocarla.
const DUENA = [
  "The protagonist is the owner of a small neighborhood bakery-café: a Latin American woman in her early",
  "forties, warm brown skin, dark brown hair tied in a low bun with a few loose strands, natural makeup.",
  "She wears a deep forest green (#183C35) canvas apron over a cream (#F5F4EF) long-sleeve shirt with the",
  "sleeves rolled up. Real person, natural proportions, realistic hands with five fingers.",
].join(" ");

/** Solo en las slides 2-4, que llevan la portada adjunta. */
const ANCLA = [
  "The attached image is the cover slide of this same carousel. Keep the SAME woman from it: same face, same",
  "hair, same apron and shirt, same bakery-café interior, same warm color grading and lighting. Only her pose,",
  "the camera angle and the moment change, as described. Do not copy its composition.",
].join(" ");

const LOCAL = [
  "Setting: a cozy small bakery-café with warm wood counters, a glass display case with pastries and bread,",
  "a few potted green plants and dark forest green painted walls.",
].join(" ");

/** Foto cálida y oscura, como los posts sueltos de Repano (consultorio, oficina). */
const FOTO = [
  "Style: photorealistic editorial photograph for a technology brand's Instagram carousel, portrait orientation,",
  "shot on a full-frame camera with a 35mm lens, shallow depth of field, natural skin texture.",
  "Light: warm amber (#E59A3A) evening light from pendant lamps, deep soft shadows, a moody and intimate mood.",
  "Color grading: warm and slightly desaturated, dominated by charcoal (#0D0D0D), deep forest green (#183C35),",
  "amber and cream; absolutely no purple, violet, magenta, pink, blue or cyan tones and no neon.",
].join(" ");

// Pantallas de espaldas o borrosas: si se ven, el modelo escribe texto falso.
const SIN_TEXTO = [
  "ABSOLUTELY NO TEXT: no letters, no numbers, no words, no signs, no menus, no chalkboards, no labels,",
  "no logos and no watermarks anywhere in the image. Any phone or laptop screen is either turned away from",
  "the camera or shows only a soft blurred glow with nothing readable on it.",
].join(" ");

// [slug, mascota (siempre vacío aquí), regla de texto, escena].
export const SLIDES = [
  ["01-portada", "", SIN_TEXTO, [
    DUENA,
    "Scene: closing time, the café is empty and the chairs are already on some tables. She sits alone behind",
    "the counter, leaning on it with one elbow, holding her phone in both hands and looking down at it with a",
    "thoughtful, doubtful expression, her lips slightly pressed, not sad. The phone screen faces her, away",
    "from the camera. Medium shot from the front, slightly low: her head sits at about 58% of the image",
    "height and she is horizontally centered; the counter fills the lower 25% of the frame.",
    "The upper 42% of the image is calm dark background, the out-of-focus dark green wall with only the soft",
    "warm glow of one pendant lamp, reserved for a large headline. No bright objects in that area.",
    LOCAL,
    FOTO,
  ].join(" ")],
  ["02-tono", "", SIN_TEXTO, [
    DUENA,
    ANCLA,
    "Scene: she stands behind the counter reading her phone and smiling with genuine relief, as if she just",
    "read a reply that sounds exactly like her. One hand holds the phone, the other rests on the counter next",
    "to a cup of coffee. The phone screen faces her, away from the camera. Medium close-up, three-quarter view",
    "from her left: her face sits at about 32% of the image height, in the right half of the frame.",
    "The lower 40% of the image is a calm, softly blurred counter top and display case with no important",
    "details, because a text card will cover it. The top 10% is calm background.",
    LOCAL,
    FOTO,
  ].join(" ")],
  ["03-traspaso", "", SIN_TEXTO, [
    DUENA,
    ANCLA,
    "Scene: she is serving a customer in person across the counter, handing over a small paper bag with",
    "bread, smiling at him. The customer is a man in his thirties in a charcoal jacket, seen from behind",
    "and slightly from the side, softly out of focus on the left. On the counter in front of her, her phone",
    "lies face up and has just lit up with a soft warm amber glow; the screen is blurred and nothing on it is",
    "readable. She glances at it with calm attention, not stress. Medium shot: her face sits at about 30% of",
    "the image height, in the right half of the frame, and the glowing phone is clearly visible at about",
    "55% of the image height. The lower 38% below the phone is a calm counter surface, because a text card",
    "will cover it. The top 10% is calm background.",
    LOCAL,
    FOTO,
  ].join(" ")],
  ["04-montaje", "", SIN_TEXTO, [
    DUENA,
    ANCLA,
    "Scene: she sits at a small wooden café table next to a friendly young man in his late twenties, a",
    "technology consultant in a charcoal sweater, who points at an open laptop while she nods and laughs,",
    "relaxed. Two cups of coffee and a croissant on a plate sit on the table. The laptop screen faces them,",
    "away from the camera; its lid is plain matte charcoal with no logo on it.",
    "Medium shot from the front: both faces sit at about 30% of the image height, she",
    "is on the right and he is on the left. The lower 38% of the image is the calm wooden table top with no",
    "important details, because a text card will cover it. The top 10% is calm background.",
    LOCAL,
    FOTO,
  ].join(" ")],
];

/** La escena ya lleva personaje, ancla y estilo en orden; la regla de texto al final. */
export function prompt(escena, reglaTexto) {
  return [escena, reglaTexto].join(" ");
}
