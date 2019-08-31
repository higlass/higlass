export default function emptyBody() {
  const node = global.document.body;

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
