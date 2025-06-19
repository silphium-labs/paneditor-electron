/* @refresh reload */
/* global document */
import { render } from 'solid-js/web';
import { actions, store } from './state/store.js';
import { StoreContext, useRedux } from './state/solid.js';
import Environment from './components/Environment/Environment.jsx';

import './index.css';

const root = document.getElementById('root');

function App() {
  return (
    <StoreContext.Provider value={useRedux(store, actions)}>
      <Environment />
    </StoreContext.Provider>
  );
}

render(() => <App />, root);
