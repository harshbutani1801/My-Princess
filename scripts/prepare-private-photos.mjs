import { createCipheriv, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDirectory = path.join(projectRoot, 'private-images', 'aayushi');
const outputDirectory = path.join(projectRoot, 'public', 'secure-images');
const linkFile = path.join(projectRoot, '.private-share-link.txt');
const siteArgument = process.argv[2];
const supportedTypes = new Map([
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.webp', 'image/webp'], ['.avif', 'image/avif'], ['.svg', 'image/svg+xml'],
]);

if (!siteArgument) {
  console.error('Usage: npm run photos:encrypt -- https://your-name.github.io/your-repo/');
  process.exit(1);
}

let siteUrl;
try {
  siteUrl = new URL(siteArgument);
  if (!['http:', 'https:'].includes(siteUrl.protocol)) throw new Error('Use an http or https URL.');
  if (!siteUrl.pathname.endsWith('/')) siteUrl.pathname += '/';
} catch {
  console.error('Provide the full http(s) URL where the site will be hosted.');
  process.exit(1);
}

let names;
try {
  names = (await readdir(inputDirectory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && supportedTypes.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
} catch {
  console.error('Create private-images/aayushi and put your photos there first.');
  process.exit(1);
}

if (names.length === 0) {
  console.error('No supported photos found. Add .jpg, .png, .webp, or .avif files to private-images/aayushi.');
  process.exit(1);
}

const ids = names.map(name => path.basename(name, path.extname(name)));
if (new Set(ids).size !== ids.length) {
  console.error('Use only one file per photo name. For example, remove the sample college-memory.svg before adding college-memory.jpg.');
  process.exit(1);
}

const key = randomBytes(32);
const manifest = { version: 1, photos: [] };
await mkdir(outputDirectory, { recursive: true });

for (const name of names) {
  const extension = path.extname(name).toLowerCase();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = await readFile(path.join(inputDirectory, name));
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const encryptedName = `${randomUUID()}.bin`;
  await writeFile(path.join(outputDirectory, encryptedName), encrypted, { flag: 'wx' });
  manifest.photos.push({
    source: `/images/aayushi/${path.basename(name, extension)}.jpg`,
    file: encryptedName,
    iv: iv.toString('base64url'),
    type: supportedTypes.get(extension),
  });
}

const temporaryManifest = path.join(outputDirectory, `manifest-${randomUUID()}.tmp`);
await writeFile(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
await rename(temporaryManifest, path.join(outputDirectory, 'manifest.json'));

const shareUrl = new URL(siteUrl);
shareUrl.hash = `key=${key.toString('base64url')}`;
await writeFile(linkFile, `${shareUrl.href}\n`, { mode: 0o600 });

console.log(`Encrypted ${names.length} photo(s) into public/secure-images.`);
console.log('The secret link is in .private-share-link.txt. That file is gitignored; send the link privately.');
