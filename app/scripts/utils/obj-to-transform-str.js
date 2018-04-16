const valsToStr = vals => vals.join(', ');

const typedValToStr = ({ val, type }) => `${val}${type}`;

const typedValsToStr = typedVals => typedVals
  .map(typedValToStr)
  .join(', ');

/**
 * Translates an CSS transform definition object into a definition string.
 * @param   {object}  obj  Definition object.
 * @return  {string}  Definiton string.
 */
const objToTransformStr = obj => Object.keys(obj).map((key) => {
  try {
    switch (key) {
      case 'translate':
      case 'rotate3d':
      case 'translate3d':
        return `${key}(${typedValsToStr(obj[key])})`;

      case 'perspective':
      case 'translateX':
      case 'translateY':
      case 'translateZ':
      case 'rotate':
      case 'rotateX':
      case 'rotateY':
      case 'rotateZ':
      case 'skewX':
      case 'skewY':
        return `${key}(${typedValToStr(obj[key])})`;

      case 'matrix':
      case 'matrix3d':
      case 'scale':
      case 'scale3d':
        return `scale(${valsToStr(obj[key])})`;

      case 'scaleX':
      case 'scaleY':
      case 'scaleZ':
        return `${key}(${obj[key]})`;

      default:
        // Nothing
    }
  } catch (e) {
    console.error('Invalid CSS transform definition', obj);
  }
  return '';
}).join(' ');

export default objToTransformStr;
