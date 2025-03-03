import { ElementResizeListener } from '../services';

/**
 * Get the dimensions of an element
 * @param {HTMLElement} element - DOM element to get dimensions of.
 * @return {[width: number, height: number]} The width and height of the element.
 */
const getElementDim = (element) => {
  ElementResizeListener.listen();

  return [element.clientWidth, element.clientHeight];
};

export default getElementDim;
