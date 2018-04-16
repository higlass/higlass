/**
 * Fast way to remove all child nodes.
 * @param   {object}  node  Parent node for which all child nodes areto be
 *   removed.
 */
const removeAllChildNodes = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

export default removeAllChildNodes;
