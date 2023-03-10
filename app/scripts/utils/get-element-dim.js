import ElementResizeListener from './element-resize-listener';

const getElementDim = (element) => {
  ElementResizeListener.listen();

  return [element.clientWidth, element.clientHeight];
};

export default getElementDim;
