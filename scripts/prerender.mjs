// Prerender every route in public/sitemap.xml to static HTML in dist/.
//
// Why: the showroom is a client-rendered React SPA, and most AI answer-engine
// crawlers (GPTBot, ClaudeBot, PerplexityBot, ...) do not execute JavaScript.
// After `vite build`, this script serves dist/, walks each sitemap route in
// headless Chromium, and saves the fully rendered DOM to dist/<route>/index.html.
// Netlify serves real files before redirect rules, so prerendered pages win and
// the SPA fallback (_redirects) covers anything not prerendered.
//
// Fails SOFT by design: any error leaves the plain SPA build intact and exits 0,
// so a Playwright hiccup can never break a deploy.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const CONCURRENCY = 8;

async function main() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.log("[prerender] dist/index.html not found — run vite build first. Skipping.");
    return;
  }

  // Route list from the generated sitemap (excludes /audit by design).
  const sitemap = fs.readFileSync(path.join(ROOT, "public", "sitemap.xml"), "utf8");
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .filter((p, i, a) => a.indexOf(p) === i);
  console.log(`[prerender] ${routes.length} routes from sitemap`);

  // Playwright: install chromium on first CI run, reuse local install otherwise.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (e) {
    console.log("[prerender] playwright not installed — skipping.", e.message);
    return;
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    console.log("[prerender] chromium missing — installing…");
    try {
      execSync("npx playwright install chromium", { stdio: "inherit", cwd: ROOT });
      browser = await chromium.launch({ headless: true });
    } catch (e) {
      console.log("[prerender] could not launch chromium — skipping.", e.message);
      return;
    }
  }

  // Tiny static server for dist with SPA fallback.
  const MIME = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", ico: "image/x-icon", txt: "text/plain", xml: "application/xml", webmanifest: "application/manifest+json" };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(DIST, urlPath);
    if (!path.resolve(file).startsWith(DIST)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, "index.html");
    const ext = path.extname(file).slice(1).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  const origin = `http://localhost:${server.address().port}`;

  const ctx = await browser.newContext({ userAgent: "nsh-prerender" });
  // Speed + politeness: never fetch images/media/fonts or ANY external host
  // (model pages hotlink Champion's CDN — prerendering must not hammer it).
  await ctx.route("**/*", (route) => {
    const req = route.request();
    const type = req.resourceType();
    if (["image", "media", "font"].includes(type)) return route.abort();
    if (!req.url().startsWith(origin)) return route.abort();
    return route.continue();
  });

  let ok = 0, failed = [];
  const queue = [...routes];
  async function worker() {
    const page = await ctx.newPage();
    for (;;) {
      const route = queue.shift();
      if (!route) break;
      try {
        await page.goto(origin + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForFunction(
          () => document.getElementById("root")?.children.length > 0 && document.title.length > 0,
          { timeout: 10000 }
        );
        await page.waitForTimeout(80); // let Seo effects settle
        let html = await page.content();
        html = html.replace("<html", "<html data-prerendered=\"1\"");
        const out = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, "<!doctype html>\n" + html.replace(/^<!doctype html>\n?/i, ""));
        ok++;
        if (ok % 50 === 0) console.log(`[prerender] ${ok}/${routes.length}…`);
      } catch (e) {
        failed.push(route);
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  server.close();
  console.log(`[prerender] done: ${ok} rendered, ${failed.length} failed (SPA fallback covers them)`);
  if (failed.length) console.log("[prerender] failed routes:", failed.slice(0, 10).join(", "), failed.length > 10 ? "…" : "");
}

main().catch((e) => {
  console.log("[prerender] unexpected error — deploy continues with plain SPA.", e.message);
  process.exitCode = 0;
});
