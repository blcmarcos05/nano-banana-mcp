/**
 * Guion para repano-carrusel.mjs (REPANO_GUION): carrusel "cerebro digital",
 * 4 slides en 3:4 (1080x1440), adaptado de una referencia oscura con luces
 * neón violeta a la paleta de Repano.
 *
 * Aquí solo se generan fondos y objetos 3D. Todo el texto (titulares,
 * píldoras, tarjetas de métricas, etiquetas, logos de apps) va después en
 * Claude Design, así que cada escena deja libre el espacio donde irá.
 */
export const alto = 1440;

/** Oscuro con luz ámbar: las tres primeras. Nada de violeta ni azul, que es lo que el modelo asocia a "tech". */
const OSCURO = [
  "Style: premium cinematic 3D render for a technology brand's Instagram carousel slide, portrait orientation.",
  "Background: deep near-black charcoal (#0D0D0D) with a very dark forest green (#183C35) tint toward the edges,",
  "smooth and clean, with no pattern, no grid, no stars, no bokeh dots and no visible horizon line.",
  "Light: glowing warm amber (#E59A3A) neon light as the main light source, with subtle cool grey-green (#71877E)",
  "rim light. The palette is strictly charcoal, deep forest green, amber, grey-green and cream (#F5F4EF):",
  "absolutely no purple, violet, magenta, pink, blue or cyan anywhere.",
  "High detail, sharp focus on the subject, generous dark negative space.",
].join(" ");

/** Claro para el cierre: el fondo crema de la marca. */
const CLARO = [
  "Style: clean, bright, minimal premium background for a technology brand's Instagram carousel slide, portrait orientation.",
  "The palette is strictly warm cream (#F5F4EF), white, pale amber (#E59A3A at low opacity) and pale grey-green (#71877E):",
  "absolutely no purple, violet, pink, blue or cyan anywhere.",
].join(" ");

const SIN_TEXTO =
  "ABSOLUTELY NO TEXT: no letters, no numbers, no words, no symbols, no logos, no app icons with symbols, no UI and no watermarks anywhere in the image.";

// [slug, mascota (siempre vacío aquí), regla de texto, escena]. La escena lleva
// su propio estilo al final (OSCURO o CLARO) para no mezclar reglas.
export const SLIDES = [
  ["01-portada", "", SIN_TEXTO, [
    "Abstract flowing ribbons of glowing amber neon light, like smooth silk strands of light looping and swirling",
    "in 3D space, with a few thinner grey-green light strands woven between them. The strands swirl mainly through",
    "the upper half and the center of the frame, with depth of field: a couple of strands in the foreground are",
    "softly blurred. Behind the horizontal band from 35% to 60% of the image height the background stays dark and",
    "calm, so a large headline can sit on top and stay readable. The bottom 20% of the frame is dark and empty.",
    OSCURO,
  ].join(" ")],
  ["02-infraestructura", "", SIN_TEXTO, [
    "A human hand resting on a sleek white computer mouse on a dark glossy desk, in the lower-right of the frame,",
    "lit by warm amber light that leaves a soft amber reflection on the desk.",
    "Above the hand, in the middle of the frame, EXACTLY THREE glossy 3D app tiles float in the air, in one row:",
    "left, center and right, all three fully visible and not overlapping. They are rounded squares with",
    "thick soft bevels, cream-white, each with a completely blank flat face with nothing printed on it.",
    "The tiles face the camera straight on: each front face is flat and parallel to the image plane, upright,",
    "not rotated and not tilted, like app icons on a screen, so a logo could be placed flat on each face.",
    "The center tile sits slightly higher than the other two; all three are the same size, each about 20% of the",
    "image width. Count them: one, two, three tiles, never two and never four.",
    "Behind the three tiles, a thin glowing amber light arc passes like an orbit, as a subtle secondary detail.",
    "The dark background fills the entire canvas seamlessly to all four edges: no black bars, no letterbox bands,",
    "no borders and no frame at the top or bottom. The upper 18% of the image is simply the same dark background",
    "with nothing in it, reserved for a headline. No lamps, no light tubes and no other objects.",
    OSCURO,
  ].join(" ")],
  ["03-arquitectura", "", SIN_TEXTO, [
    "A single glossy 3D human brain sculpture made of translucent amber glass with a warm inner glow and soft",
    "grey-green reflections, floating centered horizontally with its center at about 42% of the image height,",
    "spanning about 45% of the image width. A soft cone of spotlight falls on it from above, and a faint amber glow",
    "reflects on a dark stage floor below it. The whole brain is visible and nothing is cropped.",
    "The dark background fills the entire canvas seamlessly to all four edges: no black bars, no letterbox bands,",
    "no borders and no frame. Above the brain there is only the same dark background, and the lower 38% of the",
    "image is the same dark background with only the faint floor glow, reserved for text. No other objects.",
    OSCURO,
  ].join(" ")],
  ["04-cierre", "", SIN_TEXTO, [
    "A bright background of soft warm cream (#F5F4EF) with a gentle white glow in the center.",
    "In the lower-right corner, a few large, airy abstract ribbons made of thin translucent line strands in pale",
    "amber and pale grey-green curve gracefully and are partly cropped by the right and bottom edges.",
    "The rest of the frame is calm, empty cream space. No objects, no shapes in the center.",
    CLARO,
  ].join(" ")],
  // Variante del cierre con las píldoras como objetos 3D, del mismo material
  // que las fichas de la slide 2. Van en blanco: el texto se pone en Design.
  ["04-cierre-3d", "", SIN_TEXTO, [
    "Three large glossy 3D capsule shapes, like long rounded pills (stadium shapes with fully rounded ends),",
    "made of smooth semi-glossy plastic with thick soft bevels and a soft specular highlight along the top edge,",
    "the same material as premium 3D app icons. Each capsule spans about 80% of the image width and about 14%",
    "of the image height. They are stacked vertically in the upper-middle of the frame, between 20% and 65% of",
    "the image height, horizontally centered, each one slightly overlapping the one below it, and all three",
    "tilted by the same small angle of about 5 degrees, rising toward the right. Their front faces are smooth,",
    "flat-looking and completely blank, with nothing printed on them.",
    "Colors: the top capsule is deep forest green (#183C35), the middle one is charcoal black (#0D0D0D) and the",
    "bottom one is amber (#E59A3A). Soft studio light from the upper left, a subtle warm amber rim light, and",
    "soft realistic shadows falling on the background.",
    "Background: soft warm cream (#F5F4EF) filling the whole canvas to all four edges, with a gentle white glow;",
    "in the lower-right corner a few airy abstract ribbons of thin translucent line strands in pale amber and",
    "pale grey-green, partly cropped by the right and bottom edges. The lower 30% of the image is calm cream",
    "space apart from those ribbons. No other objects.",
    "Style: clean, bright, minimal premium 3D render for a technology brand's Instagram carousel slide, portrait",
    "orientation. Absolutely no purple, violet, pink, blue or cyan anywhere.",
  ].join(" ")],
];

/** Escena primero (incluye su estilo) y la regla de texto al final. */
export function prompt(escena, reglaTexto) {
  return [escena, reglaTexto].join(" ");
}
