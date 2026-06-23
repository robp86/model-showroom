# Native Sun Homes — Manufactured Home Showroom

A React + Vite showroom for ~279 manufactured-home models. It's not just a
gallery: every model gets a **media-completeness score and tier**, and every
list is ordered so the most complete profiles show first.

## Quick start

```bash
npm install
npm run build:data     # generate src/data/models.generated.js from CSV + galleries
npm run dev            # start the site at http://localhost:5173
npm run build          # production build
npm run lint           # eslint
```

`npm run build:data` is already run and its output is committed; re-run it
whenever you change the CSV, the gallery folders, or `model-overrides.js`.

## How the data pipeline works

```
data-import/updated-model-specs.csv     ─┐   (specs: name, beds, baths, sqft, Champion URL)
public/model-galleries/**               ─┼─► scripts/buildModelData.mjs ─► src/data/models.generated.js
src/data/champion-media.generated.json  ─┘                                └► src/data/media-audit.generated.json
src/data/model-overrides.js             ─┘   (manual business control)
```

1. **CSV** is the source of truth for specs (279 rows).
2. **Gallery scan** walks `public/model-galleries/`. It handles both flat model
   folders (`Ace 2.0/`) and grouped series folders (`Prime (28)/Prime Grand 043/`),
   reads signals from folder names (`(Floor plan only)`, `(No photos)`), and
   classifies each file as photo / floor plan / video.
3. **Matching** links CSV rows to folders by normalized slug, with a fuzzy
   fallback (handles typos like `Opputunity`, `Sliver Springs`, `palm Bay`).
4. **Scoring + tiering** runs (see below). Business tags come from
   `model-overrides.js`. Buyer/lifestyle tags are inferred from specs + media.
5. Output: `models.generated.js` (the app's data) and `media-audit.generated.json`
   (the audit report shown at `/audit`).

### Media tiers (best → worst) — internal ordering signal only

`complete` → `strong` → `partial` → `floor-plan-only` → `minimal` → `bare`

Tiers are **never shown to buyers** — no "Partial Profile" labels anywhere. They
only drive ordering: every category and list sorts by **tier → business priority
(featured → bestSeller → inStock → moveInReady → newArrival) → media score → name**,
so the most complete homes lead silently. Model detail pages only show media tabs
that have content, so absence is never advertised. (Tiers are still visible on the
internal `/audit` page.) Scoring weights live in `src/utils/modelScoring.js`.

### Browsing taxonomy

Models are organized like the reference Native Sun Homes site: by **Series** and
named **Size Groups** (Compact / Efficient / Classic Family / Popular Family /
Spacious / Large Family / Estate-Grand — see `src/utils/sizeGroups.js`), with
Bedroom/Bathroom filters. The showroom shows 24 homes per page with "Show more".

## Manual business control

Edit `src/data/model-overrides.js` (keyed by model id = slug of the name) to set
`featured`, `bestSeller`, `inStock`, `moveInReady`, `customizable`,
`dealerRecommended`, a corrected `series`/`heroImage`/`sourceUrl`, extra
`buyerTags`/`features`, `notes`, or `hide`. Then re-run `npm run build:data`.

Featured / best-seller / availability are **never invented by code** — they only
come from this file (or, for availability, the Champion scraper).

## Champion enrichment (optional)

```bash
npm run scrape:champion            # scrape uncached URLs (polite: 1 page at a time, delay, cached)
node scripts/scrapeChampionMedia.mjs --force      # re-scrape all
node scripts/scrapeChampionMedia.mjs --limit=10   # test on 10
npm run build:data                 # merge results in
```

It loads each model's Champion URL, extracts specs/features/availability and
floor-plan/tour/video references, and writes `src/data/champion-media.generated.json`.
It never crashes a run — each model records `scrapeStatus`
(`success`/`failed`/`blocked`/`not-found`). If the Champion page name doesn't
match the sheet, it sets `possibleMismatch` and keeps the **sheet name as the
source of truth**. It stores image *URLs as references* rather than bulk-
downloading. Review the site's terms before large runs.

## Current data state (from `/audit`)

- 295 homes (279 from the sheet + 16 gallery-only), 283 gallery folders scanned.
- After the Champion scrape + merge: **~153 homes have a 3D tour, ~147 a floor
  plan, ~231 photos**; ~63 are `complete` and ~88 `strong`.
- Local media always wins; Champion fills the gaps. Champion photos/floor plans
  hotlink the manufacturer's scene7 CDN, sized via `?wid=` for performance. To
  self-host instead, download those URLs and rewrite the paths in the build.
- ~21 sheet URLs 404 on Champion (generic links with no model page) — those keep
  whatever local media they have. See `/audit` for the full breakdown.

## Project structure

```
src/
  App.jsx                      # routes
  data/
    models.generated.js        # generated dataset (do not hand-edit)
    media-audit.generated.json # generated audit
    champion-media.generated.json (optional, from scraper)
    model-overrides.js         # manual business control
    categories.js              # category predicates + series builder
  utils/
    slugify.js modelScoring.js mediaDetection.js inferTags.js
    modelFilters.js modelDisplay.js
  hooks/useModels.js
  components/ layout/ home/ models/ common/
  pages/                       # Home, Showroom, Category, Series, Model, Finder,
                               # Financing, HowItWorks, Contact, Audit
  styles/ variables.css global.css
scripts/
  buildModelData.mjs           # the build pipeline
  scrapeChampionMedia.mjs      # Playwright enrichment
```

## Routes

`/` home · `/find` finder wizard · `/available` · `/homes` all models ·
`/floor-plans` · `/series` + `/series/:slug` · `/category/:id` ·
`/model/:id` · `/financing` · `/how-it-works` · `/contact` · `/audit` (hidden).

## TODO / next steps

- Wire the contact form (`ContactSection.jsx`) to a real email/CRM endpoint.
- Optional: self-host the Champion scene7 images instead of hotlinking.
- Optional: route-level code splitting (`React.lazy`) to shrink the initial JS.
- Re-run `npm run scrape:champion` periodically to refresh manufacturer media.
