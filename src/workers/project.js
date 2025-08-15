/* global addEventListener */

import { streamParse } from 'bablr';
import { parse } from '@bablr/boot';
import { sourceTextFor } from '@bablr/agast-helpers/tree';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import * as bootCstml from '@bablr/boot/languages/cstml';
import { buildBoolean, buildIdentifier } from '@bablr/helpers/builders';

let projectRoot = null;
let projectTree = null;
let main = null;

let buildEnts = (ents) => {
  return reifyExpression(
    parse(
      bootCstml,
      'Node',
      ['<File { isDir: true }>', ...ents.map((ent) => ' ').slice(0, -1), '</>'],
      ents.map((ent) => {
        return parse(
          bootCstml,
          'Property',
          [`${sourceTextFor(buildIdentifier(ent.name))}: <File { isDir: `, ` }> <//> </>`],
          [buildBoolean(ent.isDir)],
        );
      }),
    ),
  );
};

addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'open-project': {
      if (projectRoot !== null) throw new Error();

      projectRoot = e.data.value.directory;
      main = e.source;

      if (!main) throw new Error();

      let ents = main.postMessage('list-directory', projectRoot);

      break;
    }

    case 'list-directory': {
      if (e.source !== main) throw new Error();

      projectTree = buildEnts(e.data.tree);
      break;
    }
  }
});
