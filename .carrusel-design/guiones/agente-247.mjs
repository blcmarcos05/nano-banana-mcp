/**
 * Guion para repano-carrusel.mjs (REPANO_GUION): carrusel "Agente 24/7",
 * 5 slides en 4:5 (1080x1350), adaptado de un carrusel con la mascota en el
 * centro y los íconos de apps en órbita.
 *
 * Aquí solo se generan la portada (con Repanito) y una hoja de íconos 3D para
 * las slides 2 y 3. Los logos de apps, los títulos y la slide "Así funciona"
 * se arman en Claude Design; el cierre reutiliza el Repanito sobre crema del
 * carrusel "IA para tu negocio".
 */
export const alto = 1350;

// Personaje primero y explícito en color y material: una regla de estilo
// común le cambiaba el material a la mascota.
const PERSONAJE = [
  "The character is the mascot in the attached reference image, reproduced EXACTLY as it appears there:",
  "identical silhouette, identical two-peaked faceted hood, identical face shape, identical short legs,",
  "identical front camera angle. Do not redesign, restyle or simplify any part of it.",
  "COLORS OF THE CHARACTER: the faceted hood and the legs are matte deep forest green (#183C35), the face",
  "area under the hood is near-black charcoal (#0D0D0D), and the two smiling crescent eyes glow warm amber",
  "(#E59A3A). Material: soft matte, slightly textured, like painted stone or clay, with crisp low-poly facets.",
  "It is never glossy plastic and never cream, white or light colored. The scene's amber light only rim-lights",
  "its edges; it does not change its colors.",
].join(" ");

/** Oscuro con luz ámbar, igual que el carrusel "cerebro digital". */
const OSCURO = [
  "Style: premium cinematic 3D render for a technology brand's Instagram carousel slide, portrait orientation.",
  "Background: deep near-black charcoal (#0D0D0D) with a very dark forest green (#183C35) tint toward the edges,",
  "smooth and clean, with no pattern, no grid, no stars, no bokeh dots and no visible horizon line.",
  "Light: warm amber (#E59A3A) glow as the main accent light, with subtle cool grey-green (#71877E) rim light.",
  "The palette is strictly charcoal, deep forest green, amber, grey-green and cream (#F5F4EF):",
  "absolutely no purple, violet, magenta, pink, blue or cyan anywhere. High detail, sharp focus on the subject.",
].join(" ");

const SIN_TEXTO =
  "ABSOLUTELY NO TEXT: no letters, no numbers, no words, no logos, no app icons, no UI and no watermarks anywhere in the image.";

// La hoja de íconos no puede llevar la regla de arriba: "no app icons" choca
// con la escena, que pide justamente seis íconos.
const SIN_LETRAS =
  "ABSOLUTELY NO TEXT: no letters, no numbers, no words, no brand logos and no watermarks anywhere in the image.";

// [slug, mascota (no vacío = adjunta la referencia), regla de texto, escena].
export const SLIDES = [
  ["01-portada", "si", SIN_TEXTO, [
    PERSONAJE,
    "Scene: the mascot stands centered horizontally in the lower-middle of the frame, in a front view facing the",
    "viewer with a happy expression, fully visible. It spans about 32% of the image width and its feet rest at",
    "about 80% of the image height, on a dark glossy floor that shows a soft amber reflection under it.",
    "A soft warm amber glow radiates behind the mascot like a halo.",
    "Around the mascot, ONE thin glowing amber neon ring orbits in perspective, like a wide tilted ellipse centered",
    "on the mascot, about 85% of the image width across: it passes behind the mascot's head and in front of its",
    "legs. The ring is a clean empty line of light with nothing on it: no icons, no spheres, no badges, no objects.",
    "The upper 38% of the image is empty dark background reserved for a headline, and the bottom 10% is empty",
    "dark floor. No other objects anywhere.",
    OSCURO,
  ].join(" ")],
  ["02-iconos", "", SIN_LETRAS, [
    "A sheet of SIX separate 3D icons arranged in a clean grid of 2 columns and 3 rows, with generous empty space",
    "between them. Each icon sits centered in its own cell; all six are the same size, each about 28% of the image",
    "width, and none touches or overlaps another or the edges of the image.",
    "Row 1, left: a rounded speech bubble in amber with three small cream dots inside.",
    "Row 1, right: a small desk calendar with a thick amber top band with two rings, a grid of plain cream squares",
    "and one amber square with a white checkmark.",
    "Row 2, left: a cream user profile card with a grey-green round avatar and two grey-green placeholder bars,",
    "with a glossy amber star badge on its top-right corner.",
    "Row 2, right: a closed cream envelope with an amber circular refresh arrow wrapped around its lower-right corner.",
    "Row 3, left: an amber notification bell with two small curved sound-wave arcs on each side.",
    "Row 3, right: a cream clipboard with a small bar chart on it, bars in amber and grey-green.",
    "All six share exactly the same style: chunky 3D icons made of smooth semi-glossy plastic with thick rounded",
    "bevels, mostly cream white with amber (#E59A3A) as the single accent color and neutral details in grey-green",
    "(#71877E), each in a gentle three-quarter view, lit by soft diffuse studio light from the upper left, each with",
    "a soft contact shadow below it.",
    "Background: one single flat warm cream color (#F5F4EF) filling the whole canvas edge to edge, perfectly uniform:",
    "no grid lines, no dividers, no cell borders, no panels, no gradient, no floor line.",
    "No character in this image.",
  ].join(" ")],
];

/** La escena ya lleva personaje y estilo en orden; la regla de texto al final. */
export function prompt(escena, reglaTexto) {
  return [escena, reglaTexto].join(" ");
}
