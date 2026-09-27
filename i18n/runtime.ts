import hindi from './Hindi.json';
import kannada from './Kannada.json';
import spanish from './Spanish.json';
import french from './French.json';
import tamil from './Tamil.json';
import telugu from './Telugu.json';
import marathi from './Marathi.json';
import bengali from './Bengali.json';
import gujarati from './Gujarati.json';
import malayalam from './Malayalam.json';

type Catalog = Record<string, string>;
const catalogs: Record<string, Catalog> = {
  Hindi: hindi, Kannada: kannada, Spanish: spanish, French: french,
  Tamil: tamil, Telugu: telugu, Marathi: marathi, Bengali: bengali,
  Gujarati: gujarati, Malayalam: malayalam,
};
// Vite may optimize the JSX runtime separately from the application modules.
// Both copies must read the same selected language.
const languageState = globalThis as unknown as Record<symbol, string>;
const LANGUAGE_KEY = Symbol.for('quietsend.activeLanguage');

export function setActiveLanguage(language: string): void {
  languageState[LANGUAGE_KEY] = language;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const templates = Object.entries(hindi).filter(([source]) => /⟦\d+⟧/.test(source))
  .map(([source]) => ({
    source,
    literalLength: source.replace(/⟦\d+⟧/g, '').length,
    regex: new RegExp('^' + source.split(/⟦\d+⟧/).map(escapeRegex).join('([\\s\\S]*?)') + '$'),
  }))
  .filter((item) => item.literalLength >= 8)
  .sort((a, b) => b.literalLength - a.literalLength);

/** Translate source-authored interface copy; preserve user data and numbers. */
export function translateVisible(value: string): string {
  const catalog = catalogs[languageState[LANGUAGE_KEY] ?? 'English'];
  if (!catalog || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const source = value.trim().replace(/\s+/g, ' ');
  const direct = catalog[source];
  if (direct) return leading + direct + trailing;
  for (const template of templates) {
    const match = template.regex.exec(source);
    if (!match) continue;
    const translated = catalog[template.source];
    if (!translated) continue;
    return leading + translated.replace(/⟦(\d+)⟧/g, (_token, index: string) => match[Number(index) + 1] ?? '') + trailing;
  }
  return value;
}
