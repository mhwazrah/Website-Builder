# ROUND 4 SPEC — feature UI contract

You implement ONE Angular file for the website builder (Angular 22 standalone, Tailwind,
PrimeNG 21). Read the file first; make production-quality changes that COMPILE. The backend
+ frontend core already exist — use the surfaces below. Do not edit other files unless your
task says so. Do not run builds.

## CRITICAL syntax rule (learned the hard way)
Inside Angular template bindings, string literals use single quotes. NEVER put an apostrophe
or single quote inside an `i18n.t('...','...')` call in a template — Angular's parser can't
escape it. Use the typographic `’` or `“ ”` or reword (e.g. write `it’s`, `“About”`). This
applies to English AND Arabic argument strings.

## Admin i18n (bilingual EN/AR + RTL)
- `import { AdminI18n } from '<rel>/core/admin-i18n';` then `protected readonly i18n = inject(AdminI18n);`
- Wrap every user-visible string: `{{ i18n.t('English', 'العربية') }}` or `[label]="i18n.t('English','العربية')"`.
- Page-level components set direction: add `[attr.dir]="i18n.dir()"` on the root element and,
  in the constructor, `effect(() => { document.documentElement.dir = this.i18n.dir(); });`.
- Use `<app-admin-lang-switcher />` (from `<rel>/shared/admin-lang-switcher`) in page headers.

## SiteStore (inject `SiteStore` from `<rel>/core/site-store`)
Signals/computed: `site()`, `loading()`, `saving()`, `publishing()`, `dirty()` (unpublished
changes), `activePage()`, `sections()`, `pages()`, `languages()`, `isBilingual()`,
`editLanguage` (writable signal), `canUndo()`, `canRedo()`.
Methods (all async): `load(id)`, `publish()`, `undo()`, `redo()`, `addSection(type)`,
`duplicateSection(id)`, `updateSection(id,dto)`, `deleteSection(id)`, `reorderSections(ids)`,
`addPage(dto)`, `updatePage(id,dto)`, `deletePage(id)`, `duplicatePage(id)`,
`reorderPages(ids)`, `setHomePage(id)`, `setActivePage(id)`, `saveSite(dto)`.

## ApiService (inject `ApiService` from `<rel>/core/api.service`)
New/relevant Observables: `listTemplates()`, `publishSite(id)`, `duplicateSection(id)`,
`duplicatePage(id)`, `listMessages(siteId,{page,unread})`, `unreadCount(siteId)`,
`setMessageRead(id,read)`, `deleteMessage(id)`, `listAssets(page)`, `deleteAsset(id)`,
`uploadImage(file)`, `createSite(dto)` (dto now accepts `templateId`), `getSite(id)`.

## Models (`<rel>/core/models`)
`Template{id,name:LocalizedText,description:LocalizedText,icon}`, `ContactMessage{id,siteId,
name,email,phone,message,read,createdAt}`, `MessageListResult{items,total,unread,page,limit}`,
`Asset{id,url,filename,mimetype,size,width,height,createdAt}`, `AssetListResult{items,total,
page,limit}`. `Site` now has `publishedAt`, `hasUnpublishedChanges`. `CreateSiteDto` has `templateId?`.
Helpers: `resolveText(text,lang)`, `dir(lang)` (`core/i18n`); `assetUrl(path)` (`core/config`).

## PrimeNG 21 cheat-sheet
Module imports (compile cleanly): `ButtonModule`(p-button), `SelectModule`(p-select),
`DialogModule`(p-dialog), `InputTextModule`(pInputText), `CheckboxModule`(p-checkbox),
`TooltipModule`(pTooltip), `SkeletonModule`(p-skeleton), `TabsModule` or just custom tabs,
`FileUploadModule`(p-fileupload), `BadgeModule`(p-badge). Always import `FormsModule` for `[(ngModel)]`.
Toasts via `inject(MessageService)` from `primeng/api` (the `<p-toast>` is in the app root).

Reply with the file(s) you created/changed.
