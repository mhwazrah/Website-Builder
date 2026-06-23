# SECTION SPEC — renderer + editor for one section type

You implement TWO standalone Angular 22 components for ONE section type. Read the
type's content interface in
`C:/Users/moham/Documents/projects/Website-builder/frontend/src/app/core/models.ts`
first. Create ONLY your two files; do not edit shared/registry/switch files (the host wires
them). No builds, no installs.

## Conventions (Angular 22 standalone, zone-based, Tailwind, PrimeNG 21)

- Signals only: `input.required()`, `model.required()`, `computed`, `signal`, `inject`.
  Control flow `@if/@for/@switch`; `@for` needs `track`.
- Core helpers (import from the right relative depth):
  - `resolveText(text, lang)` and `dir(lang)` from `core/i18n`.
  - `assetUrl(path)` from `core/config` (resolve image URLs; pass through absolute).
  - Types from `core/models`.
- Brand colours: use inline `style` with `var(--site-primary)` / `var(--site-secondary)`.
- Rich text (Quill HTML) is rendered with `[innerHTML]` inside a `<div class="rich-text" [attr.dir]="dir(lang())">`.
- Shared editor building blocks (import from `shared/...`):
  - `<app-localized-text-input [(value)]="t" [languages]="languages()" label="..">` — plain bilingual text.
  - `<app-localized-quill [(value)]="t" [languages]="languages()" label="..">` — bilingual rich text.
  - `<app-image-picker [(value)]="url" label="..">` — image upload OR URL (use for ALL image fields).
- PrimeNG 21 (import the module barrels, they compile cleanly):
  `InputTextModule` (`pInputText`), `SelectModule` (`<p-select [options] optionLabel optionValue [(ngModel)]>`),
  `CheckboxModule` (`<p-checkbox [binary]="true" [(ngModel)]>`), `ButtonModule` (`<p-button>` or plain styled `<button>`).
  Always import `FormsModule` when using `[(ngModel)]`.
- New list-item ids: `crypto.randomUUID()`.

## RENDERER — file `frontend/src/app/features/public-site/renderers/<type>-renderer.ts`

- Class `<Pascal>Renderer`, `selector: 'app-<type>-renderer'`, standalone, inline template,
  `changeDetection: ChangeDetectionStrategy.OnPush`.
- Inputs: `section = input.required<Section>()`, `lang = input.required<Language>()`.
- `protected readonly content = computed(() => this.section().content as <Type>Content);`
- Render the content responsively and attractively with Tailwind. Use `resolveText` for all
  text, `assetUrl` for images (with a sensible empty/placeholder state when an image URL is blank),
  brand colours via CSS vars. Keep it self-contained (the outer <section> padding/background is
  added by the host SectionRenderer — do NOT add your own outer full-width background unless the
  design needs it, e.g. hero/cta may use a background image/colour).

## EDITOR — file `frontend/src/app/features/builder/editors/<type>-editor.ts`

- Class `<Pascal>Editor`, `selector: 'app-<type>-editor'`, standalone, inline template.
- Inputs: `content = model.required<<Type>Content>()`, `languages = input.required<Language[]>()`.
- Provide form controls for EVERY field of the content interface. Mutate immutably, e.g.
  `this.content.update(c => ({ ...c, columns: n }))`; for list items map/splice into a new array.
- Add "Add"/"Remove" controls for any array fields, each new item built with sensible empty
  localized objects (`{}`) and `crypto.randomUUID()` ids.
- Use the shared bilingual + image-picker components above; never hand-roll a Quill editor.

Return a short list of the two files you created and any deviation.
