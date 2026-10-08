import type { Page } from "playwright-core";
import * as path from "node:path";
import { FlowError } from "./types.js";
import { M } from "./i18n.js";

/**
 * IMÁGENES DE REFERENCIA
 *
 * Flow no acepta un archivo directamente en el compositor: primero sube a la
 * biblioteca del proyecto y después se elige desde ahí. Las dos cosas pasan en el
 * panel de ingredientes, el que abre el botón `add` que está debajo del
 * compositor:
 *
 *   1. subir   -> "Cargar contenido multimedia" dentro del panel
 *   2. adjuntar-> marcar la fila de la biblioteca y confirmar con el botón ancho
 *                 del panel ("Agregar a la instrucción")
 *
 * Todo se ubica por anclas que no dependen del idioma de la cuenta: la clase
 * `panels-layout` del panel, las filas `role=option` con `aria-selected`, y las
 * ligaduras de ícono de Material (`add`/`close`, `upload`), que son el texto del
 * botón en cualquier idioma.
 */

const PANEL = ".panels-layout";

/** Los eventos sintéticos no los levanta Angular; hace falta puntero real. */
async function clickAt(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.waitForTimeout(80);
  await page.mouse.click(x, y);
}

/** ¿Quedó alguna imagen adjunta al compositor? */
function composerHasImage(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const comp = [...document.querySelectorAll('[contenteditable="true"]')]
      .filter((e) => (e as HTMLElement).offsetParent)
      .pop();
    let z: HTMLElement | null = comp as HTMLElement | null;
    for (let i = 0; i < 7 && z; i++) {
      if (z.querySelectorAll("img").length > 0) return true;
      z = z.parentElement;
    }
    return false;
  });
}

/**
 * El botón que abre y cierra el panel de ingredientes.
 *
 * Arriba de la página hay otro botón con la misma ligadura `add` (el menú de
 * contenido multimedia), así que no alcanza con el texto: se toma el más cercano
 * al compositor. Su ligadura dice en qué estado está el panel: `add` cerrado,
 * `close` abierto.
 */
function ingredientsToggle(page: Page): Promise<{ cx: number; cy: number; open: boolean } | null> {
  return page.evaluate(() => {
    const comp = [...document.querySelectorAll('[contenteditable="true"]')]
      .filter((e) => (e as HTMLElement).offsetParent)
      .pop();
    if (!comp) return null;
    const rc = comp.getBoundingClientRect();
    const cands = [...document.querySelectorAll("button")]
      .filter((b) => (b as HTMLElement).offsetParent && /^(add|close)$/.test((b.innerText || "").trim()))
      .map((b) => {
        const r = b.getBoundingClientRect();
        const cx = r.x + r.width / 2;
        const cy = r.y + r.height / 2;
        return { cx, cy, open: (b.innerText || "").trim() === "close", d: Math.hypot(cx - rc.x, cy - (rc.y + rc.height)) };
      })
      .sort((a, b) => a.d - b.d);
    const hit = cands[0];
    return hit && hit.d < 250 ? { cx: hit.cx, cy: hit.cy, open: hit.open } : null;
  });
}

/**
 * Abre el panel de ingredientes y espera a que esté de verdad abierto.
 *
 * Justo después de una recarga el clic puede llegar antes de que Angular ate los
 * manejadores y no pasa nada, así que se verifica el panel y se reintenta en vez
 * de confiar en una espera fija.
 */
async function openIngredients(page: Page): Promise<void> {
  await page.waitForSelector('[contenteditable="true"]', { timeout: 30_000 }).catch(() => {});
  for (let intento = 0; intento < 12; intento++) {
    if (await page.$(`${PANEL} [role=listbox]`)) return;
    const boton = await ingredientsToggle(page);
    // Con la biblioteca vacía (proyecto nuevo) el panel abre sin lista: vale
    // lo que dice el botón.
    if (boton?.open) return;
    if (!boton) {
      await page.waitForTimeout(1_000);
      continue;
    }
    if (!boton.open) await clickAt(page, boton.cx, boton.cy);
    await page.waitForTimeout(1_500);
  }
  throw new FlowError(M.noAttachControl());
}

/**
 * Cierra el panel de ingredientes.
 *
 * Abierto tapa la barra del compositor: el clic para abrir la configuración de
 * aspecto cae sobre el panel y parece que la configuración "no abre".
 */
async function closeIngredients(page: Page): Promise<void> {
  const boton = await ingredientsToggle(page);
  if (!boton?.open) return;
  await clickAt(page, boton.cx, boton.cy);
  await page.waitForTimeout(800);
}

/**
 * Escribe en el buscador del panel. Se busca SIN la extensión: con ".png" el
 * filtro no devuelve nada aunque la fila se llame exactamente así.
 */
async function filterLibrary(page: Page, texto: string): Promise<void> {
  const buscador = await page.$(`${PANEL} input:not([type=file])`);
  if (!buscador) return;
  await buscador.click();
  await buscador.fill("");
  if (texto) await buscador.fill(texto);
  await page.waitForTimeout(1_500);
}

/**
 * Filas de la biblioteca con ese nombre de archivo, de arriba abajo (la de más
 * arriba es la más reciente). El texto de la fila es el nombre seguido del tipo
 * ("foto.png Imagen"), así que se compara el comienzo.
 */
function rowsNamed(page: Page, fileName: string) {
  return page.evaluate(
    ({ panel, n }) =>
      [...document.querySelectorAll(`${panel} [role=option]`)]
        .filter((o) => {
          if (!(o as HTMLElement).offsetParent) return false;
          const t = ((o as HTMLElement).innerText || "").trim().replace(/\s+/g, " ");
          return t === n || t.startsWith(n + " ");
        })
        .map((o) => {
          const r = o.getBoundingClientRect();
          const img = o.querySelector("img") as HTMLImageElement | null;
          return {
            cx: r.x + r.width / 2,
            cy: r.y + r.height / 2,
            selected: o.getAttribute("aria-selected") === "true",
            ready: !!img && img.complete && img.naturalWidth > 0,
          };
        })
        .sort((a, b) => a.cy - b.cy),
    { panel: PANEL, n: fileName },
  );
}

/** ¿Hay en la biblioteca del proyecto una imagen con ese nombre de archivo? */
export async function isInLibrary(page: Page, fileName: string): Promise<boolean> {
  await page.bringToFront();
  await openIngredients(page);
  await filterLibrary(page, fileName.replace(/\.[a-z0-9]+$/i, ""));
  const hay = (await rowsNamed(page, fileName)).length > 0;
  await filterLibrary(page, "");
  await closeIngredients(page);
  return hay;
}

/** ¿Está abierto el aviso de derechos que Flow muestra al subir una imagen? */
function rightsNoticeOpen(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    [...document.querySelectorAll("body *")].some(
      (e) =>
        (e as HTMLElement).offsetParent !== null &&
        e.children.length === 0 &&
        /^(derechos para usar esta imagen|rights to use this image)/i.test(((e as HTMLElement).innerText || "").trim()),
    ),
  );
}

/** Sube un archivo local a la biblioteca del proyecto. */
export async function uploadImage(page: Page, filePath: string): Promise<{ fileName: string }> {
  const fileName = path.basename(filePath);
  await page.bringToFront();
  await openIngredients(page);
  await filterLibrary(page, "");
  const antes = (await rowsNamed(page, fileName)).length;

  // Flow crea el <input type=file> recién al pulsar "Cargar". Se escucha el
  // selector de archivos antes del clic: así Playwright lo intercepta y el
  // diálogo del sistema no llega a abrirse. Si igual no se dispara, se escribe
  // directo en el input que quedó en el DOM.
  let input = await page.$('input[type="file"]');
  if (!input) {
    const boton = await page.evaluate((panel) => {
      const b = [...document.querySelectorAll(`${panel} button`)].find(
        (x) => (x as HTMLElement).offsetParent && /^upload\b/.test(((x as HTMLElement).innerText || "").trim()),
      );
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    }, PANEL);
    if (!boton) throw new FlowError(M.noFileInput(), M.noFileInputHint());

    const selector = page.waitForEvent("filechooser", { timeout: 8_000 }).catch(() => null);
    await clickAt(page, boton.cx, boton.cy);
    const chooser = await selector;
    if (chooser) {
      await chooser.setFiles(filePath);
    } else {
      input = await page.waitForSelector('input[type="file"]', { state: "attached", timeout: 5_000 }).catch(() => null);
      if (!input) throw new FlowError(M.noFileInput(), M.noFileInputHint());
    }
  }
  if (input) await input.setInputFiles(filePath);

  // Terminó cuando aparece una fila nueva con ese nombre y su miniatura cargó:
  // mientras sube, la fila existe pero todavía sin imagen.
  for (let i = 0; i < 120; i++) {
    const filas = await rowsNamed(page, fileName);
    if (filas.length > antes && filas[0]?.ready) {
      // Abierto tapa la barra del compositor y el botón de ajustes.
      await closeIngredients(page);
      return { fileName };
    }
    // A veces Flow frena la subida con un aviso de derechos sobre la imagen
    // ("Acepto"/"Cancelar"). Aceptar condiciones le toca a la persona, no a
    // este servidor: se avisa en vez de esperar dos minutos a ciegas.
    if (await rightsNoticeOpen(page)) throw new FlowError(M.rightsNotice(fileName), M.rightsNoticeHint());
    await page.waitForTimeout(1_000);
  }
  throw new FlowError(M.uploadUnconfirmed(fileName), M.uploadUnconfirmedHint());
}

/**
 * Adjunta al compositor una imagen que ya está en la biblioteca, buscándola por
 * el nombre de archivo con el que se subió.
 */
export async function attachReference(page: Page, fileName: string): Promise<void> {
  await page.bringToFront();
  await openIngredients(page);

  if (!(await pickInOpenPanel(page, fileName))) {
    await filterLibrary(page, "");
    await closeIngredients(page);
    throw new FlowError(M.notInLibrary(fileName), M.notInLibraryHint());
  }

  const ok = await composerHasImage(page);
  await filterLibrary(page, "").catch(() => {});
  await closeIngredients(page);
  if (!ok) throw new FlowError(M.notAttached(fileName), M.notAttachedHint());
}

/**
 * Con el panel de la biblioteca ya abierto, marca la fila de ese archivo y
 * confirma. Devuelve false si la fila no aparece.
 *
 * Es el mismo panel para adjuntar referencias y para elegir los fotogramas de un
 * video; lo que cambia es qué botón lo abrió.
 */
async function pickInOpenPanel(page: Page, fileName: string): Promise<boolean> {
  // La biblioteca crece con cada generación y el panel sólo dibuja las filas
  // visibles, así que se filtra por nombre en vez de buscar a ojo.
  await filterLibrary(page, fileName.replace(/\.[a-z0-9]+$/i, ""));

  let filas = await rowsNamed(page, fileName);
  for (let i = 0; !filas.length && i < 15; i++) {
    await page.waitForTimeout(1_000);
    filas = await rowsNamed(page, fileName);
  }
  const fila = filas[0];
  if (!fila) return false;

  // La fila es un toggle: si quedó marcada de un intento anterior, un clic la
  // DESmarca. Se clickea sólo si no está marcada y se verifica el resultado.
  if (!fila.selected) {
    await clickAt(page, fila.cx, fila.cy);
    await page.waitForTimeout(800);
  }

  // Marcar la fila no adjunta nada: falta el botón de confirmar. No tiene ícono
  // ni atributo estable y su texto está en el idioma de la cuenta; lo que lo
  // distingue es que es el botón más ancho del panel.
  const confirmar = await page.evaluate((panel) => {
    const cands = [...document.querySelectorAll(`${panel} button:not([role=option])`)]
      .filter((b) => (b as HTMLElement).offsetParent && !/^(upload|close|add)\b/.test(((b as HTMLElement).innerText || "").trim()))
      .map((b) => {
        const r = b.getBoundingClientRect();
        return { ancho: r.width, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      })
      .sort((a, b) => b.ancho - a.ancho);
    return cands[0] && cands[0].ancho >= 160 ? cands[0] : null;
  }, PANEL);
  if (confirmar) {
    await clickAt(page, confirmar.cx, confirmar.cy);
    await page.waitForTimeout(2_000);
  }
  return true;
}

/**
 * FOTOGRAMAS DE UN VIDEO
 *
 * En modo video con "Fotogramas", junto al compositor aparecen dos ranuras
 * (inicial y final) separadas por el botón de intercambiarlas, cuya ligadura
 * `swap_horiz` es la única ancla que no depende del idioma: la ranura inicial es
 * el botón más cercano a su izquierda y la final, a su derecha. Cada ranura abre
 * el mismo panel de biblioteca que las referencias.
 */
export type FrameSlot = "start" | "end";

function frameSlot(page: Page, slot: FrameSlot): Promise<{ cx: number; cy: number; filled: boolean } | null> {
  return page.evaluate((slot) => {
    const vis = (e: Element) => (e as HTMLElement).offsetParent !== null;
    const swap = [...document.querySelectorAll("button")].find(
      (b) => vis(b) && ((b as HTMLElement).innerText || "").trim() === "swap_horiz",
    );
    if (!swap) return null;
    const rs = swap.getBoundingClientRect();
    const cy = rs.y + rs.height / 2;
    const cands = [...document.querySelectorAll("button, [role=button]")]
      .filter((b) => vis(b) && b !== swap)
      .map((b) => ({ b, r: b.getBoundingClientRect() }))
      // Misma fila que el botón de intercambio.
      .filter(({ r }) => Math.abs(r.y + r.height / 2 - cy) < 30)
      .filter(({ r }) => (slot === "start" ? r.x + r.width <= rs.x + 2 : r.x >= rs.x + rs.width - 2))
      .sort((a, b) =>
        slot === "start" ? b.r.x - a.r.x : a.r.x - b.r.x,
      );
    const hit = cands[0];
    if (!hit) return null;
    return {
      cx: hit.r.x + hit.r.width / 2,
      cy: hit.r.y + hit.r.height / 2,
      filled: hit.b.querySelectorAll("img").length > 0,
    };
  }, slot);
}

/**
 * Pone como fotograma inicial o final una imagen que ya está en la biblioteca.
 * Hace falta que el panel de ajustes esté en modo video con "Fotogramas".
 */
export async function setFrame(page: Page, slot: FrameSlot, fileName: string): Promise<void> {
  await page.bringToFront();
  const ranura = await frameSlot(page, slot);
  if (!ranura) throw new FlowError(M.noFrameSlot(), M.noFrameSlotHint());

  await clickAt(page, ranura.cx, ranura.cy);
  let abierto = false;
  for (let i = 0; i < 10 && !abierto; i++) {
    await page.waitForTimeout(700);
    abierto = !!(await page.$(`${PANEL} [role=option]`));
  }
  if (!abierto) throw new FlowError(M.noFrameSlot(), M.noFrameSlotHint());

  const elegido = await pickInOpenPanel(page, fileName);
  if (!elegido) {
    await page.keyboard.press("Escape");
    throw new FlowError(M.notInLibrary(fileName), M.notInLibraryHint());
  }

  // El panel se cierra solo al confirmar; si quedó abierto, se cierra.
  if (await page.$(`${PANEL} [role=option]`)) await page.keyboard.press("Escape");
  await page.waitForTimeout(800);

  const despues = await frameSlot(page, slot);
  if (!despues?.filled) throw new FlowError(M.frameNotSet(fileName), M.notAttachedHint());
}

/**
 * Deja el compositor sin referencias.
 *
 * Es obligatorio antes de cada generación: una referencia olvidada de un turno
 * anterior cambia la imagen sin que nada lo indique, y el resultado se atribuye
 * al prompt. Recargar es tosco pero es lo único que garantiza el estado limpio
 * sin depender de encontrar el botón de quitar, que no siempre está.
 */
export async function clearReferences(page: Page): Promise<void> {
  if (!(await composerHasImage(page))) return;

  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[contenteditable="true"]', { timeout: 60_000 });
  await page.waitForTimeout(1_500);
}
