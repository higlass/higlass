// @ts-nocheck
export default function createDiv() {
  const div = global.document.createElement('div');
  global.document.body.appendChild(div);
  return div;
}
