import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory not found. Run `npm run build` first.');
  process.exit(1);
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      if (!file.endsWith('.map') && file !== 'SHA256SUMS') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const files = getAllFiles(distDir);
const sums = [];

console.log('\n======================================================');
console.log('🛡️  QuietSend Reproducible Build Verification');
console.log('======================================================\n');

let totalBytes = 0;
for (const filePath of files) {
  const relativePath = path.relative(distDir, filePath).replace(/\\/g, '/');
  const buffer = fs.readFileSync(filePath);
  totalBytes += buffer.length;
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  sums.push(`${hash}  ${relativePath}`);
  console.log(`${hash.slice(0, 16)}...  ${relativePath.padEnd(36)} (${(buffer.length / 1024).toFixed(1)} kB)`);
}

const manifestContent = sums.join('\n') + '\n';
const sumsPath = path.join(distDir, 'SHA256SUMS');
fs.writeFileSync(sumsPath, manifestContent, 'utf8');

console.log('\n------------------------------------------------------');
console.log(`✅ Build Verification Manifest Written: dist/SHA256SUMS`);
console.log(`📦 Total Production Distribution Size: ${(totalBytes / 1024).toFixed(1)} kB`);
console.log('------------------------------------------------------\n');
