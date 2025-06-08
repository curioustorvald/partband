"use strict";
let thisSessionSeed = (Date.now() / 28800000)|0

function loadJson(jsonPath, callback) {
  let xobj = new XMLHttpRequest()
  xobj.overrideMimeType("application/json")
  xobj.open('GET', jsonPath, true)
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText)
    }
  }
  xobj.send(null)
}

function isNSFW(art) {
  if (art.ord === undefined) throw Error("This object does not have 'ord'")
  return (art.ord % 10 > 0 && art.ord > 10 || 10000 <= art.ord && art.ord < 100000 || 200000 <= art.ord)
}

function isThisOrdNSFW(ord) {
  return (ord % 10 > 0 && ord > 10 || 10000 <= ord && ord < 100000 || 200000 <= ord)
}

function isNonMacro(art) {
  return (art.ord >= 100000)
}

function generateRandomSeq(seed, size) {
  let ret = []
  let v = seed
  for (let i = 0; i < size; i++) {
    v = ((v * 69069) + 1) % 65536
    if (v < 0) v = -v
    ret.push(v)
  }
  return ret
}

let rndVal = thisSessionSeed
// seed changes every 8 hours
function rnd() {
  rndVal = ((rndVal * 69069) + 1) % 65536
  if (rndVal < 0) rndVal = -rndVal
  return rndVal / 65536
}

function resetRng() {
  rndVal = thisSessionSeed
}

Array.prototype.randomPop = function() {
  // Return undefined if array is empty
  if (this.length === 0) {
      return undefined;
  }

  // Generate random index
  const randomIndex = Math.floor(rnd() * this.length);

  // Remove and return the element at random index
  return this.splice(randomIndex, 1)[0];
};

Array.prototype.randomPick = function() {
  // Return undefined if array is empty
  if (this.length === 0) {
      return undefined;
  }

  // Generate random index
  const randomIndex = Math.floor(rnd() * this.length);

  return this[randomIndex]
};

Array.prototype.removeElem = function(elem) {
  const index = this.indexOf(elem); // finds first occurrence
  if (index > -1) {
    this.splice(index, 1); // removes 1 element at index
  }
}

Array.prototype.firstIndexOf = function(predicate) {
  // Validate that predicate is a function
  if (typeof predicate !== 'function') {
    throw new TypeError('Predicate must be a function');
  }

  // Iterate through array elements
  for (let i = 0; i < this.length; i++) {
    // Call predicate with (element, index, array) - same signature as Array methods
    if (predicate(this[i], i, this)) {
      return i;
    }
  }

  // Return -1 if no element matches the predicate
  return -1;
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function coerceIn(x, low, high) {
  return Math.min(Math.max(x, low), high)
}

function removeAll(arr, itemsToRemove) {
  const removeSet = new Set(itemsToRemove);
  return arr.filter(item => !removeSet.has(item));
}

