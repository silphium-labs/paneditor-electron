import { useContext, Switch, Match } from 'solid-js';
import { FileTree } from '../FileTree/FileTree.jsx';
import { StoreContext } from '../../state/solid';

export const ProjectContext = () => {
  let { store, actions } = useContext(StoreContext);

  return (
    <Switch>
      <Match when={!store.projectRoot}>
        <button onClick={actions.openProject}> Open project folder </button>
      </Match>
      <Match when={store.projectRoot}>
        <FileTree tree={store.tree} />
      </Match>
    </Switch>
  );
};

export default ProjectContext;
