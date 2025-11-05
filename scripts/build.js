// Simple build script to prepare frontend assets into dist/static
// - Validates presence of UI standards and core files
// - Copies static assets to dist/static
// - Generates a small manifest for debugging

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

async function ensureDir(dir) {
  await fse.mkdirp(dir);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const srcStatic = path.join(projectRoot, 'static');
  const distDir = path.join(projectRoot, 'dist');
  const distStatic = path.join(distDir, 'static');

  // Validate source static exists
  if (!fs.existsSync(srcStatic)) {
    throw new Error(`Missing source static directory: ${srcStatic}`);
  }

  // Validate UI standards presence per user's rule
  const requiredFiles = [
    path.join(srcStatic, 'styles', 'i18n-ui-standards.js'),
    path.join(srcStatic, 'styles', 'i18n-global.css'),
    path.join(srcStatic, 'styles', 'ui-standards.css'),
    path.join(srcStatic, 'index.html'),
  ];
  const missing = requiredFiles.filter(p => !fs.existsSync(p));
  if (missing.length) {
    throw new Error(`Missing required frontend files: \n- ${missing.join('\n- ')}`);
  }

  // Prepare dist/static
  await ensureDir(distStatic);
  await fse.emptyDir(distStatic);

  // Copy all static assets
  await fse.copy(srcStatic, distStatic, { overwrite: true });

  // Generate manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: srcStatic,
    output: distStatic,
    files: await fse.readdir(distStatic),
  };
  await fse.writeFile(path.join(distStatic, 'build-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('Frontend build complete. Output:', distStatic);
}

main().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});