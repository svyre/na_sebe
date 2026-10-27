import { PurgeCSS } from 'purgecss';
import { transform } from 'esbuild';

// These class names are composed from ids at runtime, rather than written out in JSX.
const DYNAMIC_CLASS_FAMILIES = [/^hotspot-/, /^object-/, /^pose-/, /^level-/, /^cast-/];

export async function optimizeStyles(styles, sources) {
  const [purged] = await new PurgeCSS().purge({
    content: sources.map((raw) => ({ raw, extension: 'tsx' })),
    css: [{ raw: styles }],
    defaultExtractor: (content) => content.match(/[A-Za-z0-9_:/-]+/g) || [],
    safelist: { standard: DYNAMIC_CLASS_FAMILIES },
    dynamicAttributes: [
      'aria-expanded',
      'aria-selected',
      'aria-pressed',
      'data-motion',
      'data-tutorial-highlight',
      'data-housing',
      'data-season',
      'data-upgraded',
      'data-emotion',
    ],
    // Keep motion and font definitions; their use is controlled by CSS and OS preferences.
    keyframes: false,
    fontFace: false,
    variables: false,
    rejected: true,
  });
  const minified = await transform(purged.css, {
    loader: 'css',
    minify: true,
    legalComments: 'inline',
  });
  return {
    css: minified.code,
    beforeBytes: Buffer.byteLength(styles),
    afterBytes: Buffer.byteLength(minified.code),
    removedSelectors: purged.rejected.length,
  };
}
