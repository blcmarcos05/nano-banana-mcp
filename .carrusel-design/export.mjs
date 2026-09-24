// Exporta las mesas de trabajo de un lienzo de Claude Design a PNG.
//
// Convierte cada .dc.html en HTML estático (las mesas no usan lógica, solo
// markup) y lo renderiza en el Chrome que ya corre con CDP (el de Flow,
// scripts/launch-chrome.mjs). Las imágenes subidas al lienzo se referencian
// como /_blob/<id>; blobs.json dice a qué archivo local corresponde cada id.
//
// Uso (desde la raíz del repo, que es donde está playwright-core):
//   node .carrusel-design/export.mjs <carpeta project del lienzo> <carpeta de salida> <carpeta de imágenes>
//
// <carpeta project>: la que deja un `read` del artifact (canvas.json + *.dc.html).
// <carpeta de imágenes>: los archivos originales que se subieron, más un
// blobs.json {"<id del blob>": "<nombre de archivo>"} con el mapeo.
import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { chromium } = require("playwright-core");

const [SRC, OUT, IMGS] = process.argv.slice(2).map((p) => p && path.resolve(p));
if (!SRC || !OUT || !IMGS) {
  console.error("Uso: node .carrusel-design/export.mjs <project> <salida> <imágenes>");
  process.exit(1);
}
const BLOBS = JSON.parse(fs.readFileSync(path.join(IMGS, "blobs.json"), "utf8"));
const canvas = JSON.parse(fs.readFileSync(path.join(SRC, "canvas.json"), "utf8"));
fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(OUT, ".render-"));

const browser = await chromium.connectOverCDP(process.env.FLOW_CDP_URL || "http://127.0.0.1:9222");
const page = await browser.contexts()[0].newPage();

try {
  for (const [i, name] of canvas.order.entries()) {
    const { w, h, title } = canvas.boards[name];
    await page.setViewportSize({ width: w, height: h });
    let html = fs.readFileSync(path.join(SRC, name), "utf8");
    html = html
      .replace(/<script src="\.\/support\.js"><\/script>/, "")
      .replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/, "")
      .replace(/<\/?x-dc>|<\/?helmet>/g, "")
      .replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => {
        if (!BLOBS[id]) throw new Error(`${name}: blob ${id} no está en blobs.json`);
        return pathToFileURL(path.join(IMGS, BLOBS[id])).href;
      });
    const file = path.join(tmp, name.replace(".dc.html", ".html"));
    fs.writeFileSync(file, html);
    await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const slug = (title || name.replace(".dc.html", ""))
      .replace(/^\d+ · /, "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const out = path.join(OUT, `${String(i + 1).padStart(2, "0")}-${slug}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
    console.log(out);
  }
} finally {
  await page.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(0);
