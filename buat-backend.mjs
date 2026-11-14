// buat-backend.mjs — membuat source code backend dari README-SETUP.md
//
// Cara pakai (dari root project):
//   node buat-backend.mjs           # hanya membuat file yang belum ada
//   node buat-backend.mjs --force   # menimpa file yang sudah ada
//
// Script ini mengekstrak blok kode pada bagian "Lampiran Source Code Lengkap"
// di README-SETUP.md, lalu menuliskannya menjadi file-file backend.
// Secara default file yang sudah ada TIDAK ditimpa, supaya pekerjaan yang
// belum ter-commit tidak hilang.

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const README = join(ROOT, 'README-SETUP.md');
const FORCE = process.argv.includes('--force');

const FILES = [
  'server/package.json',
  'server/.env.example',
  'server/src/index.js',
  'server/src/db.js',
  'server/src/schema.js',
  'server/src/app.js',
  'server/src/news.js',
  'server/src/seed.js',
  'server/sql/praktik.sql',
  'server/test/members.test.js',
  'server/test/barang.test.js',
  'server/test/news.test.js',
];

function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

async function readIfExists(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

try {
  await access(README);
} catch {
  console.error('README-SETUP.md tidak ditemukan. Jalankan script dari root project.');
  process.exit(1);
}

const text = await readFile(README, 'utf8');
const lines = text.split(/\r?\n/);

const contents = new Map();
let current = null;
let buffer = [];
let inCode = false;

for (const line of lines) {
  const heading = line.match(/^### `(.+)`$/);

  if (heading) {
    current = FILES.includes(heading[1]) ? heading[1] : null;
    buffer = [];
    inCode = false;
    continue;
  }

  if (!current) continue;

  if (line.startsWith('```')) {
    if (!inCode) {
      inCode = true;
      continue;
    }

    contents.set(current, normalize(buffer.join('\n')));
    current = null;
    buffer = [];
    inCode = false;
    continue;
  }

  if (inCode) buffer.push(line);
}

const missing = FILES.filter((file) => !contents.has(file));
if (missing.length > 0) {
  console.error('Blok kode tidak ditemukan di README-SETUP.md:');
  for (const file of missing) console.error('  - ' + file);
  process.exit(1);
}

const created = [];
const updated = [];
const unchanged = [];
const skipped = [];

for (const file of FILES) {
  const target = join(ROOT, file);
  const next = contents.get(file);
  const existing = await readIfExists(target);

  if (existing === null) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, next + '\n', 'utf8');
    created.push(file);
    continue;
  }

  if (normalize(existing) === next) {
    unchanged.push(file);
    continue;
  }

  if (!FORCE) {
    skipped.push(file);
    continue;
  }

  await writeFile(target, next + '\n', 'utf8');
  updated.push(file);
}

// Buat server/.env dari template bila belum ada.
const envPath = join(ROOT, 'server/.env');
if ((await readIfExists(envPath)) === null) {
  const example = await readFile(join(ROOT, 'server/.env.example'), 'utf8');
  await writeFile(envPath, example, 'utf8');
  created.push('server/.env (dari .env.example)');
}

const report = (label, items) => {
  if (items.length === 0) return;
  console.log(label + ':');
  for (const item of items) console.log('  - ' + item);
};

console.log('Selesai. ' + FILES.length + ' file backend diperiksa.\n');
report('Dibuat', created);
report('Diperbarui (--force)', updated);
report('Sudah sama', unchanged);
report('Dilewati karena sudah ada (pakai --force untuk menimpa)', skipped);

console.log('\nLangkah berikutnya:');
console.log('  npm --prefix server install');
console.log('  npm run seed');
console.log('  npm run server');
