/* global window */

import { Path } from '@bablr/agast-helpers/path';
import { sourceTextFor } from '@bablr/agast-helpers/tree';
import { reifyExpression } from '@bablr/agast-vm-helpers';
import { parse } from '@bablr/boot';
import cstml from '@bablr/boot/languages/cstml';
import { buildBoolean, buildIdentifier } from '@bablr/helpers/builders';

let buildEnts = (ents) => {
  return reifyExpression(
    parse(
      cstml,
      'TreeNode',
      ['<File { isDir: true }>', ...ents.map((ent) => ' ').slice(0, -1), '</>'],
      ents.map((ent) => {
        return parse(
          cstml,
          'Property',
          [`${sourceTextFor(buildIdentifier(ent.name))}: <File { isDir: `, ` }> <//> </>`],
          [buildBoolean(ent.isDir)],
        );
      }),
    ),
  );
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
    return { type: 'SELECT_NODE', value: {} };
  },

  pickFile: (path) => {
    return { type: 'PICK_FILE', value: { path } };
  },

  openProject: () => {
    return async (dispatch) => {
      let projectRoot = await window.electron.selectDirectory();

      if (!projectRoot) return;

      dispatch({
        type: 'OPEN_PROJECT',
        value: {
          projectRoot,
          tree: reifyExpression(parse(cstml, 'TreeNode', `<File { isDir: true }> <//> </>`)),
        },
      });

      // window.project.open(projectRoot);
      let ents = await window.electron.listDirectory(projectRoot);

      let tree = buildEnts(ents);

      dispatch(actions.updateTree(tree));
    };
  },

  expandFolder: (path) => {
    return async (dispatch, getState) => {
      dispatch({ type: 'EXPAND_FOLDER', value: { path } });

      let { projectRoot, tree } = getState();

      let ents = await window.electron.listDirectory(projectRoot + '/' + path.join('/'));

      let subtree = buildEnts(ents);

      dispatch(actions.updateTree(Path.from(tree).get(path).replaceWith(subtree).atDepth(0).node));
    };
  },

  collapseFolder: (path) => {
    return async (dispatch, getState) => {
      dispatch({ type: 'COLLAPSE_FOLDER', value: { path } });

      let { projectRoot, tree } = getState();

      let subtree = reifyExpression(parse(cstml, 'TreeNode', [`<File { isDir: true }> <//> </>`]));

      dispatch(actions.updateTree(Path.from(tree).get(path).replaceWith(subtree).atDepth(0).node));
    };
  },

  updateTree: (tree) => {
    return { type: 'UPDATE_TREE', value: { tree } };
  },
};
