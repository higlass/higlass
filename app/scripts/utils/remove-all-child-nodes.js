const removeAllChildNodes = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

export default removeAllChildNodes;
