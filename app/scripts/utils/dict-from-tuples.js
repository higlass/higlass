/**
 * Create a dictionary from a list of [key, value] pairs.
 *
 * TODO(Trevor): Replace with Object.fromEntries?
 *
 * @template {ReadonlyArray<readonly [PropertyKey, unknown]>} T
 * @param {T} tuples: A list of [key, value] pairs
 * @return {{ [Item in T[number] as Item[0]]: Item[1] }} A dictionary
 */
const dictFromTuples = (tuples) => {
  /** @type {Record<PropertyKey, unknown>} */
  const dict = {};

  tuples.forEach((x) => {
    dict[x[0]] = x[1];
  });

  // @ts-expect-error - TS inference not good enough to infer the correct type
  return dict;
};

export default dictFromTuples;
