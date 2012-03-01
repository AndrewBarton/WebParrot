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

  var ParseTreeTransformer = traceur.codegeneration.ParseTreeTransformer;
  var ParseTreeFactory = traceur.codegeneration.ParseTreeFactory;
  var Program = traceur.syntax.trees.Program;

  var ParseTree = traceur.syntax.trees.ParseTree;
  var TokenType = traceur.syntax.TokenType;

  var createBlock = ParseTreeFactory.createBlock;
  var createVariableStatement = ParseTreeFactory.createVariableStatement;
  var createVariableDeclaration = ParseTreeFactory.createVariableDeclaration;
  var createVariableDeclarationList = ParseTreeFactory.createVariableDeclarationList;

  /**
   * Transforms a an array of statements and adds a new temp var stack.
   */
  function transformStatements(self, statements) {
    self.tempVarStack_.push([]);

    var transformedStatements = self.transformList(statements);

    var vars = self.tempVarStack_.pop();
    if (!vars.length)
      return transformedStatements;

    var variableStatement = createVariableStatement(
        createVariableDeclarationList(TokenType.VAR, vars));
    transformedStatements = [variableStatement].concat(transformedStatements);
    return transformedStatements;
  }

  /**
   * A generic transformer that allows you to easily create a expression with
   * temporary variables.
   *
   * @param {UniqueIdentifierGenerator} identifierGenerator
   * @constructor
   * @extends {ParseTreeTransformer}
   */
  function TempVarTransformer(identifierGenerator) {
    this.identifierGenerator_ = identifierGenerator
    this.tempVarStack_ = [];
  }

  var proto = ParseTreeTransformer.prototype;
  TempVarTransformer.prototype = traceur.createObject(proto, {

    transformProgram: function(tree) {
      var elements = transformStatements(this, tree.programElements);
      if (elements == tree.programElements) {
        return tree;
      }
      return new Program(null, elements);
    },

    transformFunctionBody: function(tree) {
      var statements = transformStatements(this, tree.statements);
      if (statements == tree.statements)
        return tree;
      return createBlock(statements);
    },

    /**
     * Adds a new temporary variable to the current function scope.
     * @return {string} The name of the temporary variable.
     */
    addTempVar: function() {
      var vars = this.tempVarStack_[this.tempVarStack_.length - 1];
      if (!vars)
        throw new Error('Invalid use of addTempVar');
      var uid = this.identifierGenerator_.generateUniqueIdentifier();
      vars.push(createVariableDeclaration(uid, null));
      return uid;
    }
  });

  return {
    TempVarTransformer: TempVarTransformer
  };
});
