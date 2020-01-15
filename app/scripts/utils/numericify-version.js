const numericifyVersion = (version) => {
  const parts = version.split('.');
  const tailLen = parts.slice(1).join('').length;
  return +parts.join('') / 10 ** tailLen;
};

export default numericifyVersion;
