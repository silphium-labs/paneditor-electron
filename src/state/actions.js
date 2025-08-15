/* global window */

import { streamParse } from 'bablr';
import { parse, spam as m } from '@bablr/boot';
import { Path } from '@bablr/agast-helpers/path';
import { getStreamIterator, StreamIterable } from '@bablr/agast-helpers/stream';
import { sourceTextFor } from '@bablr/agast-helpers/tree';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import * as bootCstml from '@bablr/boot/languages/cstml';
import * as plainText from '@bablr/language-en-plain-text';
import * as js from '@bablr/language-en-esnext';
import { buildBoolean, buildIdentifier } from '@bablr/helpers/builders';
import { arrayLast } from 'iter-tools-es';

let $main = window.electronAPI;

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

function* __readFile(handle) {
  let chunk;

  while ((chunk = yield $main.readChunk(handle))) {
    yield* chunk;
  }
}

let readFile = (handle) => {
  return new StreamIterable(__readFile(handle));
};

export const actions = {
  mouseDown: () => {},
  startTouch: () => {},
  mouseOver: () => {},
  touchMove: () => {},
  mouseOut: () => {},
  endTouch: () => {},
  cancelTouch: () => {},
  mouseUp: () => {},
  startDrag: () => {},
  dragOver: () => {},
  endDrag: () => {},
  drop: () => {},

  selectNode: () => {
    return { type: 'SELECT_NODE', value: undefined };
  },

  openProject: () => {
    return async (dispatch) => {
      let projectRoot = await $main.selectDirectory();

      if (!projectRoot) return;

      await $main.openProject(projectRoot);
      dispatch({
        type: 'OPEN_PROJECT',
        value: {
          projectRoot,
          tree: reifyExpression(parse(bootCstml, 'Node', `<File { isDir: true }> <//> </>`)),
        },
      });

      let ents = await $main.listDirectory(projectRoot);

      let tree = buildEnts(ents);

      dispatch(actions.updateTree(tree));
    };
  },

  openFile: (path) => {
    return async (dispatch, getState) => {
      let { projectRoot } = getState();

      let handle = await $main.openFile(projectRoot + '/' + path.join('/'));

      dispatch({ type: 'OPEN_FILE', value: { path, handle } });

      let tags = streamParse(
        arrayLast(path).endsWith('.js') ? js : plainText,
        m`<*Text />`,
        readFile(handle),
      );

      let iter = getStreamIterator(tags);

      let step = iter.next();

      while (!step.done) {
        if (step instanceof Promise) {
          step = await step;
        }

        let tag = step.value;

        step = iter.next();
      }
    };
  },

  expandFolder: (path) => {
    return async (dispatch, getState) => {
      dispatch({ type: 'EXPAND_FOLDER', value: { path } });

      let { projectRoot, tree } = getState();

      let ents = await $main.listDirectory(projectRoot + '/' + path.join('/'));

      let subtree = buildEnts(ents);

      dispatch(actions.updateTree(Path.from(tree).get(path).replaceWith(subtree).atDepth(0).node));
    };
  },

  collapseFolder: (path) => {
    return async (dispatch, getState) => {
      dispatch({ type: 'COLLAPSE_FOLDER', value: { path } });

      let { tree } = getState();

      let subtree = reifyExpression(parse(bootCstml, 'Node', [`<File { isDir: true }> <//> </>`]));

      dispatch(actions.updateTree(Path.from(tree).get(path).replaceWith(subtree).atDepth(0).node));
    };
  },

  updateTree: (tree) => {
    return { type: 'UPDATE_TREE', value: { tree } };
  },
};
