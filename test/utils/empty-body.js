// @ts-nocheck
export default function emptyBody() {
  const myNode = global.document.body;
  while (myNode.lastElementChild) {
    myNode.removeChild(myNode.lastElementChild);
  }
}
