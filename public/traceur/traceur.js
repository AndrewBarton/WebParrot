// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var traceur = (function() {
  'use strict';

  /**
   * Builds an object structure for the provided namespace path,
   * ensuring that names that already exist are not overwritten. For
   * example:
   * "a.b.c" -> a = {};a.b={};a.b.c={};
   * @param {string} name Name of the object that this file defines.
   * @private
   */
  function exportPath(name) {
    var parts = name.split('.');
    var cur = traceur;

    for (var part; parts.length && (part = parts.shift());) {
      if (part in cur) {
        cur = cur[part];
      } else {
        cur = cur[part] = {};
      }
    }
    return cur;
  };

  /**
   * @param {string} name
   * @param {!Function} fun
   */
  function define(name, fun) {
    var obj = exportPath(name);
    var exports = fun();
    for (var propertyName in exports) {
      // Maybe we should check the prototype chain here? The current usage
      // pattern is always using an object literal so we only care about own
      // properties.
      var propertyDescriptor = Object.getOwnPropertyDescriptor(exports,
                                                               propertyName);
      if (propertyDescriptor)
        Object.defineProperty(obj, propertyName, propertyDescriptor);
    }
  }

  function assert(b) {
    if (!b && traceur.options.debug)
      throw Error('Assertion failed');
  }

  /**
   * Evaluates some code in a strict global context.
   * @param {string} code
   * @return {*} The continuation value of the code.
   */
  function strictGlobalEval(code) {
    return ('global', eval)('"use strict";' + code);
  }

  /**
   * Similar to {@code Object.create} but instead of taking a property
   * descriptor it takes an ordinary object.
   * @param {Object} proto The object acting as the proto.
   * @param {Object} obj The object describing the fields of the object.
   * @return {Object} A new object that has the same propertieas as {@code obj}
   *     and its proto set to {@code proto}.
   */
  function createObject(proto, obj) {
    var newObject = Object.create(proto);
    Object.getOwnPropertyNames(obj).forEach(function(name) {
      Object.defineProperty(newObject, name,
                            Object.getOwnPropertyDescriptor(obj, name));
    });
    return newObject;
  }

  // Cached path to the current script file in an HTML hosting environment.
  var path;

  // Use comma expression to use global eval.
  var global = ('global', eval)('this');

  // Allow script before this one to define a global importScript function.
  var importScript = global.importScript || function(file) {
    if (!path) {
      // Find path to this js file
      var scripts = document.querySelectorAll('script');
      var src = scripts[scripts.length - 1].src;
      path = src.substring(0, src.lastIndexOf('/') + 1);
    }

    document.write('<script src="' + path + file + '"></script>');
  };

  var uidCounter = 0;

  /**
   * Returns a new unique ID.
   * @return {number}
   */
  function getUid() {
    return ++uidCounter;
  }

  // Do the export before we execute the rest.
  global.traceur = {
    assert: assert,
    createObject: createObject,
    define: define,
    getUid: getUid,
    strictGlobalEval: strictGlobalEval
  };

  var scripts = [
    'runtime/runtime.js',
  ];
  scripts.forEach(importScript);

  return global.traceur;
})();
