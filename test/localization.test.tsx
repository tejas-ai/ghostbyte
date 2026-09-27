import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import source from '../i18n/source.json';
import hindi from '../i18n/Hindi.json';
import kannada from '../i18n/Kannada.json';
import spanish from '../i18n/Spanish.json';
import french from '../i18n/French.json';
import tamil from '../i18n/Tamil.json';
import telugu from '../i18n/Telugu.json';
import marathi from '../i18n/Marathi.json';
import bengali from '../i18n/Bengali.json';
import gujarati from '../i18n/Gujarati.json';
import malayalam from '../i18n/Malayalam.json';
import { jsx } from '../i18n/jsx-runtime';
import { setActiveLanguage, translateVisible } from '../i18n/runtime';

const catalogs = { hindi, kannada, spanish, french, tamil, telugu, marathi, bengali, gujarati, malayalam };

describe('interface localization', () => {
  it('ships a complete catalog and preserves each dynamic placeholder', () => {
    const expected = [...source].sort();
    for (const catalog of Object.values(catalogs)) {
      expect(Object.keys(catalog).sort()).toEqual(expected);
      for (const phrase of source) {
        expect(catalog[phrase as keyof typeof catalog]).not.toContain('\n');
        const markers = phrase.match(/⟦\d+⟧/g)?.sort() ?? [];
        expect(catalog[phrase as keyof typeof catalog].match(/⟦\d+⟧/g)?.sort() ?? []).toEqual(markers);
      }
    }
  });

  it('translates visible controls and attributes while preserving user-authored data', () => {
    setActiveLanguage('Kannada');
    expect(translateVisible('Hide')).toBe(kannada.Hide);
    expect(translateVisible('Select Display Language')).toBe(kannada['Select Display Language']);
    expect(translateVisible('Carrier audio size (127 MB) exceeds the 100 MB safety limit.'))
      .toContain('127');
    expect(translateVisible('Carrier audio size (127 MB) exceeds the 100 MB safety limit.'))
      .not.toContain('exceeds the');
    const button = jsx('button', { 'aria-label': 'Hide', children: 'Hide' });
    expect(renderToStaticMarkup(button)).toContain(kannada.Hide);
    const userText = jsx('span', { 'data-no-translate': true, children: 'Hide' });
    expect(renderToStaticMarkup(userText)).toContain('>Hide</span>');
    setActiveLanguage('English');
  });
});
