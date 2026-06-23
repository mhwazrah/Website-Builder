# Website Builder — Improvement Roadmap

A prioritized plan derived from a code-grounded audit of the current implementation
(NestJS+Fastify+TypeORM backend, Angular 22 + PrimeNG frontend, 14 section types, bilingual
EN/AR, auth intentionally external). Each item is tagged **[impact / effort]** — effort is
S (≤1 day), M (a few days), L (1–2 weeks).

> **Context that shapes priorities:** the builder will be **embedded into another
> application**, and **auth is handled by the host**. So the highest-value work is
> (1) making the API safe to expose without its own auth, (2) a clean headless/embeddable
> content API, and (3) a draft→publish + SSR story so published sites are fast and
> crawlable. Pure account/billing features are out of scope.

---

## 1. Technical enhancements

### 1a. Security & API hardening (do before embedding)
- **Rate limiting / throttling** `@nestjs/throttler`, strict global default + tighter cap on
  the public contact endpoint; `trustProxy` + IP keying. Today there is none — the contact
  endpoint can flood the DB and SMTP relay. **[high / S]**
- **CORS allow-list + Helmet + gate Swagger** — replace `origin: true, credentials: true`
  with an env allow-list; add `@fastify/helmet`; serve `/docs` only outside production. **[high / S]**
- **`synchronize: false` + migrations** — default is `true` today (schema auto-mutation risk,
  dangerous against a shared host DB). Add a TypeORM datasource + migration workflow. **[high / M]**
- **Harden file upload** — content-sniff (sharp metadata/magic bytes), re-encode the **logo**
  through sharp (it currently stores raw bytes with a client-supplied extension), ideally
  serve `/uploads` from a separate origin/CDN. **[high / M]**
- **Server-side sanitize section rich-text** — `content` is accepted as opaque `@IsObject()`
  and rendered as HTML on the public (unauth) site; add per-type validation + HTML
  sanitization as defense-in-depth against stored XSS. **[medium / M]**
- **Global exception filter + remove credential fallbacks** — uniform non-leaky error
  envelope; fail fast on missing `DB_*` (Joi config validation) instead of booting on
  `builder/builder_pass`. **[medium / S]**
- **Pagination + array bounds** — `GET /sites` returns the whole table; reorder DTOs accept
  unbounded `ids[]`. Add paging + `@ArrayMaxSize`. **[low / S]**

### 1b. Data model, performance & content lifecycle
- **Draft vs published separation** — editors mutate the live site today. Introduce a
  published snapshot (simplest: `publishedRevision` JSONB per site; render reads the frozen
  snapshot, "Publish" copies the live tree). Unlocks safe editing + rollback. **[high / L]**
- **Cache the public site tree** — re-queried from Postgres on every visitor hit. Add
  in-memory/Redis cache keyed by subdomain + `Cache-Control`/`ETag`, invalidated on publish. **[high / M]**
- **Missing indexes** — add `@Index` on `Section.pageId`, `Page.siteId`,
  `ContactMessage.siteId`, and a composite `(siteId, createdAt)` for the prune cron. **[high / S]**
- **Wrap multi-writes in transactions** — create-site+seed-page and both reorders are
  non-atomic; use `DataSource.transaction`. **[high / M]**
- **Per-type runtime validation of `content`** (zod/class-validator keyed by `SectionType`)
  so malformed JSONB can't be persisted. **[medium / M]**
- **Soft delete + audit** — `@DeleteDateColumn` on Site/Page/Section so cascade deletes are
  recoverable. **[medium / M]**

### 1c. Frontend architecture & quality
- **HTTP error interceptor** (`withInterceptors`) — retry idempotent GETs w/ backoff, one
  generic error toast, central 4xx/5xx handling. **[high / M]**
- **Automated tests** — none today (the one spec is a stale failing scaffold). Start with
  SiteStore unit tests (optimistic reorder + rollback), a color-extraction unit test, and a
  Playwright smoke test of the create→edit→publish→render flow. **[high / M]**
- **`OnPush` across builder components** — they're pure signal/input/model; cheap win. **[medium / M]**
- **De-duplicate the 14 editors** — extract a shared item-list controller / `<app-item-list>`
  to remove repeated add/remove/patch scaffolding. **[medium / M]**
- **Lazy-load section renderers** — the public chunk eagerly imports all 14; `@defer`/dynamic
  import by `section.type` so a page ships only what it uses. **[medium / M]**
- **Standardize optimistic-update pattern** for all mutations (not just reorders). **[medium / M]**

### 1d. Testing / CI / DevEx / observability
- CI pipeline (lint + build + test for both apps), production Dockerfiles + compose, a
  `docker compose` that runs API+web+db, structured logging (pino) and a `/metrics` or basic
  request logging, env-validated config. **[medium / M]**

---

## 2. Website-builder features

### 2a. High-leverage, near-term
- **Starter templates / themes** — every site starts empty today; ship a few JSON section-graph
  templates (restaurant, clinic, portfolio, landing) selectable at create time. **[high / M]**
- **Serve multi-page sites publicly** — pages are built in the admin but the public renderer
  only shows the home page; add `/site/:subdomain/:slug` routing + page nav links. **[high / M]**
- **Section/page duplication** — `POST /sections/:id/duplicate` (deep clone, regen item ids)
  + copy button. **[high / S]**
- **Contact submissions inbox** — messages are stored but invisible; add `GET /sites/:id/messages`
  (+ mark-read) and an admin inbox with unread badge. (`read` flag already exists.) **[high / M]**
- **Intra-section item reordering** — cards/gallery/slides/testimonials can't be reordered;
  reuse CDK drag or add up/down buttons. **[medium / M]**

### 2b. Content & SEO depth
- **Per-page SEO** — move metaTitle/description/ogImage to the Page level (site fallback). **[medium / M]**
- **Global design system** — beyond 2 colours: a curated font pair (heading/body), radius and
  spacing scale tokens applied via CSS vars. **[medium / M]**
- **More section types** — pricing, map/location, team, logos marquee, video embed, newsletter
  signup, countdown, stats-with-icons. Pricing + map first for the SMB/bilingual positioning. **[medium / L]**
- **Per-section visibility / scheduling + reusable blocks** (save a section as a reusable template). **[low / M]**

### 2c. Strategic
- **Media library** — an Asset entity + browse/reuse tab in the image picker (uploads are
  currently write-only and unreusable). **[high / L]**
- **Undo/redo** — command/history layer in SiteStore for Ctrl+Z on section/page mutations. **[high / L]**

---

## 3. UI/UX & accessibility

- **Responsive/device preview** in the builder (mobile/tablet/desktop width toggle). **[high / M]**
- **Keyboard-accessible reordering** — DnD is mouse-only; add focus-visible up/down buttons. **[high / M]**
- **Unsaved-changes protection** on Settings (dirty flag + CanDeactivate + beforeunload). **[high / M]**
- **Inline canvas editing** — make preview sections click-to-edit with a hover outline (today
  everything is a modal). **[medium / L]**
- **Finish bilingual coverage** — translate the remaining English strings: public "Site not
  found" screen, contact-form labels, "Learn more", and the `image-picker` shared component. **[medium / S]**
- **Public-site a11y** — associate form `label/for` + `aria-required`/error summary, real hero
  `<img alt>`, logo anchor `href`/aria-label, heading order, landmarks. **[medium / M]**
- **Responsive public navbar** (hamburger on mobile) + keep internal/anchor links in-tab
  (hero/cards open new tabs today). **[medium / M]**
- **Consistent busy/disabled guards** + `[loading]` on all async/destructive buttons. **[medium / S]**
- **Carousel a11y** — bilingual ARIA labels, `aria-roledescription`, keyboard arrows. **[medium / S]**

---

## 4. Integration & embedding (your stated goal)

- **Runtime-configurable API & asset base** — `SERVER_ORIGIN`/`API_BASE` are hardcoded; inject
  via an `InjectionToken` seeded from `window.__BUILDER_CONFIG__` or a fetched `/config`, so the
  host app sets them. **[high / S]**
- **Versioned public API + response DTOs** — mount under `/api/v1/...` and return explicit view
  models instead of leaking raw ORM entities (stable contract for the host). **[high / M]**
- **Tenant/API-key guard hook** — a no-op-today guard on the public module that resolves a
  caller/tenant from a header, so scoping can switch on later without reshaping routes. **[high / M]**
- **Ownership/tenant column** — add a nullable, indexed `ownerId`/`tenantId` to `Site` now so
  the column+index exist before multi-tenant data isolation is needed. **[medium / M]**
- **Webhooks / domain events** — emit `site.published`, `contact.received` (via
  `@nestjs/event-emitter`) and POST signed payloads to the host. **[high / M]**
- **Embeddable surface** — a chrome-less iframe route and/or compile the renderer as an Angular
  **custom element** (`@angular/elements`) so the host can drop in `<site-renderer subdomain>`. **[medium / L]**
- **Static export** — `GET /api/v1/public/sites/:subdomain/export` returning normalized JSON or
  fully-rendered static HTML. **[medium / L]**

---

## 5. SEO & performance (published sites)

- **Angular SSR + hydration** for `/site/:subdomain` — client-only rendering makes published
  sites near-invisible to crawlers/social unfurlers. Biggest SEO lever. **[high / L]**
  - Pair with: gate the reveal-animation hidden state behind a JS-set class so SSR content
    paints immediately (today `RevealDirective` hides sections until JS runs). **[medium / S]**
- **JSON-LD structured data** (WebSite/Organization/LocalBusiness) in `SeoService`. **[high / M]**
- **robots.txt + per-site sitemap.xml** (with hreflang alternates). **[high / M]**
- **hreflang / canonical / og:locale** for EN/AR, and give each language a stable URL
  (`?lang=ar` or `/ar`). **[high / M]**
- **LCP image** — render hero cover as `<img fetchpriority="high">`/`NgOptimizedImage`, add
  width/height + `srcset`, scope `loading=lazy` to below-the-fold. **[high / M]**
- **Analytics hook** — optional per-site GA4/Plausible id injected into the renderer. **[medium / S]**

---

## Suggested sequencing

**Phase 1 — Embedding-ready hardening (≈1 week).** Rate limiting, CORS allow-list + Helmet +
gate Swagger, `synchronize:false` + first migration, harden logo upload, global exception
filter + config validation, DB indexes, transactions, HTTP error interceptor, runtime-config
for API/asset base, contact honeypot. *(Mostly S/M; makes the API safe to expose.)*

**Phase 2 — Core builder value & publishing (≈2 weeks).** Draft→publish snapshot + public
cache, serve multi-page sites, starter templates, section/page duplication, contact inbox,
versioned `/api/v1` + response DTOs, webhooks, SSR for the public route + JSON-LD + sitemap +
hreflang, OnPush + first test suite.

**Phase 3 — Differentiators (≈2–3 weeks).** Media library, undo/redo, global design system
(fonts/radius/spacing), responsive device preview + inline canvas editing, more section types
(pricing/map/team/video…), per-page SEO, static export + embeddable custom element, finish
bilingual + a11y pass.

> Full itemized findings (58) with file-level detail live in the audit run; this document is
> the curated, prioritized synthesis.
