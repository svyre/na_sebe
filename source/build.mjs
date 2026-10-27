import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizeStyles } from './scripts/optimize-styles.mjs';

const SOURCE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

// Keep this order: later application rules override the original base stylesheet.
const STYLESHEETS = [
  'styles/vendor/tailwind.css',
  'styles/base.css',
  'styles/vendor/tailwind-properties.css',
  'styles/theme.css',
  'styles/layout.css',
  'styles/stories.css',
  'styles/animations.css',
  'styles/room.css',
  'styles/development.css',
  'styles/campaign.css',
  'styles/narrative.css',
  'styles/tutorial.css',
];

function readStyles() {
  const fontFace = `
@font-face {
  font-family: Onest;
  src: url('./assets/Onest.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;
  const styles = STYLESHEETS.map((filename) =>
    fs.readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8'),
  );
  return [fontFace, ...styles].join('\n');
}

function createPage() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'">
    <meta name="theme-color" content="#132d50">
    <meta name="description" content="Первый год самостоятельной жизни: бюджет, учёба, работа и решения с последствиями.">
    <title>на себе</title>
    <link rel="icon" href="./favicon.svg">
    <link rel="stylesheet" href="./styles.css">
    <script src="./app.js" defer></script>
  </head>
  <body>
    <div id="root"></div>
    <noscript>Для игры включи JavaScript в браузере.</noscript>
  </body>
</html>`;
}

export async function buildPage(esbuild, outputDirectory) {
  const output = outputDirectory || path.resolve(SOURCE_DIRECTORY, '..');
  const result = await esbuild.build({
    absWorkingDir: SOURCE_DIRECTORY,
    entryPoints: ['entry.tsx'],
    outdir: output,
    entryNames: 'app',
    assetNames: 'assets/[name]-[hash]',
    publicPath: './',
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    treeShaking: true,
    legalComments: 'inline',
    loader: { '.webp': 'file', '.svg': 'file' },
    charset: 'utf8',
    jsx: 'automatic',
    tsconfig: 'tsconfig.json',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const script = result.outputFiles.find((file) => file.path === path.join(output, 'app.js'));
  if (!script || script.text.includes('/api/room')) {
    throw new Error('Проверь состав клиентской сборки: ожидалась только одиночная игра.');
  }
  const sources = ['app', 'lib'].flatMap((directory) =>
    fs
      .readdirSync(path.join(SOURCE_DIRECTORY, directory), { recursive: true })
      .filter((filename) => /\.tsx?$/.test(filename))
      .map((filename) => fs.readFileSync(path.join(SOURCE_DIRECTORY, directory, filename), 'utf8')),
  );
  const styles = await optimizeStyles(readStyles(), sources);
  const files = [];
  for (const file of result.outputFiles) {
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(file.path, file.contents);
    files.push(path.relative(output, file.path));
  }
  for (const [name, content] of [
    ['index.html', createPage()],
    ['styles.css', styles.css],
    ['.nojekyll', ''],
  ]) {
    fs.writeFileSync(path.join(output, name), content);
    files.push(name);
  }
  for (const [source, destination] of [
    ['assets/Onest.woff2', 'assets/Onest.woff2'],
    ['favicon.svg', 'favicon.svg'],
  ]) {
    fs.copyFileSync(path.join(SOURCE_DIRECTORY, source), path.join(output, destination));
    files.push(destination);
  }
  const stats = {
    directory: output,
    files: files.sort(),
    bytes: files.reduce((sum, name) => sum + fs.statSync(path.join(output, name)).size, 0),
    scriptBytes: script.contents.byteLength,
    cssBeforeBytes: styles.beforeBytes,
    cssAfterBytes: styles.afterBytes,
    removedSelectors: styles.removedSelectors,
  };
  console.log(JSON.stringify(stats));
  return stats;
}

const isCommandLineRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCommandLineRun) {
  await buildPage(await import('esbuild'));
}
