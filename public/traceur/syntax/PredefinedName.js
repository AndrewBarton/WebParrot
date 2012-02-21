// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

traceur.define('syntax', function() {
  'use strict';

  var PredefinedName = {
    ADD_CONTINUATION: 'addContinuation',
    APPLY: 'apply',
    ARGUMENTS: 'arguments',
    ARRAY: 'Array',
    BIND: 'bind',
    CALL: 'call',
    CALLBACK: 'callback',
    CAPTURED_ARGUMENTS: '$arguments',
    CAPTURED_THIS: '$this',
    CAUGHT_EXCEPTION: '$caughtException',
    CLOSE: 'close',
    CONFIGURABLE: 'configurable',
    CONSTRUCTOR: 'constructor',
    CONTINUATION: '$continuation',
    COOKED: 'cooked',
    CREATE: 'create',
    CREATE_CALLBACK: '$createCallback',
    CREATE_CLASS: 'createClass',
    CREATE_ERRBACK: '$createErrback',
    CREATE_PROMISE: 'createPromise',
    CREATE_TRAIT: 'createTrait',
    CURRENT: 'current',
    DEFAULT_QUASI: 'defaultQuasi',
    DEFERRED: 'Deferred',
    DEFINE_PROPERTY: 'defineProperty',
    ELEMENT_DELETE: 'elementDelete',
    ELEMENT_GET: 'elementGet',
    ELEMENT_GET_CALL: 'elementGetCall',
    ELEMENT_HAS: 'elementHas',
    ELEMENT_SET: 'elementSet',
    ENUMERABLE: 'enumerable',
    ERR: '$err',
    ERRBACK: 'errback',
    FIELD_INITIALIZER_METHOD: '$field_initializer_',
    FINALLY_FALL_THROUGH: '$finallyFallThrough',
    FREEZE: 'freeze',
    FROM: 'from',
    GET: 'get',
    GET_ITERATOR: 'getIterator',
    GET_MODULE_INSTANCE_BY_URL: 'getModuleInstanceByUrl',
    GET_PROPERTY: 'getProperty',
    INIT: '$init',
    IS: 'is',
    IS_DONE: 'isDone',
    ISNT: 'isnt',
    ITERATOR: 'iterator',
    LENGTH: 'length',
    MARK_AS_GENERATOR: 'markAsGenerator',
    MARK_METHODS: 'markMethods',
    MIXIN: 'mixin',
    MODULE: 'module',
    MODULES: 'modules',
    MOVE_NEXT: 'moveNext',
    NEW: 'new',
    NEW_STATE: '$newState',
    OBJECT: 'Object',
    OBJECT_NAME: 'Object',
    OF: 'of',
    PARAM: '$param',
    PROTO: '__proto__',
    PROTOTYPE: 'prototype',
    PUSH: 'push',
    RAW: 'raw',
    REQUIRE: 'require',
    RESOLVE: 'resolve',
    REQUIRES: 'requires',
    REQUIRED: 'required',
    RESULT: '$result',
    RUNTIME: 'runtime',
    SET: 'set',
    SPREAD: 'spread',
    SPREAD_NEW: 'spreadNew',
    SLICE: 'slice',
    STATE: '$state',
    STATIC: '$static',
    STORED_EXCEPTION: '$storedException',
    SUPER_CALL: 'superCall',
    SUPER_GET: 'superGet',
    THAT: '$that',
    THEN: 'then',
    TRACEUR: 'traceur',
    TRAIT: 'trait',
    TYPE_ERROR: 'TypeError',
    UNDEFINED: 'undefined',
    VALUE: 'value',
    $VALUE: '$value',
    WAIT_TASK: '$waitTask',
    WRITABLE: 'writable',
    getParameterName: function(index) {
      // TODO: consider caching these
      return '$' + index;
    }
  };

  // Export
  return {
    PredefinedName: PredefinedName
  };
});
