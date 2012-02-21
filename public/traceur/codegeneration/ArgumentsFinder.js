// Copyright 2011 Google Inc.
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

traceur.define('codegeneration', function() {
  'use strict';

  var ParseTreeVisitor = traceur.syntax.ParseTreeVisitor;
  var PredefinedName = traceur.syntax.PredefinedName;

  /**
   * This is used to see if a function body contains a reference to arguments.
   * Does not search into nested functions.
   * @param {ParseTree} tree
   * @extends {ParseTreeVisitor}
   * @constructor
   */
  function ArgumentsFinder(tree) {
    try {
      this.visitAny(tree);
    } catch (ex) {
      // This uses an exception to do early exits.
      if (ex !== foundSentinel) {
        throw ex;
      }
    }
  }

  // Object used as a sentinel. This is thrown to abort visiting the rest of the
  // tree.
  var foundSentinel = {};

  ArgumentsFinder.prototype = traceur.createObject(ParseTreeVisitor.prototype, {
    hasArguments: false,

    /**
     * @param {IdentifierExpression} tree
     */
    visitIdentifierExpression: function(tree) {
      if (tree.identifierToken.value === PredefinedName.ARGUMENTS) {
        this.hasArguments = true;
        // Exit early.
        throw foundSentinel;
      }
    },

    // don't visit function children or bodies
    visitFunctionDeclaration: function(tree) {},
    visitSetAccessor: function(tree) {},
    visitGetAccessor: function(tree) {}
  });

  return {
    ArgumentsFinder: ArgumentsFinder
  };
});
