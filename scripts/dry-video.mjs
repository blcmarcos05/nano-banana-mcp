// Prueba en seco del modo video: configura, lee el costo y pone los
// fotogramas, pero NO envía. No gasta créditos.
// Uso: node scripts/dry-video.mjs <modelo> [fotograma inicial en biblioteca] [final]
import { getFlowTab } from "../dist/browser.js";
import { applyVideoSettings, closeSettings } from "../dist/ui.js";
import { setFrame } from "../dist/reference.js";

const [model = "omni-flash", inicio, fin] = process.argv.slice(2);
const { page } = await getFlowTab();
await page.bringToFront();
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[contenteditable="true"]', { timeout: 60_000 });
await page.waitForTimeout(2_000);

const quote = await applyVideoSettings(page, { aspect: "9:16", model, count: 1, resolution: process.env.RES, duration: process.env.DUR ? Number(process.env.DUR) : undefined });
console.log("costo:", quote);
await closeSettings(page);
if (inicio) await setFrame(page, "start", inicio);
if (fin) await setFrame(page, "end", fin);
console.log("fotogramas puestos; no se envió nada");
await page.screenshot({ path: process.env.SHOT ?? "dry.png" });
process.exit(0);
