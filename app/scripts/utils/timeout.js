// @ts-check
/** @param {number} ms */
const timeout = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export default timeout;
