import { onCleanup, createContext } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

export function useRedux(rstore, actions) {
  const { 0: store, 1: setStore } = createStore(rstore.getState());
  const unsubscribe = rstore.subscribe(() => setStore(reconcile(rstore.getState())));
  onCleanup(() => unsubscribe());
  return { store, actions: mapActions(rstore, actions) };
}

const widths = new WeakMap();

const editStates = new WeakMap();

export const nodeBindings = new WeakMap();

export const StoreContext = createContext();

export const DocumentContext = createContext();

export const SelectionContext = createContext();

const { 0: editStore, 1: setEditStore } = createStore();

export const EditContext = createContext({
  widths,
  editStates,
  store: editStore,
  setStore: setEditStore,
});

function mapActions(store, actions) {
  const mapped = {};
  for (const key in actions) {
    mapped[key] = (...args) => {
      let builder = actions[key];
      let action = builder(...args);

      store.dispatch(action);
    };
  }
  return mapped;
}
