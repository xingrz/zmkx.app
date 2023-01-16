import _pbjs from 'protobufjs-cli/pbjs.js';
import _pbts from 'protobufjs-cli/pbts.js';
import { promisify } from 'util';
import { basename, join, resolve } from 'path';
import fs from 'fs-extra';

const pbjs = promisify(_pbjs.main);
const pbts = promisify(_pbts.main);

const SRC_DIR = resolve('./proto');
const DST_DIR = resolve('./src/proto');

for (const src of await fs.readdir(SRC_DIR)) {
  const id = basename(src);

  const js = await pbjs([
    '--target', 'static-module',
    '--wrap', 'es6',
    join(SRC_DIR, src)
  ]);

  await fs.outputFile(join(DST_DIR, `${id}.js`), js);

  const ts = await pbts([
    join(DST_DIR, `${id}.js`)
  ]);

  await fs.outputFile(join(DST_DIR, `${id}.d.ts`), ts);
}
