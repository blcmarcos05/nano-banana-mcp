/**
 * Guion para repano-carrusel.mjs (REPANO_GUION): Repanitos con accesorio por
 * rama para las tarjetas "Negocios" y "Profesionales" del dossier.
 *
 * Se genera y se guarda en 3:4 (1080x1440); el cuadrado se recorta después
 * alrededor del personaje, porque el modelo no siempre lo centra.
 *
 * Una sola referencia para todas (el Repanito limpio), adjunta a mano en el
 * compositor: REPANO_ADJUNTO=1.
 */
export const alto = 1440; // 3:4 completo; el cuadrado se recorta después alrededor del personaje

// Personaje primero y explícito en color y material, aparte del accesorio:
// una regla de estilo común le cambiaba el material a la mascota.
const PERSONAJE = [
  "The character is the mascot in the attached reference image, reproduced EXACTLY as it appears there:",
  "identical silhouette, identical two-peaked faceted hood, identical face shape, identical short legs,",
  "identical pose, identical front camera angle. Do not redesign, restyle or simplify any part of it.",
  "Ignore the dark background of the reference photo: the character stands on the cream background of this image.",
  "COLORS OF THE CHARACTER: the faceted hood and the legs are matte deep forest green (#183C35), the face",
  "area under the hood is near-black charcoal (#0D0D0D), and the two smiling crescent eyes glow warm amber",
  "(#E59A3A). Material: soft matte, slightly textured, like painted stone or clay, with crisp low-poly facets.",
  "It is never glossy plastic and never cream, white or light colored.",
].join(" ");

const ENCUADRE = [
  "Framing: the character is centered horizontally and vertically, spanning about 55% of the image width,",
  "fully visible with generous empty space around it on all sides; nothing touches the edges.",
].join(" ");

const FONDO = [
  "Style: premium, cute, minimalist 3D toy render. Soft diffuse studio light from the upper left, soft",
  "natural contact shadow under the character. Background: one single flat warm cream color (#F5F4EF),",
  "perfectly uniform edge to edge, no gradient, no floor line, no pattern.",
].join(" ");

const SIN_TEXTO = "No text, no letters, no logos and no watermarks anywhere in the image.";

// El accesorio es lo único nuevo: chico, simple, un solo color de la paleta.
const CORBATA = [
  "The ONLY addition: the character wears a tiny, adorable necktie in warm amber (#E59A3A), matte, with a neat",
  "small knot. The knot sits at the front of the body just below the glowing eyes, at the bottom edge of the",
  "dark face, and the short tie hangs down between the two legs. Kid-sized proportions, like a tie on a plush",
  "toy. Simple clean shape, no stripes, no pattern.",
].join(" ");

const CASCO = [
  "The ONLY addition: the character wears a small, cute construction hard hat in warm amber (#E59A3A),",
  "semi-matte, with a short front brim and one raised ridge along the top, sitting slightly tilted on top of",
  "its two-peaked green hood. The hood keeps its shape underneath; the hat is small, like a toy's hat.",
  "Simple clean shape, no logo, no stickers.",
].join(" ");

const ESTETOSCOPIO = [
  "The ONLY additions: the character wears small round glasses with thin amber (#E59A3A) frames over its",
  "glowing crescent eyes, so the eyes are still clearly visible through the lenses, and a tiny stethoscope",
  "hangs around the base of its hood like a necklace, with grey-green (#71877E) tubing and a small amber chest",
  "piece resting on the front of its body. Everything small, simple and adorable.",
].join(" ");

const BIRRETE = [
  "The ONLY addition: the character wears a small graduation cap (mortarboard) in deep charcoal (#0D0D0D)",
  "with a thin amber (#E59A3A) tassel hanging to one side, sitting slightly tilted on top of its two-peaked",
  "green hood. The hood keeps its shape underneath; the cap is small, like a toy's cap. Simple clean shape.",
].join(" ");

const AUDIFONOS = [
  "The ONLY addition: the character wears a small, cute headset in warm amber (#E59A3A), semi-matte: a thin",
  "headband resting over the top of its two-peaked green hood, one small round ear cup on each side of the hood,",
  "and a tiny boom microphone curving toward the side of its dark face. The hood keeps its two peaks and its",
  "shape underneath. Small, simple and adorable, like a toy's headset.",
].join(" ");

const CORBATIN = [
  "The ONLY addition: the character wears a tiny, adorable bow tie in warm amber (#E59A3A), matte, like a",
  "polite butler's bow tie, sitting at the front of the body right at the bottom edge of the dark face, below",
  "the glowing eyes. Kid-sized proportions, like a bow tie on a plush toy. Simple clean shape, no pattern.",
].join(" ");

// [slug, mascota, regla de texto, escena]. "mascota" solo marca que va la referencia.
export const SLIDES = [
  ["negocios-corbata-a", "ref", SIN_TEXTO, CORBATA],
  ["negocios-corbata-b", "ref", SIN_TEXTO, CORBATA],
  ["prof-casco-a", "ref", SIN_TEXTO, CASCO],
  ["prof-casco-b", "ref", SIN_TEXTO, CASCO],
  ["prof-estetoscopio-a", "ref", SIN_TEXTO, ESTETOSCOPIO],
  ["prof-estetoscopio-b", "ref", SIN_TEXTO, ESTETOSCOPIO],
  ["prof-birrete-a", "ref", SIN_TEXTO, BIRRETE],
  ["prof-birrete-b", "ref", SIN_TEXTO, BIRRETE],
  ["asistente-audifonos", "ref", SIN_TEXTO, AUDIFONOS],
  ["asistente-corbatin", "ref", SIN_TEXTO, CORBATIN],
];

export const prompt = (escena, reglaTexto) => [PERSONAJE, escena, ENCUADRE, FONDO, reglaTexto].join(" ");
