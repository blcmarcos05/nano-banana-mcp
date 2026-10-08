/**
 * Carrusel de Instagram de Repano: 8 slides, 4:5 (1080x1350), sin texto.
 *
 * Flow no tiene 4:5 nativo -> se genera en 3:4 y se recorta a 1080x1350.
 *
 * Las referencias se suben y adjuntan con src/reference.ts, el mismo módulo
 * que usa el servidor MCP.
 */
import { readStatus, getFlowTab } from "./dist/browser.js";
import { snapshotMedia, collectFromDom } from "./dist/generate.js";
import { applySettings, closeSettings, submitPrompt } from "./dist/ui.js";
import { attachReference, clearReferences, isInLibrary, uploadImage } from "./dist/reference.js";
import { fetchMedia } from "./dist/download.js";
import { writeImage } from "./dist/image.js";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const REF = process.env.REPANO_REF;
const OUT = process.env.REPANO_OUT;
const REF_NAME = REF ? path.basename(REF) : null;
/** Slide ya aprobada que se adjunta en todas para anclar fondo, luz y badge. */
const ESTILO_REF = process.env.REPANO_ESTILO;
const ESTILO_NAME = ESTILO_REF ? path.basename(ESTILO_REF) : null;
/**
 * Guion de otro carrusel: un módulo que exporta SLIDES, prompt(escena, reglaTexto)
 * y alto. Sin él, se usan las slides y los prompts de este archivo.
 */
const GUION = process.env.REPANO_GUION
  ? await import(pathToFileURL(path.resolve(process.env.REPANO_GUION)).href)
  : null;
const SOLO = process.env.REPANO_SOLO ? process.env.REPANO_SOLO.split(",") : null;

/** Se antepone sólo cuando hay una slide ya aprobada adjunta como ancla. */
const ANCLA = [
  "Match the attached style reference image exactly: same background color and tone, same lighting",
  "direction and softness, same glossy plastic material, same shadow. Only the subject changes.",
  "These slides are seen side by side in a carousel, so any drift is visible.",
].join(" ");

/** Común a las siete: fondo, luz y paleta. Nada de material ni de encuadre. */
const FONDO = [
  "Style: clean, minimal, premium 3D render for an Instagram carousel slide, portrait orientation,",
  "lit by soft diffuse studio light from the upper left, with a soft natural contact shadow.",
  "Background: ONE single flat warm cream color (#F5F4EF) covering the whole canvas edge to edge,",
  "perfectly uniform and seamless. No color blocking, no panels, no vertical or horizontal divider,",
  "no band or stripe of a different shade, no floor line, no horizon, no gradient, no pattern, no border.",
  "Color palette strictly limited to cream white (#F5F4EF), amber (#E59A3A), deep green (#183C35),",
  "grey-green (#71877E) and charcoal (#0D0D0D). High detail.",
].join(" ");

/**
 * Sólo para las slides de objetos. Separado del fondo porque, puesto en un
 * prompt común, el modelo le aplicaba el plástico crema también a la mascota.
 */
const OBJETOS = [
  "The objects are chunky 3D icons made of smooth semi-glossy plastic with thick rounded bevels,",
  "floating in mid-air, tilted in a gentle three-quarter perspective. They are mostly cream white with",
  "amber as the single accent; neutral UI details (placeholder bars, dots, secondary buttons) are grey-green.",
  "Framing: the object group sits in the RIGHT 55% of the frame, vertically centered, spanning about",
  "50% of the image height and at most 52% of the image width, its right edge about 6% of the width",
  "away from the right border. The whole object is visible and nothing is cropped by the canvas edge.",
  "The left side of the frame has no objects on it: the same uninterrupted cream background, left",
  "empty as negative space for copy. It is NOT a separate panel or column.",
].join(" ");

/**
 * El disco ámbar del encabezado NO se genera acá: pedido al modelo sale de un
 * tamaño y una posición distintos en cada slide, y puestas en fila el salto se
 * nota. Se compone después por código, idéntico en las siete.
 */
const SIN_BADGE =
  "Do not add any circular icon badge, emblem, sticker or floating logo mark anywhere in the frame; the empty area stays completely empty.";

const TEXTO_UI = [
  "The only text allowed is the short SPANISH text written inside the UI mockups described in the scene:",
  "render it exactly as written, in a clean geometric sans-serif, correctly spelled Spanish.",
  "No headline, no slogan, no caption, no logo and no watermark anywhere in the image.",
].join(" ");

const SIN_TEXTO = "ABSOLUTELY NO TEXT, no letters, no numbers, no words, no logos and no watermarks anywhere in the image.";

// La mascota sólo va en la portada y en el cierre, igual que el robot en la
// referencia: las slides del medio son objetos 3D solos.
/**
 * Deliberadamente corto. Describir la geometría con palabras compite con la
 * imagen adjunta y el modelo termina rediseñando: la capucha se volvió un
 * casco con orejas, la cara un rectángulo hundido, las patas dientes finos.
 * La referencia ya dice cómo es el personaje; el prompt sólo dice qué hace.
 */
const MASCOTA = [
  "The character is the mascot in the attached reference image, reproduced EXACTLY as it appears there:",
  "identical silhouette, identical hood shape, identical face shape, identical legs, identical colors.",
  "Copy it faithfully — do not redesign, restyle, simplify or reinterpret any part of it.",
  "Only its pose and the camera angle may change. Ignore the dark background of the reference photo:",
  "the character stands on the cream background of this slide.",
  "COLORS OF THE CHARACTER, keep them exactly as in the reference: the faceted hood and the legs are",
  "matte deep forest green (#183C35), the face area under the hood is near-black charcoal (#0D0D0D),",
  "and the two crescent eyes glow warm amber (#E59A3A). Its material is the same as in the reference:",
  "soft matte, slightly textured, like painted stone or clay, with crisp low-poly facets. It is not glossy",
  "plastic and it is never cream, white or light colored.",
].join(" ");

const SLIDES = [
  ["01-portada", MASCOTA, SIN_TEXTO, "The mascot is placed in the BOTTOM-RIGHT of the frame, turned slightly toward the left in a gentle three-quarter view, facing the viewer with a friendly expression. Its whole hood and glowing face are fully inside the frame, with a clear cream margin of about 6% of the image width between the hood and the RIGHT border; nothing touches or crosses the right edge or the top. Only the bottom of its body and its legs are cut off by the BOTTOM border, as if it is peeking up from below. It spans about 45% of the image width and the lower 35% of the image height. It is a real sculpted 3D object with volume: soft shading across the facets, subtle ambient occlusion, and a soft shadow on the cream background behind it. No outline, no sticker border, no light halo or cut-out edge around its silhouette. Everything else, the whole upper two thirds and the left side, is empty cream negative space reserved for a large headline."],
  ["02-mensajes", "", TEXTO_UI, `Three floating rounded 3D chat bubbles with thick soft bevels, stacked vertically and slightly tilted. Top, offset to the left: a cream-white bubble with the Spanish text "¡Hola! Tengo una pregunta." in charcoal. Middle, offset to the right and overlapping it: an amber bubble with the Spanish text "¡Hola!" followed by a small waving-hand emoji, then on the next lines "¿En qué puedo ayudarte?", in white, spelled with the opening inverted marks and the accent on "qué". Bottom, offset to the left: a small cream-white bubble holding three grey-green typing dots. No character in this image.`],
  ["03-citas", "", SIN_TEXTO, `A single 3D desk calendar standing at a three-quarter angle: cream-white body, a thick amber top band with three metal spiral rings, and a grid of plain rounded cream squares, one of them an amber square with a white checkmark. No character in this image.`],
  ["04-prospectos", "", SIN_TEXTO, `A floating 3D form card standing at a three-quarter angle, cream-white with thick bevels: a grey-green user avatar in a rounded square at the top with two short grey-green placeholder bars beside it, then three rows of grey-green placeholder bars each with a charcoal checkmark to its left, and a wide amber rounded button at the bottom that is completely blank with no label on it. No character in this image.`],
  ["05-seguimiento", "", TEXTO_UI, `Top: a large 3D open amber envelope with a cream letter card emerging from it; the card shows a small amber user avatar and grey-green placeholder lines, and an amber circular checkmark badge on its top-right corner. Below the envelope, a vertical amber dotted line connects three small floating cream cards stacked downward, each with a tiny amber icon on the left and a two-line Spanish label: the top card reads "Correo enviado" with "Día 1" underneath, the middle card reads "Mensaje de seguimiento" with "Día 3" underneath, the bottom card reads "Recordatorio final" with "Día 7" underneath. No character in this image.`],
  ["06-recordatorios", "", TEXTO_UI, `A large 3D smartphone standing at a three-quarter angle with a cream screen. A big glossy amber bell with small sound-wave arcs floats at the top of the phone. On the screen, three stacked rounded reminder rows, each with a tiny amber icon and a two-line Spanish label: "Seguimiento con Juan" / "Hoy, 10:00 a. m."; "Contactar a Sara" / "Mañana, 2:00 p. m."; "Actualización del proyecto" / "Viernes, 11:00 a. m.". In the lower-left foreground, a small floating cream card reads the Spanish text "¡Recordatorio enviado!" with an amber circular checkmark, connected to the phone by a thin amber dotted curved arrow. No character in this image.`],
  ["07-247", MASCOTA, `The ONLY text in the whole image is the characters "24/7" inside the loop, in a clean bold geometric sans-serif, all in one solid dark charcoal color. No other text, no labels, no cards, no UI panels, no logos, no watermarks anywhere.`, `Exactly TWO objects in the frame and nothing else. First, the mascot, whole and fully visible, in the RIGHT half of the frame and slightly above center, in a gentle three-quarter view facing the viewer with a happy expression. It wears sleek amber over-ear headphones: the headband goes over the top of its green hood and an amber ear cup sits on each side of the hood, with a small amber boom microphone curving toward its face. The mascot spans about 45% of the image width, with a clear cream margin of about 6% of the width between it and the right border. Second, one glossy 3D amber circular arrow loop, about a third of the mascot's width, floating in front of the mascot's lower-right, partly overlapping its body and legs, with the characters "24/7" inside it. All four characters "2", "4", "/" and "7" are the same single solid dark charcoal color (#0D0D0D), bold and clearly legible against the cream space inside the ring; none of them is amber, and the text does not blend into the ring. The mascot is a real sculpted 3D object with volume, soft shading across its facets and a soft shadow on the cream background; no outline, no sticker border and no light halo around its silhouette. No cards, no phones, no chat bubbles, no extra props. The left half of the frame stays completely empty cream space.`],
];

const status = await readStatus();
console.log("estado:", status.signedIn, status.projectId);
if (!status.projectId) {
  console.error("No hay proyecto de Flow abierto.");
  process.exit(1);
}
const { page } = await getFlowTab();

/** Sube un archivo a la biblioteca del proyecto, si no estaba ya: duplicarlo sólo ensucia la biblioteca. */
async function subirReferencia(ruta) {
  const nombre = path.basename(ruta);
  if (await isInLibrary(page, nombre)) {
    console.log(`${nombre}: ya estaba en la biblioteca`);
    return;
  }
  await uploadImage(page, ruta);
}

const composerHasImage = () =>
  page.evaluate(() => {
    const c = [...document.querySelectorAll('[contenteditable="true"]')].filter((e) => e.offsetParent).pop();
    let z = c;
    for (let i = 0; i < 7 && z; i++) {
      if (z.querySelectorAll("img").length) return true;
      z = z.parentElement;
    }
    return false;
  });

if (!process.env.REPANO_ADJUNTO && REF) await subirReferencia(REF);
if (ESTILO_REF) await subirReferencia(ESTILO_REF);

let primera = true;
/** Nombre en la biblioteca de la slide que sirve de vara de estilo. */
let ancla = ESTILO_NAME;

for (const [slug, mascota, reglaTexto, escena] of GUION?.SLIDES ?? SLIDES) {
  if (SOLO && !SOLO.includes(slug)) continue;

  // Encadenar generaciones sin respiro es el patrón más obvio de automatización.
  // El intervalo se sortea para que tampoco sea un ritmo fijo.
  if (!primera) {
    const espera = 60 + Math.floor(Math.random() * 60);
    console.log(`\n(pausa de ${espera}s)`);
    await page.waitForTimeout(espera * 1_000);
  }
  primera = false;

  const t0 = Date.now();
  console.log(`\n== ${slug} ==`);

  // Se reintenta el slide entero: si la página recarga a mitad de la cosecha,
  // el contexto de evaluate muere y no hay forma de retomar por la mitad.
  for (let intento = 1; ; intento++) {
    try {
      await generarSlide(slug, mascota, reglaTexto, escena, t0);
      break;
    } catch (err) {
      if (intento >= 3) throw err;
      console.log(`  reintento ${intento}: ${err.message.split("\n")[0]}`);
      await page.waitForTimeout(3_000);
    }
  }
}

async function generarSlide(slug, mascota, reglaTexto, escena, t0) {
  // Chrome congela el render de las pestañas de fondo: los clics se despachan
  // pero la app no los procesa, así que el prompt queda escrito y nunca se
  // envía. Toda la fase de UI necesita la pestaña al frente.
  await page.bringToFront();

  // Cada slide parte limpio: una referencia colgada del turno anterior
  // cambiaría la imagen sin que nada lo indique.
  //
  // Las dos referencias compiten: con el ancla de estilo adjunta, la mascota
  // pierde la silueta de dos picos y el verde se aclara. Así que cada slide
  // lleva una sola: el personaje donde aparece, el ancla donde no.
  // REPANO_ADJUNTO=1: la referencia ya la puso alguien a mano en el compositor.
  // No se toca nada — clearReferences recarga la página y la borraría.
  if (!process.env.REPANO_ADJUNTO) {
    await clearReferences(page);
    if (mascota) await attachReference(page, REF_NAME);
    else if (ancla) await attachReference(page, ancla);
  }
  // Con la referencia puesta a mano no hay cómo reponerla: si se soltó tras la
  // generación anterior, mejor parar que generar sin personaje.
  if (process.env.REPANO_ADJUNTO && !(await composerHasImage())) {
    throw new Error("La referencia adjunta a mano ya no está en el compositor");
  }

  await applySettings(page, { aspect: "3:4", count: 1 });
  await closeSettings(page);

  const antes = new Set((await snapshotMedia(page)).keys());
  const cosecha = collectFromDom(page, antes, 1, "3:4", 240_000);
  // Primero lo que hay en la imagen y después el estilo: lo que va al final
  // pesa menos, y el estilo común no debe ganarle a la mascota.
  const prompt = GUION ? GUION.prompt(escena, reglaTexto) : (
    mascota
      ? [mascota, `Scene: ${escena}`, FONDO, reglaTexto, SIN_BADGE]
      : [ancla ? ANCLA : "", `Scene: ${escena}`, OBJETOS, FONDO, reglaTexto, SIN_BADGE]
  )
    .filter(Boolean)
    .join(" ");
  await submitPrompt(page, prompt);
  const images = await cosecha;
  if (!images.length) throw new Error(`${slug}: no llegó ninguna imagen`);

  const bytes = await fetchMedia(page, images[0].mediaId, images[0].signedUrl);
  const res = await writeImage(bytes, path.join(OUT, `repano-${slug}.jpg`), {
    width: 1080,
    height: GUION?.alto ?? 1350,
    fit: "cover",
  });
  console.log(`OK  ${res.file}  ${res.width}x${res.height}  ${Math.round(res.bytes / 1024)} KB  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  // La primera slide de objetos pasa a ser la vara: las que siguen la llevan
  // adjunta para no derivar en fondo, luz ni material. Anclar contra una
  // imagen del mismo lote sale mejor que describir el estilo otra vez.
  // La imagen ya está guardada: si la subida del ancla falla, se sigue sin
  // ancla. Dejar que el error suba hacía que el reintento generara la slide
  // entera otra vez (y pisara el archivo) sólo por no poder subirla.
  if (!mascota && !ancla && !process.env.REPANO_ADJUNTO) {
    try {
      await uploadImage(page, res.file);
      ancla = path.basename(res.file);
      console.log(`  ancla de estilo: ${ancla}`);
    } catch (err) {
      console.log(`  sin ancla de estilo: ${err.message.split("\n")[0]}`);
    }
  }
}

console.log("\nlisto");
process.exit(0);
