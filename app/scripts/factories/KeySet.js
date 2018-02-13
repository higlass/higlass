/**
 * Set-like dictionary with convenience methods for iteration.
 *
 * @description
 *
 * @param  {string}  keyProp  Property identifying items.
 * @param  {Array}  items  Items to be added.
 */
const KeySet = function KeySet(keyProp, items = []) {
  items.forEach((item) => { this.add(item); });

  const store = {};
  const getStore = () => store;
  const getKeyProp = () => keyProp;

  Object.defineProperty(this, '_keyProp', { get: getKeyProp });
  Object.defineProperty(this, '_store', { get: getStore });
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

KeySet.prototype.add = function add(item) {
  if (!item[this._keyProp]) return;

  this._store[item[this._keyProp]] = item;
};

KeySet.prototype.clear = function clear() {
  this.keys.forEach((key) => {
    this._store[key] = undefined;
    delete this._store[key];
  });
};


KeySet.prototype.clone = function clone() {
  return new KeySet(this._keyProp, this.values);
};

KeySet.prototype.delete = function deleteMethod(item) {
  if (item[this._keyProp]) return;

  this._store[item[this._keyProp]] = undefined;
  delete this._store[item[this._keyProp]];
};

KeySet.prototype.every = function every(f) {
  return this.values.every(f);
};

KeySet.prototype.filter = function filter(f) {
  const newKeySet = new KeySet(this._keyProp);
  this.keys
    .filter(key => f(this._store[key]))
    .forEach((key) => { newKeySet.add(this._store[key]); });
  return newKeySet;
};

KeySet.prototype.forEach = function forEach(f) {
  this.values.forEach((val, i) => { f(val, i); });
};

KeySet.prototype.get = function get(key) {
  return this._store[key];
};

KeySet.prototype.has = function has(item) {
  if (!item[this._keyProp]) return false;
  return !!this._store[item[this._keyProp]];
};

KeySet.prototype.map = function map(f) {
  const newKeySet = this.clone();
  this.keys.forEach((key) => { newKeySet.add(f(this._store[key])); });
  return newKeySet;
};

KeySet.prototype.reduce = function reduce(f, initial) {
  return this.values.reduce(f, initial);
};

KeySet.prototype.some = function some(f) {
  return this.values.some(f);
};


export default KeySet;
