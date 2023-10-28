/**
 * Exposed map function. You can do cool stuff with that!
 *
 * @description
 * The pure map function is more powerful because it can be used on data types
 * other than Array too.
 *
 * @template T, B
 * @param {(item: T, idx?: number) => B} f - Mapping function.
 * @return {(x: Array<T>) => Array<B>} Mapped array.
 */
// @ts-expect-error - TS can't infer the type of the returned function.
const map = (f) => (x) => Array.prototype.map.call(x, f);

export default map;
