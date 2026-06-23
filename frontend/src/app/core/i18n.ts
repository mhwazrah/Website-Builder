import { Language, LanguageMode, LocalizedText } from './models';

/** Pick the best available string for `lang`, falling back gracefully. */
export function resolveText(
  text: LocalizedText | undefined | null,
  lang: Language,
): string {
  if (!text) return '';
  return text[lang] ?? text.en ?? text.ar ?? '';
}

/** Text direction for a language. */
export function dir(lang: Language): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Languages a site edits/exposes, given its mode. */
export function languagesFor(mode: LanguageMode): Language[] {
  return mode === 'both' ? ['en', 'ar'] : [mode];
}

/** Human label for a language code. */
export function languageLabel(lang: Language): string {
  return lang === 'ar' ? 'العربية' : 'English';
}
