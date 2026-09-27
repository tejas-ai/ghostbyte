import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

// Collect visible English copy from the source. The output is reviewed before
// translation and the browser never contacts a translation service.
const root = path.resolve(import.meta.dirname, '..');
const files = [
  path.join(root, 'contexts', 'LanguageContext.tsx'),
  path.join(root, 'App.tsx'),
  ...fs.readdirSync(path.join(root, 'components')).filter((name) => name.endsWith('.tsx'))
    .map((name) => path.join(root, 'components', name)),
  ...['stegaEngine.ts', 'audioStegaEngine.ts', 'asymmetricCrypto.ts', 'workerClient.ts']
    .map((name) => path.join(root, 'services', name)),
];
const sources = new Set();
function normalize(value) { return value.replace(/\s+/g, ' ').trim(); }
function visible(value) {
  if (!/[A-Za-z]{2}/.test(value) || value.length > 700) return false;
  if (/[À-ž\u0900-\u0D7F]/.test(value)) return false;
  if (/^[\w./:+#@-]+$/.test(value) && (value.includes('/') || value.includes('.') || value.includes(':') || value.includes('_') || value.includes('#') || /^\d/.test(value))) return false;
  if (/(?:bg-|text-|hover:|focus:|border-|rounded-|shadow-|https?:|\.png|\.mp4|\.wav|\.tsx|\.ts|\.zip|blob:|data:|\/assets\/)/.test(value)) return false;
  if (/^[A-Z0-9_:-]+$/.test(value) && value.length > 12) return false;
  return true;
}
for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('LanguageContext.tsx')) {
    const start = source.indexOf('English: {', source.indexOf('const dictionariesBase'));
    const end = source.indexOf('Hindi: {', start);
    source = `const dictionary = { ${source.slice(start, end)} };`;
  }
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  function visit(node) {
    let value;
    if (node.type === 'JSXText' || node.type === 'StringLiteral') value = node.value;
    else if (node.type === 'TemplateLiteral') {
      value = node.quasis.map((span, i) => span.value.cooked + (i < node.expressions.length ? `⟦${i}⟧` : '')).join('');
    }
    if (value) {
      value = normalize(value);
      if (visible(value)) sources.add(value);
    }
    for (const child of Object.values(node)) {
      if (Array.isArray(child)) child.forEach((item) => item?.type && visit(item));
      else if (child?.type) visit(child);
    }
  }
  visit(ast);
}
sources.add('QuietSend by GhostByte — Hide Encrypted Messages & Files');
sources.add('Current:');
const items = [...sources].sort((a, b) => a.localeCompare(b, 'en'));
const output = path.join(root, 'i18n', 'source.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(items, null, 2) + '\n');
console.log(`Extracted ${items.length} candidate strings to ${path.relative(root, output)}`);
