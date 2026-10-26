import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as esbuild from 'esbuild';
import { buildPage } from '../build.mjs';
import { optimizeStyles } from './optimize-styles.mjs';

let checks = 0;
async function check(name, run) {
  await run();
  checks++;
  console.log('PASS ' + name);
}

await check(
  'CSS pruning retains dynamic choices, focus rules and animation definitions',
  async () => {
    const result = await optimizeStyles(
      `
    .known { color: navy; }
    .not-used-in-the-app { display: none; }
    .pose-thinking { animation: idle 2s infinite; }
    .object-phone { fill: blue; }
    .hotspot-study { color: green; }
    .level-challenge { border-color: orange; }
    @media (max-width: 760px) { .known:focus-visible { outline: 2px solid blue; } }
    @keyframes idle { to { opacity: .9; } }
  `,
      ['<button className="known">'],
    );
    assert(!result.css.includes('.not-used-in-the-app'));
    for (const selector of [
      '.known',
      '.pose-thinking',
      '.object-phone',
      '.hotspot-study',
      '.level-challenge',
      ':focus-visible',
      '@keyframes',
    ]) {
      assert(result.css.includes(selector), selector);
    }
  },
);

const output = await fs.mkdtemp(path.join(os.tmpdir(), 'na-sebe-build-'));
try {
  const stats = await buildPage(esbuild, output);
  const html = await fs.readFile(path.join(output, 'index.html'), 'utf8');
  const styles = await fs.readFile(path.join(output, 'styles.css'), 'utf8');
  const script = await fs.readFile(path.join(output, 'app.js'), 'utf8');

  await check(
    'The web build keeps executable code and assets in separate local files',
    async () => {
      assert(/<script src="\.\/app\.js" defer><\/script>/.test(html));
      assert(html.includes('href="./styles.css"'));
      const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
      assert.equal(scripts.length, 1);
      assert(scripts.every((match) => match[1].trim() === ''));
      assert(!/data:[^;]+;base64,/.test(html + script + styles));
      assert(!/url\(["']?https?:/.test(styles));
      assert(!script.includes('/api/room'));
      assert(html.includes("connect-src 'none'"));
      assert(html.includes("script-src 'self'"));
      for (const file of stats.files) assert((await fs.stat(path.join(output, file))).isFile());
      assert(stats.files.some((file) => file.startsWith('assets/') && file.endsWith('.webp')));
      assert(stats.files.includes('assets/Onest.woff2'));
    },
  );

  await check(
    'The complete web build stays within its size budget and keeps room state styling',
    async () => {
      assert(stats.bytes < 2_500_000, `${stats.bytes} exceeds the 2.5 MB budget`);
      assert(stats.removedSelectors > 0);
      for (const name of [
        'room-night',
        'room-item-preview',
        'room-story-note',
        'scene-object-picked',
      ]) {
        assert(styles.includes(`.${name}`), name);
      }
      assert(styles.includes('data-motion=suspended'));
      assert(styles.includes('animation-play-state:paused'));
      assert.equal(await fs.readFile(path.join(output, '.nojekyll'), 'utf8'), '');
    },
  );
} finally {
  await fs.rm(output, { recursive: true, force: true });
}

console.log(JSON.stringify({ status: 'PASS', checks }));
