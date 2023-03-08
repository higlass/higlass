import { ElementResizeListener } from '../services';

const getElementDim = (element) => {
  ElementResizeListener.listen();

  return [element.clientWidth, element.clientHeight];
};

export default getElementDim;
