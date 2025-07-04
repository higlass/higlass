// @ts-nocheck
/**
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */
function LruCache(limit) {
  // Current size of the cache. (Read-only).
  this.size = 0;
  // Maximum number of items this cache can hold.
  this.limit = limit;
  this._keymap = {};
}

/**
 * Put <value> into the cache associated with <key>. Returns the entry which was
 * removed to make room for the new entry. Otherwise undefined is returned
 * (i.e. if there was enough room already).
 */
function put(key, value) {
  const entry = { key, value };
  // Note: No protection agains replacing, and thus orphan entries. By design.
  this._keymap[key] = entry;
  if (this.tail) {
    // link previous tail to the new tail (entry)
    this.tail.newer = entry;
    entry.older = this.tail;
  } else {
    // we're first in -- yay
    this.head = entry;
  }
  // add new entry to the end of the linked list -- it's now the freshest entry.
  this.tail = entry;
  if (this.size === this.limit) {
    // we hit the limit -- remove the head
    return this.shift();
  }
  // increase the size counter
  this.size += 1;
  return undefined;
}

/**
 * Purge the least recently used (oldest) entry from the cache. Returns the
 * removed entry or undefined if the cache was empty.
 *
 * If you need to perform any form of finalization of purged items, this is a
 * good place to do it. Simply override/replace this function:
 *
 *   var c = new LruCache(123);
 *   c.shift = function() {
 *     var entry = LruCache.prototype.shift.call(this);
 *     doSomethingWith(entry);
 *     return entry;
 *   }
 */
function shift() {
  // todo: handle special case when limit === 1
  const entry = this.head;
  if (entry) {
    if (this.head.newer) {
      // advance the list
      this.head = this.head.newer;
      this.head.older = undefined;
    } else {
      // the cache is exhausted
      this.head = undefined;
      this.tail = undefined;
    }
    // Remove last strong reference to <entry> and remove links from the purged
    // entry being returned:
    entry.newer = undefined;
    entry.older = undefined;
    // delete is slow, but we need to do this to avoid uncontrollable growth:
    delete this._keymap[entry.key];
    this.size -= 1;
  }
  return entry;
}

/**
 * Get and register recent use of <key>. Returns the value associated with <key>
 * or undefined if not in cache.
 */
function get(key, returnEntry) {
  // First, find our cache entry
  const entry = this._keymap[key];
  if (entry === undefined) return undefined; // Not cached. Sorry.
  // As <key> was found in the cache, register it as being requested recently
  if (entry === this.tail) {
    // Already the most recenlty used entry, so no need to update the list
    return returnEntry ? entry : entry.value;
  }
  // HEAD--------------TAIL
  //   <.older   .newer>
  //  <--- add direction --
  //   A  B  C  <D>  E
  if (entry.newer) {
    if (entry === this.head) this.head = entry.newer;
    entry.newer.older = entry.older; // C <-- E.
  }
  if (entry.older) entry.older.newer = entry.newer; // C. --> E
  entry.newer = undefined; // D --x
  entry.older = this.tail; // D. --> E
  if (this.tail) this.tail.newer = entry; // E. <-- D
  this.tail = entry;

  return returnEntry ? entry : entry.value;
}

// ----------------------------------------------------------------------------
// Following code is optional and can be removed without breaking the core
// functionality.

/**
 * Check if <key> is in the cache without registering recent use. Feasible if
 * you do not want to chage the state of the cache, but only "peek" at it.
 * Returns the entry associated with <key> if found, or undefined if not found.
 */
function find(key) {
  return this._keymap[key];
}

/**
 * Update the value of entry with <key>. Returns the old value, or undefined if
 * entry was not in the cache.
 */
function set(key, value) {
  const entry = this.get(key, true);
  let oldvalue;
  if (entry) {
    oldvalue = entry.value;
    entry.value = value;
  } else {
    oldvalue = this.put(key, value);
    if (oldvalue) oldvalue = oldvalue.value;
  }
  return oldvalue;
}

/**
 * Remove entry <key> from cache and return its value. Returns undefined if not
 * found.
 */
function remove(key) {
  const entry = this._keymap[key];
  if (!entry) return undefined;
  delete this._keymap[entry.key]; // need to do delete unfortunately
  if (entry.newer && entry.older) {
    // relink the older entry with the newer entry
    entry.older.newer = entry.newer;
    entry.newer.older = entry.older;
  } else if (entry.newer) {
    // remove the link to us
    entry.newer.older = undefined;
    // link the newer entry to head
    this.head = entry.newer;
  } else if (entry.older) {
    // remove the link to us
    entry.older.newer = undefined;
    // link the newer entry to head
    this.tail = entry.older;
  } else {
    this.head = undefined;
    this.tail = undefined;
  }

  this.size -= 1;
  return entry.value;
}

/** Removes all entries */
function removeAll() {
  // This should be safe, as we never expose strong refrences to the outside
  this.head = undefined;
  this.tail = undefined;
  this.size = 0;
  this._keymap = {};
}

/**
 * Return an array containing all keys of entries stored in the cache object, in
 * arbitrary order.
 */
function keys() {
  return Object.keys(this._keymap);
}

/**
 * Call `fun` for each entry. Starting with the newest entry if `desc` is a true
 * value, otherwise starts with the oldest (head) enrty and moves towards the
 * tail.
 *
 * `fun` is called with 3 arguments in the context `context`:
 *   `fun.call(context, Object key, Object value, LruCache self)`
 */
function forEach(fun, context, desc) {
  let entry;

  if (context === true) {
    desc = true;
    context = undefined;
  } else if (typeof context !== 'object') {
    context = this;
  }

  if (desc) {
    entry = this.tail;
    while (entry) {
      fun.call(context, entry.key, entry.value, this);
      entry = entry.older;
    }
  } else {
    entry = this.head;
    while (entry) {
      fun.call(context, entry.key, entry.value, this);
      entry = entry.newer;
    }
  }
}

/** Returns a JSON (array) representation */
function toJSON() {
  const s = [];
  let entry = this.head;
  while (entry) {
    s.push({ key: entry.key.toJSON(), value: entry.value.toJSON() });
    entry = entry.newer;
  }
  return s;
}

/** Returns a String representation */
// biome-ignore lint/suspicious/noShadowRestrictedNames: Scoped to this module
function toString() {
  let s = '';
  let entry = this.head;
  while (entry) {
    s += `${String(entry.key)}:${entry.value}`;
    entry = entry.newer;
    if (entry) s += ' < ';
  }
  return s;
}

Object.assign(LruCache.prototype, {
  put,
  get,
  find,
  keys,
  set,
  shift,
  remove,
  removeAll,
  forEach,
  toJSON,
  toString,
});

export default LruCache;
