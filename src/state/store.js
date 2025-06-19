import { configureStore } from '@reduxjs/toolkit';
import { Set } from 'immutable';
import logger from 'redux-logger';

export { actions } from './actions.js';

const { freeze } = Object;

export const defaultState = freeze({
  paneFocus: 'project',
  mode: 'select',
  projectRoot: null,
  tree: null,
  expandedPaths: new Set(),
});

export const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case 'SELECT_NODE': {
      return freeze({ ...state, paneFocus: 'hierarchy' });
    }

    case 'DROP': {
      return freeze({ ...state, dragSource: null, doubleClickTarget: null });
    }

    case 'OPEN_PROJECT': {
      return freeze({ ...state, projectRoot: action.value.projectRoot, tree: action.value.tree });
    }

    case 'EXPAND_FOLDER': {
      return freeze({
        ...state,
        expandedPaths: state.expandedPaths.add('/' + action.value.path.join('/')),
      });
    }

    case 'COLLAPSE_FOLDER': {
      return freeze({
        ...state,
        expandedPaths: state.expandedPaths.delete('/' + action.value.path.join('/')),
      });
    }

    case 'UPDATE_TREE': {
      return freeze({ ...state, tree: action.value.tree });
    }

    default:
      return state;
  }
};

export const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: true,
    }).concat(logger),
});
