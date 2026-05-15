export class TypedArrayValue {
  constructor(data = []) {
    this._array = null;
    this.set(data);
  }
  
  set(data) {
    const arr = Array.isArray(data) ? data : [data];
    this._array = new Float64Array(arr);
  }
  
  get() {
    return Array.from(this._array);
  }
  
  getTyped() {
    return this._array;
  }
  
  map(fn) {
    const result = new Float64Array(this._array.length);
    for (let i = 0; i < this._array.length; i++) {
      result[i] = fn(this._array[i], i);
    }
    return new TypedArrayValue(result);
  }
  
  filter(fn) {
    const result = [];
    for (let i = 0; i < this._array.length; i++) {
      if (fn(this._array[i], i)) result.push(this._array[i]);
    }
    return new TypedArrayValue(result);
  }
  
  reduce(fn, initial) {
    let acc = initial;
    for (let i = 0; i < this._array.length; i++) {
      acc = fn(acc, this._array[i], i);
    }
    return acc;
  }
  
  get length() {
    return this._array.length;
  }
  
  [Symbol.iterator]() {
    return this._array[Symbol.iterator]();
  }
}
