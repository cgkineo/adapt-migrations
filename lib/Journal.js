function setKeys(object, keys, value) {
  const initialKeys = keys.slice(0, -1);
  const lastKey = keys[keys.length - 1];
  const finalObject = initialKeys.reduce((object, key) => {
    if (!(key in object)) {
      throw new Error(`Cannot locate intermediate key: ${keys}`);
    }
    return object[key];
  }, object);
  finalObject[lastKey] = value;
}

function deleteKeys(object, keys) {
  const initialKeys = keys.slice(0, -1);
  const lastKey = keys[keys.length - 1];
  const finalObject = initialKeys.reduce((object, key) => {
    if (!(key in object)) {
      throw new Error(`Cannot locate intermediate key: ${keys}`);
    }
    return object[key];
  }, object);
  delete finalObject[lastKey];
}

function getKeys(object, keys) {
  return keys.reduce((object, key) => {
    if (!(key in object)) {
      throw new Error(`Cannot locate intermediate key: ${keys}`);
    }
    return object[key]
  }, object);
}

function clone(object) {
  return JSON.parse(JSON.stringify(object));
}

export default class Journal {
  constructor({
    data,
    supplementEntry = (entry, data) => entry
  }) {
    const addEntry = (method, keys, value = null, previous = null) => {
      if (this.isUndoing) return;
      this.entries.push(this.supplementEntry({
        method,
        keys,
        value: clone(value),
        previous: clone(previous)
      }, this.data));
    }
    const wrap = (data, keys = []) => {
      const journal = this;
      return new Proxy(data, {
        get(target, prop) {
          const value = target[prop];
          if (prop === 'valueOf' && typeof value === 'function') {
            return function() {
              return target;
            }
          }
          if (Array.isArray(value) || typeof value === 'object') {
            return wrap(value, keys.concat([prop]));
          }
          return Reflect.get(...arguments);
        },
        set(target, prop, value, proxy) {
          if (journal.isFrozen) {
            throw new Error('Data is frozen, cannot modify')
          }
          if (value?.valueOf) {
            value = value.valueOf();
          }
          const previous = target[prop];
          const isArrayLength = (Array.isArray(target) && prop === 'length');
          const isObjectPropertyAdd = !(prop in target);
          if (isArrayLength && target.length === value) {
            return true;
          } else if (isObjectPropertyAdd) {
            if (Array.isArray(target) && !isNaN(prop)) {
              const intProp = parseInt(prop);
              if (intProp >= target.length) {
                addEntry('set', keys.concat(['length']), intProp + 1, target.length);
              }
            }
            addEntry('add', keys.concat([prop]), value, undefined);
          } else {
            addEntry('set', keys.concat([prop]), value, previous);
          }
          return Reflect.set(target, prop, value, proxy);
        },
        deleteProperty(target, prop) {
          if (journal.isFrozen) {
            throw new Error('Data is frozen, cannot modify')
          }
          const previous = target[prop];
          addEntry('delete', keys.concat([prop]), null, previous);
          return Reflect.deleteProperty(...arguments)
        }
      });
    }
    this.supplementEntry = supplementEntry;
    this.data = data;
    this.subject = wrap(data);
  }

  get isFrozen() {
    return this._isFrozen ?? false;
  }

  freeze() {
    this._isFrozen = true;
  }

  unfreeze() {
    this._isFrozen = false;
  }

  undo(count = this.entries.length) {
    const entries = [];
    this.isUndoing = true;
    for (let i = 0, l = count; i < l; i++) {
      const entry = this.entries.pop();
      entries.unshift(entry);
      switch (entry.method) {
        case 'delete':
        case 'set':
          setKeys(this.subject, entry.keys, entry.previous);
          break;
        case 'add':
          deleteKeys(this.subject, entry.keys);
          break;
      }
    }
    this.isUndoing = false;
    return entries;
  }

  undoToIndex(index = 0) {
    const lastIndex = this.entries.length - 1;
    const count = lastIndex - index;
    return this.undo(count);
  }

  patch(entries) {
    for (const entry of entries) {
      switch (entry.method) {
        case 'delete':
          deleteKeys(this.subject, entry.keys);
          break;
        case 'set':
        case 'add':
          setKeys(this.subject, entry.keys, entry.value);
          break;
      }
    }
  }

  get lastEntryIndex() {
    return this.entries.length - 1;
  }

  get entries() {
    return this._entries = this._entries || [];
  }

  get lastEntry () {
    return this.entries[this.entries.length - 1];
  }

  toJSON() {
    return this.data;
  }
}
