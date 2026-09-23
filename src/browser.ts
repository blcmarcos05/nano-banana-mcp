import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { config } from "./config.js";
import { FlowError } from "./types.js";
import { M } from "./i18n.js";

const FLOW_HOSTS = ["flow.google.com", "labs.google"];
const isFlowUrl = (u: string) => FLOW_HOSTS.some((h) => u.includes(h));
const PROJECT_RE = /\/(?:tools\/flow\/)?project\/([0-9a-f-]{36})/i;

let browser: Browser | null = null;

async function attach(): Promise<BrowserContext> {
  if (!browser || !browser.isConnected()) {
    try {
      browser = await chromium.connectOverCDP(config.cdpUrl);
    } catch (err) {
      throw new FlowError(
        M.chromeUnreachable(config.cdpUrl, (err as Error).message),
        M.chromeUnreachableHint(),
      );
    }
  }

  const ctx = browser.contexts()[0];
  if (!ctx) throw new FlowError(M.noContext());
  return ctx;
}

export interface FlowTab {
  page: Page;
  context: BrowserContext;
  projectId: string | null;
}

export async function getFlowTab(): Promise<FlowTab> {
  const context = await attach();
  const pages = context.pages().filter((p) => isFlowUrl(p.url()));

  if (pages.length === 0) {
    throw new FlowError(M.noFlowTab(), M.noFlowTabHint());
  }

  const page = pages.find((p) => PROJECT_RE.test(p.url())) ?? pages[0]!;

  return {
    page,
    context,
    projectId: PROJECT_RE.exec(page.url())?.[1] ?? null,
  };
}

export async function listFlowTabs(): Promise<FlowTab[]> {
  const context = await attach();

  return context
    .pages()
    .filter((p) => isFlowUrl(p.url()) && PROJECT_RE.test(p.url()))
    .map((page) => ({
      page,
      context,
      projectId: PROJECT_RE.exec(page.url())?.[1] ?? null,
    }));
}

export async function ensureFlowTabs(n: number): Promise<FlowTab[]> {
  const existing = await listFlowTabs();
  const first = existing[0];

  if (!first) {
    throw new FlowError(M.noProjectTab(), M.noProjectTabHint());
  }

  const tabs = [...existing];

  while (tabs.length < n) {
    const page = await first.context.newPage();

    await page.goto(first.page.url(), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.waitForSelector(
      'input[aria-label="Texto editable"], [contenteditable="true"]',
      { timeout: 60_000 },
    );

    tabs.push({
      page,
      context: first.context,
      projectId: first.projectId,
    });
  }

  return tabs.slice(0, n);
}

export interface Status {
  connected: boolean;
  signedIn: boolean;
  account: string | null;
  projectId: string | null;
  url: string;
  credits: number | null;
  tier: string | null;
}

export async function readStatus(): Promise<Status> {
  const { page, projectId } = await getFlowTab();

  const account = await page
    .evaluate(() => {
      const elements = [
        ...document.querySelectorAll(
          '[aria-label^="Cuenta de Google:"], [aria-label^="Google Account:"]',
        ),
      ];

      for (const el of elements) {
        const value =
          el.getAttribute("aria-label") ??
          el.getAttribute("data-email") ??
          el.getAttribute("alt") ??
          "";

        const match = value.match(
          /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
        );

        if (match) return match[0];
      }

      // En la interfaz actual de Flow, este elemento identifica la cuenta
      // autenticada aunque el correo no esté expuesto directamente.
      const hasGoogleAccountControl = Boolean(
        document.querySelector(
          '[aria-label^="Cuenta de Google:"], [aria-label^="Google Account:"]',
        ),
      );

      if (hasGoogleAccountControl) return "flow-session";

      return null;
    })
    .catch(() => null);

  const credits = await readCredits(page);

  return {
    connected: true,
    signedIn: Boolean(account),
    account,
    projectId,
    url: page.url(),
    credits: credits?.credits ?? null,
    tier: credits?.tier ?? null,
  };
}

export async function readCredits(
  page: Page,
): Promise<{ credits: number; tier: string } | null> {
  return page
    .evaluate(async () => {
      const s = await fetch("/fx/api/auth/session", {
        credentials: "include",
      });

      if (!s.ok) return null;

      const token = ((await s.json()) as { access_token?: string })
        ?.access_token;

      if (!token) return null;

      const r = await fetch(
        "https://aisandbox-pa.googleapis.com/v1/credits",
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      );

      if (!r.ok) return null;

      const j = (await r.json()) as {
        credits?: number;
        sku?: string;
      };

      if (typeof j.credits !== "number") return null;

      return {
        credits: j.credits,
        tier: j.sku ?? "unknown",
      };
    })
    .catch(() => null);
}

export async function disconnect(): Promise<void> {
  if (browser?.isConnected()) {
    await browser.close();
  }

  browser = null;
}
