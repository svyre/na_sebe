import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function buildPage(esbuild,outputDirectory) {
  const root=path.dirname(fileURLToPath(import.meta.url));
  const output=outputDirectory||path.resolve(root,'..');
  const result=await esbuild.build({
    absWorkingDir:root,entryPoints:['entry.tsx'],bundle:true,write:false,format:'iife',
    platform:'browser',target:['es2022'],minify:true,treeShaking:true,legalComments:'inline',
    loader:{'.png':'dataurl'},charset:'utf8',jsx:'automatic',tsconfig:'tsconfig.json',
    define:{'process.env.NODE_ENV':'"production"'},metafile:true,
  });
  const font=fs.readFileSync(path.join(root,'assets/Onest.ttf')).toString('base64');
  const css=`@font-face{font-family:Onest;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:100 900;font-style:normal;font-display:swap;}`+['styles.css','redesign.css','story.css','scenes.css'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
  const script=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
  if(script.includes('/api/room'))throw new Error('Static version contains a room endpoint.');
  const favicon='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'favicon.svg')).toString('base64');
  const html=`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#132d50"><meta name="description" content="Первый год самостоятельной жизни: бюджет, учёба, работа и решения с последствиями."><title>на себе</title><link rel="icon" href="${favicon}"><style>${css.replace(/<\/style/gi,'<\\/style')}</style></head>
<body><div id="root"></div><noscript>Для игры включи JavaScript в браузере.</noscript><script>${script}</script></body></html>`;
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,'index.html'),html);
  fs.writeFileSync(path.join(output,'.nojekyll'),'');
  console.log(JSON.stringify({file:path.join(output,'index.html'),bytes:Buffer.byteLength(html)}));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await buildPage(await import('esbuild'));
}
