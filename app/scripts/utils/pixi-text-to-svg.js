/**
 * Export a PIXI text to an SVG element
 *
 * param {PIXI.Text} pixiText A PIXI.Text object that we want to create an SVG element for
 * returns {Element} A DOM SVG Element with all of the attributes set as to display
 * the given text.
 */
export const pixiTextToSvg = (pixiText) => {
  const g = document.createElement('g');
  const t = document.createElement('text');

  if (pixiText.anchor.x === 0) {
    t.setAttribute('text-anchor', 'start');
  } else if (pixiText.anchor.x === 1) {
    t.setAttribute('text-anchor', 'end');
  } else {
    t.setAttribute('text-anchor', 'middle');
  }

  t.setAttribute('font-family', pixiText.style.fontFamily);
  t.setAttribute('font-size', pixiText.style.fontSize);
  g.setAttribute('transform', `scale(${pixiText.scale.x},1)`);

  t.setAttribute('fill', pixiText.style.fill);
  t.innerHTML = pixiText.text;

  g.appendChild(t);
  g.setAttribute(
    'transform',
    `translate(${pixiText.x},${pixiText.y})scale(${pixiText.scale.x},1)`,
  );

  return g;
};

export default pixiTextToSvg;
