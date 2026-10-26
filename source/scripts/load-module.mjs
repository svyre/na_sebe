import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

/** Bundle local TypeScript imports before loading a model in a Node check. */
export async function loadModule(relativePath) {
  const entry = fileURLToPath(new URL(relativePath, import.meta.url));
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    logLevel: 'silent',
  });
  const encoded = Buffer.from(result.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}
