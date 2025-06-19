export const BTree = ({ tree, children }) => {
  return (
    <For each={Number.isFinite(tree[0]) ? tree[1] : tree}>
      {(subtree) => {
        if (Array.isArray(subtree)) {
          return <> {<BTree tree={subtree}>{children}</BTree>} </>;
        } else {
          return children(subtree);
        }
      }}
    </For>
  );
};

export default BTree;
