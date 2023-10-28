// @ts-nocheck
/**
 * Object query language using dot-notation.
 *
 * @description  In order to query an object dynamically do:
 *   ```
 *   const myFancyObj = { my: { fancy: { property: 'Sweet!' } } };
 *   const myNotSoFancyObj = { noSoFancy: 'buh!' };
 *
 *   const myFancyQuery = q('my.fancy.property');
 *
 *   console.log(myFancyQuery(myFancyObj)) ==> 'Sweet!'
 *   console.log(myFancyQuery(myNotSoFancyObj)) ==> undefined
 *   ```
 * @param {string} queryStr - dot-notation query string
 * @return {unknown}
 */
const q = (queryStr) => {
  try {
    const queries = queryStr.split('.');
    return (rootObj) => {
      let obj = rootObj;
      queries.forEach((query) => {
        obj = obj[query];
      });
      return obj;
    };
  } catch (e) {
    return undefined;
  }
};

// TODO(Trevor): This is not referenced anywhere in the codebase, but it is exported. Remove?
export default q;
