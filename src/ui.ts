import type { Page } from "playwright-core";
import { ASPECTS, FlowError, type Aspect } from "./types.js";
import { M } from "./i18n.js";

export async function clickAt(page: Page, x: number, y: number): Promise<void> {
  await page.mouse.move(x, y);
  await page.waitForTimeout(80);
  await page.mouse.click(x, y);
}

interface Hit {
  text: string;
  aria: string;
  cx: number;
  cy: number;
}

async function visibleControls(page: Page): Promise<Hit[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('[role="tab"], button, [role="button"]')]
      .filter((el) => (el as HTMLElement).offsetParent)
      .map((el) => {
        const r = el.getBoundingClientRect();

        return {
          text: ((el as HTMLElement).innerText || "")
            .trim()
            .replace(/\s+/g, " "),
          aria: el.getAttribute("aria-label") || "",
          cx: r.x + r.width / 2,
          cy: r.y + r.height / 2,
        };
      }),
  );
}

async function settingsOpen(page: Page): Promise<boolean> {
  const controls = await visibleControls(page);

  const hayRecorte = controls.some(
    (c) => /^crop_/.test(c.text) || /crop_/.test(c.aria),
  );

  const hayCantidad = controls.some(
    (c) => /^x\d$/.test(c.text) || /\bx\d\b/.test(c.aria),
  );

  return hayRecorte && hayCantidad;
}

export async function openSettings(page: Page): Promise<void> {
  if (await settingsOpen(page)) return;

  const controls = await visibleControls(page);

  const trigger = controls.find(
    (c) =>
      (/crop_[0-9a-z]/i.test(c.text) || /crop_[0-9a-z]/i.test(c.aria)) &&
      (/(^|\s)x\d(\s|$)/i.test(c.text) || /\bx\d\b/i.test(c.aria)) &&
      !/^crop_/.test(c.text),
  );

  if (trigger) {
    await clickAt(page, trigger.cx, trigger.cy);
    await page.waitForTimeout(600);
  } else {
    throw new FlowError(
      M.noSettingsControl(),
      M.noSettingsControlHint(),
    );
  }

  if (!(await settingsOpen(page))) {
    throw new FlowError(M.settingsWontOpen());
  }
}

export async function closeSettings(page: Page): Promise<void> {
  if (!(await settingsOpen(page))) return;

  const controls = await visibleControls(page);

  const back = controls.find(
    (c) =>
      c.text === "arrow_back" ||
      /arrow_back/i.test(c.text) ||
      /back/i.test(c.aria),
  );

  if (back) {
    await clickAt(page, back.cx, back.cy);
    await page.waitForTimeout(300);
  }
}

async function clickControl(
  page: Page,
  match: (text: string, aria: string) => boolean,
  what: string,
): Promise<void> {
  const controls = await visibleControls(page);

  const hit = controls.find((c) => match(c.text, c.aria));

  if (!hit) {
    throw new FlowError(
      M.noOption(what),
      M.visibleTabs(controls.map((c) => c.text).join(" / ")),
    );
  }

  await clickAt(page, hit.cx, hit.cy);
  await page.waitForTimeout(400);
}

async function clickControlIfPresent(
  page: Page,
  match: (text: string, aria: string) => boolean,
): Promise<boolean> {
  const controls = await visibleControls(page);
  const hit = controls.find((c) => match(c.text, c.aria));

  if (!hit) return false;

  await clickAt(page, hit.cx, hit.cy);
  await page.waitForTimeout(400);
  return true;
}

export async function readQuotedCost(
  page: Page,
): Promise<{ cost: number | null; raw: string }> {
  return { cost: 0, raw: "image mode (free)" };
}

export interface Settings {
  aspect: Aspect;
  count: number;
}

export async function applySettings(
  page: Page,
  settings: Settings,
): Promise<{ cost: number | null; raw: string }> {
  await openSettings(page);

  // El panel de miniaturas del proyecto también trae botones que arrancan con
  // el ligature "image" — cada imagen ya generada es "image <prompt que la
  // creó>". Si se hiciera match por prefijo, la miniatura más reciente
  // aparece ANTES que la pestaña real "image Imagen" en la lista de
  // controles y se clickea por error: eso cierra el panel de configuración
  // en vez de tocar el modo. Por eso hace falta el texto completo, sin
  // resto después de la etiqueta.
  await clickControlIfPresent(
    page,
    (text, aria) =>
      /^image (imagen|image)$/i.test(text) ||
      /^image (imagen|image)$/i.test(aria) ||
      /^imagen$/i.test(aria),
  );

  const { ligature } = ASPECTS[settings.aspect];
  const label = settings.aspect;

  await clickControl(
    page,
    (text, aria) =>
      text.startsWith(ligature) ||
      text.split(" ").includes(label) ||
      aria.includes(ligature) ||
      aria.includes(label),
    M.optionAspect(settings.aspect),
  );

  if (
    !(await clickControlIfPresent(
      page,
      (text, aria) =>
        text === `x${settings.count}` ||
        aria === `x${settings.count}`,
    )) &&
    settings.count > 1
  ) {
    throw new FlowError(
      M.noOption(M.optionCount(settings.count)),
    );
  }

  return {
    cost: 0,
    raw: "image mode (free)",
  };
}

/**
 * El compositor real es un `div[contenteditable="true"].ProseMirror` cerca del
 * pie de pantalla. Pero el título del proyecto (arriba a la izquierda) es
 * también un `input[aria-label="Texto editable"]` — Flow reutiliza esa misma
 * etiqueta genérica para cualquier campo editable en línea. Si se busca por
 * ese aria-label ANTES que por contenteditable, se encuentra el título
 * primero y el prompt se escribe ahí en silencio: el compositor queda vacío,
 * "Iniciar generación" no hace nada (o queda deshabilitado), y el script se
 * cuelga esperando imágenes que nunca llegan. Por eso el contenteditable
 * ProseMirror va primero, y el input por aria-label queda como último
 * recurso.
 */
async function findComposer(
  page: Page,
): Promise<{ cx: number; cy: number; selector: string } | null> {
  return page.evaluate(() => {
    const contenteditables = [
      ...document.querySelectorAll('[contenteditable="true"]'),
    ].filter((el) => (el as HTMLElement).offsetParent) as HTMLElement[];

    const prose = contenteditables.filter((el) =>
      el.classList.contains("ProseMirror"),
    );

    const chosen = (prose.length ? prose : contenteditables).pop();

    if (chosen) {
      chosen.focus();
      const r = chosen.getBoundingClientRect();
      return {
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        selector: prose.length ? "[contenteditable].ProseMirror" : "[contenteditable]",
      };
    }

    const fallbackSelectors = [
      'input[aria-label="Texto editable"]',
      'input[aria-label="Editable text"]',
    ];

    for (const selector of fallbackSelectors) {
      const boxes = [...document.querySelectorAll(selector)].filter(
        (el) => (el as HTMLElement).offsetParent,
      );

      const el = boxes[boxes.length - 1] as HTMLElement | undefined;

      if (el) {
        el.focus();
        const r = el.getBoundingClientRect();

        return {
          cx: r.x + r.width / 2,
          cy: r.y + r.height / 2,
          selector,
        };
      }
    }

    return null;
  });
}

const COMPOSER_TIMEOUT_MS = 20_000;

async function findComposerWithRetry(
  page: Page,
): Promise<{ cx: number; cy: number; selector: string } | null> {
  const t0 = Date.now();
  let box: { cx: number; cy: number; selector: string } | null = null;

  while (Date.now() - t0 < COMPOSER_TIMEOUT_MS) {
    box = await findComposer(page);
    if (box) break;
    await page.waitForTimeout(500);
  }

  return box;
}

/**
 * Escribe el prompt y confirma que quedó puesto. Una sola pasada no alcanza:
 * justo después de cambiar de aspecto (applySettings) las coordenadas del
 * compositor pueden quedar viejas para cuando el click llega —Flow todavía
 * está reacomodando el layout—, así que el texto se pierde en silencio. Se
 * reintenta el ciclo completo (buscar, clickear, escribir, verificar) en vez
 * de sólo la búsqueda del elemento.
 */
async function typeIntoComposer(
  page: Page,
  prompt: string,
): Promise<boolean> {
  const box = await findComposerWithRetry(page);

  if (!box) {
    throw new FlowError(M.noComposer(), M.noComposerHint());
  }

  // findComposer ya llamó a `.focus()` sobre el elemento elegido, pero un
  // clic de mouse sintético (vía CDP) puede robarle el foco a `document.body`
  // en vez de dárselo al compositor — se comprobó en vivo que esto pasa de
  // forma intermitente. Por eso el foco real se hace en el evaluate, y este
  // clic sólo dispara los listeners de UI que dependan de un mousedown/click
  // real (p. ej. cerrar popovers); si igual movió el foco, se lo recupera.
  await clickAt(page, box.cx, box.cy);
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('[contenteditable="true"].ProseMirror')]
      .filter((e) => (e as HTMLElement).offsetParent)
      .pop() as HTMLElement | undefined;
    el?.focus();
  });
  await page.waitForTimeout(150);

  const selectAll =
    process.platform === "darwin" ? "Meta+A" : "Control+A";

  await page.keyboard.press(selectAll);
  await page.keyboard.press("Backspace");

  await page.keyboard.type(prompt, { delay: 4 });
  await page.waitForTimeout(200);

  const landed = await page.evaluate(() => {
    const el = document.activeElement as
      | HTMLElement
      | HTMLInputElement
      | null;
    return (
      (el as HTMLInputElement)?.value ?? el?.innerText ?? ""
    ).trim();
  });

  return Boolean(landed);
}

export async function submitPrompt(
  page: Page,
  prompt: string,
): Promise<void> {
  const ATTEMPTS = 3;
  let landed = false;

  for (let intento = 0; intento < ATTEMPTS && !landed; intento++) {
    if (intento > 0) await page.waitForTimeout(1_000);
    landed = await typeIntoComposer(page, prompt);
  }

  if (!landed) {
    throw new FlowError(M.noComposer(), M.noComposerHint());
  }

  const findSend = () =>
    page.evaluate(() => {
      const btns = [...document.querySelectorAll("button, [role=button]")]
        .filter((el) => (el as HTMLElement).offsetParent)
        .filter((el) => {
          const text = ((el as HTMLElement).innerText || "").trim();
          const aria = el.getAttribute("aria-label") || "";

          return (
            text === "arrow_forward" ||
            /iniciar generación/i.test(aria) ||
            /start generation/i.test(aria)
          );
        });

      const el = btns[btns.length - 1] as HTMLElement | undefined;

      if (!el) return null;

      const r = el.getBoundingClientRect();
      const disabled =
        (el as HTMLButtonElement).disabled ||
        el.getAttribute("aria-disabled") === "true";

      return {
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        disabled,
      };
    });

  // El botón queda deshabilitado hasta que la app registra el texto que
  // ProseMirror acaba de aplicar al DOM; ese registro tiene un pequeño
  // retraso propio. Clickear antes de que se habilite no hace nada — ni
  // error ni generación — y deja al llamador esperando imágenes que nunca
  // van a llegar. Se espera activamente a que se habilite, con tope.
  const SEND_ENABLE_TIMEOUT_MS = 10_000;
  const tSend = Date.now();
  let send = await findSend();

  while (send?.disabled && Date.now() - tSend < SEND_ENABLE_TIMEOUT_MS) {
    await page.waitForTimeout(300);
    send = await findSend();
  }

  if (send?.disabled) {
    throw new FlowError(M.noComposer(), M.noComposerHint());
  }

  if (send) {
    await clickAt(page, send.cx, send.cy);
  } else {
    await page.keyboard.press("Enter");
  }
}
