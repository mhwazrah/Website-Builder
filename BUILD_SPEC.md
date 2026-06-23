# BUILD SPEC — shared contract for all implementation agents

You are implementing part of a **website builder** (NestJS+Fastify backend, Angular 22
frontend). The *foundation* (entities, models, config, shared components) already exists.
**Only create the files your task names. Do not modify foundation files. Do not run
`npm install` or builds** — a central verify pass handles that.

---

## Backend conventions (NestJS 11 + Fastify + TypeORM)

- TS config: `module: nodenext`, CommonJS emit, **no** `strictPropertyInitialization`.
  Use **extensionless** relative imports (`'../entities/site.entity'`). `strictNullChecks`
  is ON — type nullable columns/params as `T | null` and guard them.
- A global `ValidationPipe({ whitelist: true, transform: true })` is active. DTOs use
  `class-validator` decorators. Build Update DTOs with
  `import { PartialType } from '@nestjs/mapped-types'`.
- Global route prefix is **`api`** (set in `main.ts`). Controller paths must NOT include
  `api`. So `@Controller('sites')` ⇒ `/api/sites`.
- Repositories: `@InjectRepository(Entity) private repo: Repository<Entity>`. A module that
  touches an entity must add `TypeOrmModule.forFeature([...])` to its `imports`.
- Entities (already created, in `backend/src/entities/`): `Site`, `Page`, `Section`,
  `ContactMessage`. Read them for exact fields. Shared types in
  `backend/src/common/` (`types.ts` → `LocalizedText`, `ColorPalette`; `enums.ts` →
  `LanguageMode`, `Language`, `SectionType`; `section-content.ts` → per-type content shapes).
- Throw `NotFoundException` / `BadRequestException` / `ConflictException` from
  `@nestjs/common` for error cases.
- Use `async/await`. Return entities/plain objects (Nest serializes JSON).

### REST contract (every path is under `/api`)

**Sites** — `@Controller('sites')`
- `GET    /sites` → `Site[]` (no relations needed; list view).
- `POST   /sites` (CreateSiteDto) → `Site` (also auto-creates one home `Page`, see below).
- `GET    /sites/check-subdomain?value=&excludeId=` → `{ available: boolean }`.
  ⚠️ Declare this route BEFORE `GET /sites/:id` so `check-subdomain` isn't captured by `:id`.
- `GET    /sites/:id` → `Site` **with relations** `['pages', 'pages.sections']`,
  pages & sections sorted by `order` asc.
- `PATCH  /sites/:id` (UpdateSiteDto) → `Site` (no relations).
- `DELETE /sites/:id` → 200, `{ deleted: true }`.
- `POST   /sites/:id/logo?mode=light|dark` (multipart, field `file`) →
  `{ url, mode, palette: ColorPalette, site: Site }`. Saves the file via `UploadService`,
  extracts a palette via `ColorExtractionService`, stores `logoLightUrl`/`logoDarkUrl` and
  (if currently default) seeds `extractedColors`/`primaryColor`/`secondaryColor`.

**Pages**
- `POST   /sites/:siteId/pages` (CreatePageDto) → `Page` (order = current count).
- `PATCH  /pages/:id` (UpdatePageDto) → `Page`.
- `DELETE /pages/:id` → `{ deleted: true }`.
- `PATCH  /sites/:siteId/pages/reorder` body `{ ids: string[] }` → `Page[]` (sets `order` to index).

**Sections**
- `POST   /pages/:pageId/sections` (CreateSectionDto) → `Section` (order = current count).
- `PATCH  /sections/:id` (UpdateSectionDto) → `Section`.
- `DELETE /sections/:id` → `{ deleted: true }`.
- `PATCH  /pages/:pageId/sections/reorder` body `{ ids: string[] }` → `Section[]`.

**Public** — `@Controller('public')`
- `GET  /public/sites/:subdomain` → published `Site` with `['pages','pages.sections']`
  sorted by order; 404 if not found or `published === false`.
- `POST /public/sites/:subdomain/contact` (ContactSubmissionDto) → `{ ok: true }`.
  Persists a `ContactMessage` and sends an email via `MailService` to the section's
  `recipientEmail` (look up the contact section by `sectionId` if provided, else the
  site's first contact section, else the site name).

**Health** — `GET /health` → `{ status: 'ok' | 'error', db: boolean }` (check
`DataSource.query('SELECT 1')`).

### DTO field reference (mirror these names exactly — the frontend depends on them)
- **CreateSiteDto**: `name: string` (required, 2–120), `subdomain: string` (required,
  matches `/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/`, 2–63, lowercase), `languageMode?: LanguageMode`,
  `defaultLanguage?: Language`.
- **UpdateSiteDto**: PartialType of a class with `name, subdomain, languageMode,
  defaultLanguage, primaryColor (hex /^#([0-9a-fA-F]{6})$/), secondaryColor (hex), published: boolean`.
- **CreatePageDto**: `title: LocalizedText` (object; validate as object/optional keys),
  `slug: string` (`/^[a-z0-9-]+$/`), `showInNav?: boolean`, `isHome?: boolean`.
  For LocalizedText use `@IsObject() @IsOptional()` (don't over-validate inner keys).
- **CreateSectionDto**: `type: SectionType` (`@IsEnum(SectionType)`), `title?`, `subtitle?`
  (LocalizedText objects), `anchor?: string | null`, `showInNav?: boolean`,
  `content?: object`, `settings?: object`.
- **ContactSubmissionDto**: `name: string` (1–160), `email: string` (`@IsEmail`),
  `phone?: string`, `message: string` (1–5000), `sectionId?: string`.
- **ReorderDto**: `ids: string[]` (`@IsArray() @IsString({ each: true })`).

### Subdomain rules
Lowercase English letters, digits, `-` and `.`; no spaces; can't start/end with `-`/`.`.
Provide a `normalizeSubdomain` (lowercase/trim) and `isValidSubdomain` helper in sites.

### Fastify file upload (logo endpoint)
`@fastify/multipart` is registered globally in `main.ts`. In the controller:
```ts
import type { FastifyRequest } from 'fastify';
@Post(':id/logo')
async uploadLogo(@Param('id') id: string, @Query('mode') mode: 'light'|'dark', @Req() req: FastifyRequest) {
  const file = await (req as any).file(); // MultipartFile | undefined
  if (!file) throw new BadRequestException('No file uploaded');
  const buffer = await file.toBuffer();
  // file.mimetype, file.filename available
  return this.sites.setLogo(id, mode === 'dark' ? 'dark' : 'light', buffer, file.mimetype, file.filename);
}
```
`UploadService.saveImage(buffer, originalName)` writes to `process.cwd()/uploads/<uuid>.<ext>`
(create dir if needed via `fs.mkdirSync(dir,{recursive:true})`) and returns the public path
`'/uploads/<file>'`. `ColorExtractionService.extractFromBuffer(buffer)` uses `sharp` to
resize to ~64px, read raw RGB pixels, quantize to a small set, and return
`{ colors: string[], primary, secondary }` (primary = most dominant non-near-white/black,
secondary = next most distinct). Keep it dependency-light (just `sharp`).

### Seed (SeedService, OnApplicationBootstrap)
If no sites exist, create one: name "Demo Business", subdomain "demo", languageMode "both",
defaultLanguage "en", with a home Page (slug "home", isHome true, title {en:'Home',ar:'الرئيسية'})
containing three sections in order: a `cards` section, an `accordion` section, and a
`contact` section — each with sensible bilingual default content matching the shapes in
`common/section-content.ts`. Wrap in try/catch and log; never crash boot.

---

## Frontend conventions (Angular 22 standalone, zone-based, Tailwind v4, PrimeNG 21)

- Standalone components only. Use signals: `signal`, `computed`, `inject()`, and signal
  IO `input()`, `input.required()`, `output()`, `model()`. Control flow uses `@if/@for/@switch`
  (no `*ngIf`). `@for` requires `track`.
- Core contract already exists in `frontend/src/app/core/`:
  - `models.ts` — all interfaces/types + DTOs. Import types from here.
  - `config.ts` — `API_BASE`, `SERVER_ORIGIN`, `assetUrl(path)`.
  - `i18n.ts` — `resolveText(text, lang)`, `dir(lang)`, `languagesFor(mode)`, `languageLabel(lang)`.
  - `section-registry.ts` — `SECTION_TYPES`, `sectionMeta(type)`, `.defaultContent()`.
  - `api.service.ts` — `ApiService` with every endpoint (inject it).
  - `site-store.ts` — `SiteStore` (signals + mutations). Builder & settings use this.
- Shared building blocks already exist in `frontend/src/app/shared/`:
  - `theme.service.ts` — `ThemeService.apply(primary, secondary, target?)`.
  - `localized-text-input.ts` — `<app-localized-text-input [(value)]="t" [languages]="langs" label="..">`.
  - `localized-quill.ts` — `<app-localized-quill [(value)]="t" [languages]="langs" label="..">`.
  - Two-way bind with `[(value)]` (these expose a `model()`).
- Get the toast service via `inject(MessageService)` (from `primeng/api`); the `<p-toast>` is
  already in the app root. `this.messages.add({ severity:'success'|'error'|'info', summary, detail })`.
- Routing: routes are defined; create the components the routes lazy-load (exact class names
  in your task). Read `route.snapshot.paramMap` or use `input()` route params — prefer
  `inject(ActivatedRoute)` + `paramMap` for clarity.

### PrimeNG 21 component cheat-sheet (import name ⇒ selector)
- `Button` from `primeng/button` ⇒ `<p-button label="Save" icon="pi pi-check" (onClick)="..">`
  (icon-only: `[rounded]="true" [text]="true"`). For a styled native button you may also just
  use a `<button>` with Tailwind — fine.
- `Select` from `primeng/select` ⇒
  `<p-select [options]="opts" optionLabel="label" optionValue="value" [(ngModel)]="x" />`
  (opts = `{label,value}[]`). (This replaces the old `p-dropdown`.)
- `ColorPicker` from `primeng/colorpicker` ⇒
  `<p-colorpicker [(ngModel)]="hex" format="hex" />` (value is `'#rrggbb'` WITHOUT alpha;
  bind a `string`). Add a sibling text input to show/edit the hex if you like.
- `FileUpload` from `primeng/fileupload` ⇒ drag-drop dropzone:
  `<p-fileupload mode="advanced" [customUpload]="true" accept="image/*" [auto]="true"
     [showUploadButton]="false" [showCancelButton]="false" (uploadHandler)="onUpload($event)"
     chooseLabel="Drop logo or browse" />`
  In `onUpload(e: { files: File[] })` grab `e.files[0]`. (You can also use `mode="basic"`
  `(onSelect)="..."`.)
- `Dialog` from `primeng/dialog` ⇒ `<p-dialog [(visible)]="open" [modal]="true" [header]="..">`.
- `InputText` from `primeng/inputtext` ⇒ `<input pInputText [(ngModel)]="x" />`.
- `Checkbox` from `primeng/checkbox` ⇒ `<p-checkbox [(ngModel)]="b" [binary]="true" />`.
- `Textarea` from `primeng/textarea` ⇒ `<textarea pTextarea [(ngModel)]="x"></textarea>`.
- Always `import { FormsModule } from '@angular/forms'` when using `[(ngModel)]`.
- Do NOT use Angular animations providers; PrimeNG 21 handles its own.

### CDK drag-and-drop (builder section list)
```ts
import { CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
// template:
<div cdkDropList (cdkDropListDropped)="drop($event)">
  @for (s of sections(); track s.id) {
    <div cdkDrag> <i class="pi pi-bars" cdkDragHandle></i> ... </div>
  }
</div>
// handler:
drop(e: CdkDragDrop<Section[]>) {
  const ids = this.sections().map(s => s.id);
  moveItemInArray(ids, e.previousIndex, e.currentIndex);
  this.store.reorderSections(ids);
}
```

### Theming & i18n in render
- Apply `ThemeService.apply(site.primaryColor, site.secondaryColor)` once a site loads.
- Use `var(--site-primary)` / `var(--site-secondary)` in inline styles for brand colours.
- Render rich text with `[innerHTML]` inside a `.rich-text` container; wrap in `[attr.dir]="dir(lang)"`.
- Use `resolveText(localized, activeLang)` for all text.

Return a short summary: the list of files you created and any deviation from this spec.
