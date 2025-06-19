import { useContext } from 'solid-js';
import { Property } from '@bablr/agast-helpers/symbols';
import { ChevronDown, ChevronRight, File } from 'lucide-solid';
import { BTree } from './BTree.jsx';
import { StoreContext } from '../../state/solid.js';

import './FileTree.css';
import classNames from 'classnames';

export const FileTree = ({ tree, depth = 0, pathPrefix = '' }) => {
  let { actions, store } = useContext(StoreContext);

  let btree = (
    <BTree tree={tree.children}>
      {(child) => {
        if (child.type === Property) {
          let { reference, node } = child.value;

          return () => {
            if (node.type) {
              let { isDir } = node.attributes;

              let children = () => {
                return isDir && store.expandedPaths.has(fullPath) ? (
                  <FileTree tree={node} depth={depth + 1} pathPrefix={fullPath} />
                ) : null;
              };
              let icon = () => {
                return !isDir ? (
                  <File class="icon" size={16} />
                ) : store.expandedPaths.has(fullPath) ? (
                  <ChevronDown class="icon" size={18} />
                ) : (
                  <ChevronRight class="icon" size={18} />
                );
              };
              let fullPath = pathPrefix + '/' + reference.name;

              return (
                <div
                  class={classNames({ file: true, 'is-dir': isDir })}
                  style={{
                    'padding-left': `22px`,
                  }}
                  data-name={reference.name}
                  onClick={
                    depth > 0
                      ? null
                      : async (e) => {
                          let path = [];

                          let node = e.target;

                          while (node && !node.dataset.name) {
                            node = node.parentElement;
                          }

                          while (node.dataset.name) {
                            path.push(node.dataset.name);
                            node = node.parentElement;
                          }

                          path.reverse();

                          await actions.expandFolder(path);
                        }
                  }
                >
                  {icon}
                  {reference.name}
                  {isDir ? '/' : ''}
                  {children}
                </div>
              );
            } else {
              return (
                <div
                  style={{
                    'padding-left': `24px`,
                  }}
                >
                  ...
                </div>
              );
            }
          };
        }
      }}
    </BTree>
  );

  return depth === 0 ? <div class="file-tree">{btree}</div> : btree;
};

export default FileTree;
