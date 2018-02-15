/**
 * Set-like dictionary with convenience methods for iteration.
 *
 * @description
 *
 * @param  {string}  keyProp  Property identifying items.
 * @param  {Array}  items  Items to be added.
 */
const KeySet = function KeySet(keyProp = 'id', items = []) {
  const store = {};
  const getStore = () => store;
  const getKeyProp = () => keyProp;

  Object.defineProperty(this, '_keyProp', { get: getKeyProp });
  Object.defineProperty(this, '_store', { get: getStore });

  items.forEach((item) => { this.add(item); });
};

/* ------------------------------- Properties ------------------------------- */

function getSize() {
  return this.keys.length;
}

Object.defineProperty(KeySet.prototype, 'size', { get: getSize });

function getKeys() {
  return Object.keys(this._store);
}

Object.defineProperty(KeySet.prototype, 'keys', { get: getKeys });

function getValues() {
  return this.keys.map(key => this._store[key]);
}

Object.defineProperty(KeySet.prototype, 'values', { get: getValues });

/* --------------------------------- Methods -------------------------------- */

KeySet.prototype[Symbol.iterator] = function* iterator() {
  let nextIndex = 0;
  const values = this.values;
  const numValues = values.length;

  while (nextIndex < numValues) {
    yield values[nextIndex++];
  }
};

/**
 * Add an item to the key set
 * @param  {object}  item  Item to be added. Needs to have the key property.
 */
KeySet.prototype.add = function add(item) {
  if (!item || !item[this._keyProp]) return false;

  this._store[item[this._keyProp]] = item;
  return true;
};

/**
 * Delete all items in the set
 */
KeySet.prototype.clear = function clear() {
  this.keys.forEach((key) => {
    this._store[key] = undefined;
    delete this._store[key];
  });
};

/**
 * Shallowly clone the key set, i.e., the key set will be a new instance but
 *   the items will reference the same objects.
 * @return  {KeySet}  Shallowly cloned key set.
 */
KeySet.prototype.clone = function clone() {
  return new KeySet(this._keyProp, this.values);
};

/**
 * Delete an item from the set by its key or by passing in the item itself
 * @param   {object}  itemOrKey  Either the key property of the item or the
 *   items itsel.
 */
KeySet.prototype.delete = function deleteMethod(itemOrKey) {
  if (!itemOrKey) return;

  const key = this._store[itemOrKey] ? itemOrKey : itemOrKey[this._keyProp];

  if (typeof key === 'undefined') return;

  this._store[key] = undefined;
  delete this._store[key];
};

/**
 * Evaluate whether every item on the set returns a true value given the
 *   evaluator function.
 * @param   {function}  f  Evaluator function. Receives the items as the first
 *   parameter.
 * @return  {boolean}  If `true` all items on this set evaluate to `true`.
 */
KeySet.prototype.every = function every(f) {
  return this.values.every(f);
};

/**
 * Filter items by the filter function and return new KeySet with only the
 *   filtered items.
 * @param   {function}  f  Filter function.  Receives the items as the first
 *   parameter.
 * @return  {KeySet}  A new KeySet with only the filtered items.
 */
KeySet.prototype.filter = function filter(f) {
  const newKeySet = new KeySet(this._keyProp);
  this.keys
    .filter(key => f(this._store[key]))
    .forEach((key) => { newKeySet.add(this._store[key]); });
  return newKeySet;
};

/**
 * Apply the callback function on every item
 * @param   {function}  f  Function to be applied on every item. Receives the
 *   items as the first parameter and the index as the second parameter.
 */
KeySet.prototype.forEach = function forEach(f) {
  this.values.forEach((val, i) => { f(val, i); });
};

/**
 * Get an item by key
 * @param   {number|string|symbol}  key  Identifier of the item to be retrieved.
 * @return  {object}  Item to be retrieved if found.
 */
KeySet.prototype.get = function get(key) {
  return this._store[key];
};

/**
 * Test whether an item is on the set.
 * @param   {object}  item  Item which membership is to be tested.
 * @return  {boolean}  If `true` item is on the set.
 */
KeySet.prototype.has = function has(item) {
  if (!item || !item[this._keyProp]) return false;
  return !!this._store[item[this._keyProp]];
};

/**
 * Reduce the set of items to a single value using the reducer function.
 * @param   {function}  f  Reducer function like for `Array.reduce`.
 * @param   {*}  initial  Initial value for the reducer.
 * @return  {*}  Value created by the reducer
 */
KeySet.prototype.reduce = function reduce(f, initial) {
  return this.values.reduce(f, initial);
};

/**
 * Evaluate whether some item on the set returns a true value given the
 *   evaluator function.
 * @param   {function}  f  Evaluator function. Receives the items as the first
 *   parameter.
 * @return  {boolean}  If `true` some item on this set evaluates to `true`.
 */
KeySet.prototype.some = function some(f) {
  return this.values.some(f);
};

/**
 * Translate the items of the set to an Array of new form based on the given translator.
 * @param   {Function}  f  Translator function being applied on every item of the set.
 * @return  {Array}  List of translated items.
 */
KeySet.prototype.translate = function translate(f) {
  return this.values.map(value => f(value));
};


export default KeySet;
