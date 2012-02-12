// Copyright 2011 Google Inc.
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

traceur.define('semantics.symbols', function() {
  'use strict';

  var PropertyAccessor = traceur.semantics.symbols.PropertyAccessor;
  var SymbolType = traceur.semantics.symbols.SymbolType;
  var PropertyAccessor = traceur.semantics.symbols.PropertyAccessor;

  /**
   * A set property acccessor.
   *
   * @param {PropertySymbol} property
   * @param {SetAccessor} tree
   * @constructor
   * @extends {PropertyAccessor}
   */
  function SetAccessor(property, tree) {
    PropertyAccessor.call(this, property);

    this.tree = tree;
  }

  SetAccessor.prototype = Object.create(PropertyAccessor.prototype);

  return {
    SetAccessor: SetAccessor
  };
});
