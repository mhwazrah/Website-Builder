/** A selectable web font. */
export interface FontOption {
  /** Google Fonts family name, used both as the CSS family and in the URL. */
  family: string;
  /** Friendly label shown in the picker. */
  label: string;
  /**
   * Weights to request from the CSS2 API, e.g. '400;700'. Must only list
   * weights the family actually ships — the CSS2 endpoint 400s the whole
   * request (and the font fails to load) if an absent weight is asked for.
   * Defaults to '400;700' when omitted.
   */
  weights?: string;
}

// Weight presets keep the list readable and avoid requesting weights a family
// does not have.
const TEXT = '400;500;600;700'; // full range — multi-weight / variable families
const BOLD = '400;700'; // regular + bold only
const ONE = '400'; // single-weight display faces

/**
 * Curated Google Fonts that ship BOTH Arabic and Latin glyphs, so a bilingual
 * site renders consistently in either language. This is essentially the whole
 * Google Fonts Arabic catalogue (the families that also carry Latin), grouped
 * loosely from the most body-text-friendly to the more decorative/display.
 */
export const ARABIC_LATIN_FONTS: FontOption[] = [
  // — Versatile sans / text families (great for body + headings) —
  { family: 'Cairo', label: 'Cairo', weights: TEXT },
  { family: 'Tajawal', label: 'Tajawal', weights: TEXT },
  { family: 'Almarai', label: 'Almarai', weights: BOLD },
  { family: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic', weights: TEXT },
  { family: 'Readex Pro', label: 'Readex Pro', weights: TEXT },
  { family: 'Rubik', label: 'Rubik', weights: TEXT },
  { family: 'Vazirmatn', label: 'Vazirmatn', weights: TEXT },
  { family: 'Alexandria', label: 'Alexandria', weights: TEXT },
  { family: 'Noto Sans Arabic', label: 'Noto Sans Arabic', weights: TEXT },
  { family: 'Noto Kufi Arabic', label: 'Noto Kufi Arabic', weights: TEXT },
  { family: 'Mada', label: 'Mada', weights: BOLD },
  { family: 'Kufam', label: 'Kufam', weights: TEXT },
  { family: 'Changa', label: 'Changa', weights: TEXT },
  { family: 'El Messiri', label: 'El Messiri', weights: TEXT },
  { family: 'Reem Kufi', label: 'Reem Kufi', weights: TEXT },
  { family: 'Reem Kufi Fun', label: 'Reem Kufi Fun', weights: BOLD },
  { family: 'Baloo Bhaijaan 2', label: 'Baloo Bhaijaan 2', weights: TEXT },
  { family: 'Marhey', label: 'Marhey', weights: TEXT },
  { family: 'Lemonada', label: 'Lemonada', weights: TEXT },
  { family: 'Cairo Play', label: 'Cairo Play', weights: TEXT },
  { family: 'Lalezar', label: 'Lalezar', weights: ONE },

  // — Serif / Naskh / Quranic text faces —
  { family: 'Amiri', label: 'Amiri (serif)', weights: BOLD },
  { family: 'Amiri Quran', label: 'Amiri Quran', weights: ONE },
  { family: 'Markazi Text', label: 'Markazi Text', weights: TEXT },
  { family: 'Scheherazade New', label: 'Scheherazade New', weights: TEXT },
  { family: 'Noto Naskh Arabic', label: 'Noto Naskh Arabic', weights: TEXT },
  { family: 'Lateef', label: 'Lateef', weights: BOLD },
  { family: 'Harmattan', label: 'Harmattan', weights: BOLD },
  { family: 'Vibes', label: 'Vibes', weights: ONE },

  // — Calligraphic / Ruqaa / Nastaliq —
  { family: 'Aref Ruqaa', label: 'Aref Ruqaa', weights: BOLD },
  { family: 'Aref Ruqaa Ink', label: 'Aref Ruqaa Ink', weights: BOLD },
  { family: 'Mirza', label: 'Mirza', weights: TEXT },
  { family: 'Noto Nastaliq Urdu', label: 'Noto Nastaliq Urdu', weights: BOLD },
  { family: 'Gulzar', label: 'Gulzar', weights: ONE },
  { family: 'Katibeh', label: 'Katibeh', weights: ONE },

  // — Display / decorative —
  { family: 'Rakkas', label: 'Rakkas', weights: ONE },
  { family: 'Jomhuria', label: 'Jomhuria', weights: ONE },
  { family: 'Qahiri', label: 'Qahiri', weights: ONE },
  { family: 'Reem Kufi Ink', label: 'Reem Kufi Ink', weights: ONE },
  { family: 'Handjet', label: 'Handjet', weights: BOLD },
  { family: 'Blaka', label: 'Blaka', weights: ONE },
  { family: 'Blaka Ink', label: 'Blaka Ink', weights: ONE },
  { family: 'Blaka Hollow', label: 'Blaka Hollow', weights: ONE },
];

/** Look up a family's requested weights (defaults to regular + bold). */
function weightsFor(family: string): string {
  return ARABIC_LATIN_FONTS.find((f) => f.family === family)?.weights ?? BOLD;
}

/** Build the Google Fonts CSS2 stylesheet URL for a family. */
export function googleFontUrl(family: string): string {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  return `https://fonts.googleapis.com/css2?family=${name}:wght@${weightsFor(family)}&display=swap`;
}
