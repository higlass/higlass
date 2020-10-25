const decToHexStr = dec => (dec + 16 ** 6).toString(16).substr(-6);

export default decToHexStr;
