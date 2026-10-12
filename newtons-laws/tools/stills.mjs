// usage: node tools/stills.mjs outdir f1 f2 f3 ...   (bundle once, render many stills)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [,, outDir, ...frames] = process.argv;
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const url = await bundle({entryPoint: path.resolve('src/index.ts'), onProgress: () => {}});
const comp = await selectComposition({serveUrl: url, id: 'NewtonsLaws', browserExecutable});
for (const fr of frames) {
  await renderStill({composition: comp, serveUrl: url, frame: Number(fr), output: path.join(outDir, `f${String(fr).padStart(5, '0')}.png`), browserExecutable, imageFormat: 'png'});
  console.log('frame', fr);
}
