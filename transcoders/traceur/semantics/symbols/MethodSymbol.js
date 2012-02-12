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

  var MemberSymbol = traceur.semantics.symbols.MemberSymbol;
  var SymbolType = traceur.semantics.symbols.SymbolType;
  var PredefinedName = traceur.syntax.PredefinedName;

  /**
   * @param {FunctionDeclaration} tree
   * @param {string} name
   * @param {AggregateSymbol} containingAggregate
   * @param {boolean} isStatic
   * @constructor
   * @extends {MemberSymbol}
   */
  function MethodSymbol(tree, name, containingAggregate, isStatic) {
    MemberSymbol.call(this, SymbolType.METHOD, tree, name, containingAggregate,
                      isStatic);
    this.tree = tree;
  }

  MethodSymbol.prototype = traceur.createObject(MemberSymbol.prototype, {

    /**
     * @return {boolean}
     */
    isConstructor: function() {
      return this.name == PredefinedName.CONSTRUCTOR;
    }
  });

  return {
    MethodSymbol: MethodSymbol
  };
});
