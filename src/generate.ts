import type { Page } from "playwright-core";
import { config } from "./config.js";
import { getFlowTab } from "./browser.js";
import {
  applySettings,
  applyVideoSettings,
  closeSettings,
  submitPrompt,
  type VideoAspect,
  type VideoModel,
} from "./ui.js";
import { attachReference, clearReferences, setFrame, uploadImage } from "./reference.js";
import { FlowError, type Aspect, type GeneratedImage, type GeneratedVideo } from "./types.js";
import { M } from "./i18n.js";

/**
 * DE DÓNDE SALE EL RESULTADO
 *
 * Hasta la migración a flow.google.com (frontend Angular) el resultado se leía de
 * la respuesta de red `flowMedia:batchGenerateImages`, que traía id firmado y
 * dimensiones en JSON limpio. Esa llamada ya no existe: ahora todo va por el RPC
 * ofuscado `batchexecute`, impráctico de parsear.
 *
 * Así que cosechamos del DOM. Cada imagen generada aparece como un <img> cuyo src
 * es `https://flow-content.google/image/<uuid>?Expires=…&Signature=…`, con el
 * tamaño nativo en naturalWidth/Height y la URL ya firmada (se baja sin auth, y
 * como comparte el tarro de cookies del navegador no la frena CORS). Tomamos una
 * foto de los ids presentes ANTES de enviar y esperamos a que aparezcan los
 * nuevos. Es estable entre idiomas e independiente del transporte interno.
 */
const MEDIA_RE = /flow-content\.google\/image\/([0-9a-f-]{36})/i;

interface DomMedia {
  id: string;
  src: string;
  width: number;
  height: number;
}

/** Todos los medios `flow-content` presentes ahora, el de mayor resolución por id. */
export async function snapshotMedia(page: Page): Promise<Map<string, DomMedia>> {
  const list = await page.evaluate((reSrc) => {
    const re = new RegExp(reSrc, "i");
    const out: { id: string; src: string; width: number; height: number }[] = [];
    for (const im of Array.from(document.images)) {
      const src = im.currentSrc || im.src || "";
      const m = re.exec(src);
      if (!m) continue;
      out.push({ id: m[1]!, src, width: im.naturalWidth || 0, height: im.naturalHeight || 0 });
    }
    return out;
  }, MEDIA_RE.source);

  const map = new Map<string, DomMedia>();
  for (const it of list) {
    const prev = map.get(it.id);
    if (!prev || it.width * it.height > prev.width * prev.height) map.set(it.id, it);
  }
  return map;
}

/** Tras un rato con al menos una imagen nueva pero sin llegar a todas, se entrega. */
const SILENCIO_MS = 15_000;

/**
 * Espera a que aparezcan `esperadas` imágenes nuevas respecto de `antes`. Corta
 * por cualquiera de tres vías: llegaron todas, pasó un rato con algunas sin
 * novedad, o se agotó el tiempo. Nunca descarta lo ya visto.
 */
export async function collectFromDom(
  page: Page,
  antes: Set<string>,
  esperadas: number,
  aspect: string,
  timeoutMs: number,
): Promise<GeneratedImage[]> {
  const t0 = Date.now();
  let primeraNueva = 0;
  const nuevas = new Map<string, DomMedia>();

  while (Date.now() - t0 < timeoutMs) {
    const actual = await snapshotMedia(page);
    for (const [id, m] of actual) {
      // Sólo ids nuevos y con la imagen ya cargada (naturalWidth real, no el
      // placeholder de 0 ancho).
      if (!antes.has(id) && m.width > 200 && !nuevas.has(id)) {
        nuevas.set(id, m);
        if (primeraNueva === 0) primeraNueva = Date.now();
      }
    }
    if (nuevas.size >= esperadas) break;
    if (primeraNueva && Date.now() - primeraNueva > SILENCIO_MS) break;
    await page.waitForTimeout(1500);
  }

  return [...nuevas.values()].slice(0, esperadas).map((m) => ({
    mediaId: m.id,
    width: m.width,
    height: m.height,
    aspect,
    seed: null,
    signedUrl: m.src,
    effectivePrompt: null,
  }));
}

export interface GenerateOptions {
  prompt: string;
  aspect: Aspect;
  count: number;
  /** Techo de costo. Por defecto el del entorno, que es 0 = solo gratis. */
  maxCost?: number;
  timeoutMs?: number;
  /**
   * Pestaña donde generar. Si se omite se usa la primera de Flow que aparezca.
   *
   * Pasarla explícitamente es lo que permite generar en paralelo: el compositor
   * es un único elemento por pestaña, así que dos generaciones en la misma se
   * pisan escribiendo el prompt. Con una pestaña por hilo cada una vigila su
   * propio DOM y no hay ambigüedad sobre qué imagen es de quién.
   */
  page?: Page;
  /**
   * Rutas locales de imágenes a usar como referencia. Se suben a la biblioteca
   * del proyecto y se adjuntan al compositor antes de enviar el prompt.
   *
   * Cambian lo que hace el prompt: con una referencia adjunta Flow parte de esa
   * imagen en vez de partir de cero, así que el texto pasa a describir qué
   * cambiar y no qué crear.
   */
  referenceImages?: string[];
  /**
   * Nombres de archivos que YA están en la biblioteca del proyecto, para
   * adjuntarlos sin volver a subirlos. Subir dos veces el mismo archivo sólo
   * deja filas duplicadas y hace más lenta cada iteración.
   */
  referenceLibraryNames?: string[];
}

export interface GenerateResult {
  images: GeneratedImage[];
  quotedCost: number | null;
  quoteText: string;
  page: Page;
}

export interface StartedGeneration {
  /** Se resuelve cuando llegan las imágenes. Rechaza si no llegó ninguna. */
  harvest: Promise<GeneratedImage[]>;
  quotedCost: number | null;
  quoteText: string;
  page: Page;
}

/**
 * Deja una generación EN VUELO y devuelve sin esperarla.
 *
 * La separación en dos fases existe por cómo trata Chrome a las pestañas de
 * fondo: les congela requestAnimationFrame, así que la interfaz no responde.
 * Manipular la UI —y tomar la foto de los medios previos— exige la pestaña en
 * primer plano; la espera del resultado, en cambio, tolera la pestaña tapada.
 *
 * Entonces, para varias generaciones a la vez: la fase de UI —unos segundos por
 * pestaña— se hace de a una con `bringToFront`, y la cosecha —que es lo que de
 * verdad tarda— corre en paralelo para todas.
 */
export async function startGeneration(opts: GenerateOptions): Promise<StartedGeneration> {
  const maxCost = opts.maxCost ?? config.maxCost;
  const page = opts.page ?? (await getFlowTab()).page;

  // Una referencia olvidada de un turno anterior cambiaría la imagen sin que nada
  // lo indique. Se limpia siempre. Si la UI cambió y esto fallara, no debe tumbar
  // una generación sin referencias: se ignora.
  try {
    await clearReferences(page);
  } catch {
    /* sin referencias que limpiar, o la UI cambió: no es fatal */
  }

  for (const nombre of opts.referenceLibraryNames ?? []) {
    await attachReference(page, nombre);
  }
  for (const ruta of opts.referenceImages ?? []) {
    const { fileName } = await uploadImage(page, ruta);
    await attachReference(page, fileName);
  }

  const quote = await applySettings(page, { aspect: opts.aspect, count: opts.count });

  // El portón. Se cierra ANTES de enviar, que es el único momento en que negarse
  // todavía es gratis. Si el número no se pudo leer, no adivinamos: paramos.
  // (En modo imagen applySettings ya devuelve 0, que es lo real.)
  if (quote.cost === null) {
    await closeSettings(page);
    throw new FlowError(M.costUnreadable(), M.costUnreadableHint(quote.raw.slice(0, 200)));
  }
  if (quote.cost > maxCost) {
    await closeSettings(page);
    throw new FlowError(
      M.costTooHigh(quote.cost, maxCost),
      maxCost === 0 ? M.costTooHighHintZero() : M.costTooHighHint(),
    );
  }

  await closeSettings(page);

  // Foto de los medios presentes ANTES de enviar: lo nuevo es lo que sale de acá.
  // Se toma con la pestaña todavía en primer plano (fin de la fase de UI).
  const antes = new Set((await snapshotMedia(page)).keys());

  const timeout = opts.timeoutMs ?? config.generateTimeoutMs;
  const cosecha = collectFromDom(page, antes, opts.count, opts.aspect, timeout).then((images) => {
    if (images.length === 0) {
      throw new FlowError(M.noImages(), M.noImagesHint());
    }
    return images;
  });

  await submitPrompt(page, opts.prompt);

  return { harvest: cosecha, quotedCost: quote.cost, quoteText: quote.raw, page };
}

/**
 * VIDEO
 *
 * Mismo principio que las imágenes: foto de lo que hay antes de enviar y se
 * espera lo nuevo. Los videos terminados aparecen como <video> (o <source>) con
 * el archivo en `src`; el id es el uuid de la URL. Un video tarda minutos, no
 * segundos, y mientras se genera la baldosa no trae <video>.
 */
const UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export async function snapshotVideos(page: Page): Promise<Map<string, string>> {
  const list = await page.evaluate((reSrc) => {
    const re = new RegExp(reSrc, "i");
    const out: { id: string; src: string }[] = [];
    const srcs = [
      ...[...document.querySelectorAll("video")].map((v) => (v as HTMLVideoElement).currentSrc || (v as HTMLVideoElement).src),
      ...[...document.querySelectorAll("video source")].map((s) => (s as HTMLSourceElement).src),
    ];
    for (const src of srcs) {
      if (!src || src.startsWith("blob:")) continue;
      const m = re.exec(src);
      if (m) out.push({ id: m[1]!.toLowerCase(), src });
    }
    return out;
  }, UUID_RE.source);
  return new Map(list.map((v) => [v.id, v.src]));
}

/** Lo que hay de <video> en la página, para el mensaje de error si no se reconoce nada. */
function describeVideos(page: Page): Promise<string> {
  return page.evaluate(() =>
    [...document.querySelectorAll("video")]
      .map((v) => `${(v as HTMLVideoElement).currentSrc || (v as HTMLVideoElement).src || "(sin src)"}`.slice(0, 120))
      .join(" | ") || "(ningún <video>)",
  );
}

export interface VideoOptions {
  prompt: string;
  aspect: VideoAspect;
  model: VideoModel;
  count: number;
  resolution?: "360p" | "720p";
  duration?: 4 | 6 | 8 | 10;
  /** Techo de créditos para esta generación. Obligatorio: el video cuesta. */
  maxCost: number;
  /** Rutas locales de los fotogramas; se suben a la biblioteca. */
  startFrame?: string;
  endFrame?: string;
  /** Nombres de archivos que ya están en la biblioteca. */
  startFrameLibraryName?: string;
  endFrameLibraryName?: string;
  timeoutMs?: number;
  page?: Page;
}

export interface VideoResult {
  videos: GeneratedVideo[];
  quotedCost: number;
  page: Page;
}

export async function generateVideos(opts: VideoOptions): Promise<VideoResult> {
  const page = opts.page ?? (await getFlowTab()).page;
  await page.bringToFront();

  try {
    await clearReferences(page);
  } catch {
    /* sin referencias que limpiar, o la UI cambió: no es fatal */
  }

  // Primero subir: el panel de ingredientes tapa la barra del compositor y no
  // debe estar abierto mientras se configura.
  const inicio = opts.startFrame ? (await uploadImage(page, opts.startFrame)).fileName : opts.startFrameLibraryName;
  const fin = opts.endFrame ? (await uploadImage(page, opts.endFrame)).fileName : opts.endFrameLibraryName;

  const quote = await applyVideoSettings(page, {
    aspect: opts.aspect,
    model: opts.model,
    count: opts.count,
    resolution: opts.resolution,
    duration: opts.duration,
  });

  // El portón, igual que en las imágenes: se cierra ANTES de enviar. Si el
  // costo no se pudo leer, no se adivina.
  if (quote.cost === null) {
    await closeSettings(page);
    throw new FlowError(M.costUnreadable(), M.costUnreadableHint(quote.raw.slice(0, 200)));
  }
  if (quote.cost > opts.maxCost) {
    await closeSettings(page);
    throw new FlowError(M.costTooHigh(quote.cost, opts.maxCost), M.costTooHighHint());
  }
  await closeSettings(page);

  if (inicio) await setFrame(page, "start", inicio);
  if (fin) await setFrame(page, "end", fin);

  const antes = new Set((await snapshotVideos(page)).keys());
  await submitPrompt(page, opts.prompt);

  const timeout = opts.timeoutMs ?? Math.max(config.generateTimeoutMs, 600_000);
  const t0 = Date.now();
  const nuevos = new Map<string, string>();
  let primero = 0;
  while (Date.now() - t0 < timeout) {
    for (const [id, src] of await snapshotVideos(page)) {
      if (!antes.has(id) && !nuevos.has(id)) {
        nuevos.set(id, src);
        if (!primero) primero = Date.now();
      }
    }
    if (nuevos.size >= opts.count) break;
    if (primero && Date.now() - primero > 60_000) break;
    await page.waitForTimeout(3_000);
  }

  if (nuevos.size === 0) {
    throw new FlowError(M.noVideos(Math.round(timeout / 60_000)), M.noVideosHint(await describeVideos(page)));
  }
  return {
    videos: [...nuevos].slice(0, opts.count).map(([mediaId, src]) => ({ mediaId, src })),
    quotedCost: quote.cost,
    page,
  };
}

export async function generateImages(opts: GenerateOptions): Promise<GenerateResult> {
  const started = await startGeneration(opts);
  const images = await started.harvest;
  return { images, quotedCost: started.quotedCost, quoteText: started.quoteText, page: started.page };
}
