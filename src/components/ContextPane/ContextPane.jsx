import { useContext, Switch, Match } from 'solid-js';

import HierarchyContext from './HierarchyContext.jsx';
import SnippetsContext from './SnippetsContext.jsx';
import ProjectContext from './ProjectContext.jsx';
import { StoreContext } from '../../state/solid.js';

import './ContextPane.css';

function ContextPane() {
  let { store } = useContext(StoreContext);

  return (
    <>
      <div class="context-pane">
        <Switch>
          <Match when={store.paneFocus === 'hierarchy'}>
            <HierarchyContext />
          </Match>
          <Match when={store.paneFocus === 'snippets'}>
            <SnippetsContext />
          </Match>
          <Match when={store.paneFocus === 'project'}>
            <ProjectContext />
          </Match>
        </Switch>
      </div>
    </>
  );
}

export default ContextPane;
