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

  var BindingIdentifier = traceur.syntax.trees.BindingIdentifier;
  var ParseTree = traceur.syntax.trees.ParseTree;
  var ParseTreeFactory = traceur.codegeneration.ParseTreeFactory;
  var ParseTreeType = traceur.syntax.trees.ParseTreeType;
  var PredefinedName = traceur.syntax.PredefinedName;
  var TempVarTransformer = traceur.codegeneration.TempVarTransformer;
  var TokenType = traceur.syntax.TokenType;
  var VariableDeclaration = traceur.syntax.trees.VariableDeclaration;
  var VariableDeclarationList = traceur.syntax.trees.VariableDeclarationList;

  var createArgumentList = ParseTreeFactory.createArgumentList;
  var createAssignmentExpression= ParseTreeFactory.createAssignmentExpression;
  var createCallExpression = ParseTreeFactory.createCallExpression;
  var createCommaExpression = ParseTreeFactory.createCommaExpression;
  var createIdentifierExpression = ParseTreeFactory.createIdentifierExpression;
  var createMemberExpression = ParseTreeFactory.createMemberExpression;
  var createMemberLookupExpression = ParseTreeFactory.createMemberLookupExpression;
  var createNumberLiteral = ParseTreeFactory.createNumberLiteral;
  var createParenExpression = ParseTreeFactory.createParenExpression;
  var createVariableDeclaration = ParseTreeFactory.createVariableDeclaration;
  var createVariableDeclarationList = ParseTreeFactory.createVariableDeclarationList;

  function toBindingIdentifier(tree) {
    return new BindingIdentifier(tree.location, tree.identifierToken);
  }

  /**
   * Collects assignments in the desugaring of a pattern.
   * @param {ParseTree} rvalue
   * @constructor
   */
  function Desugaring(rvalue) {
    this.rvalue = rvalue;
  }

  /**
   * Collects assignments as assignment expressions. This is the
   * desugaring for assignment expressions.
   * @param {ParseTree} rvalue
   * @constructor
   * @extends {Desugaring}
   */
  function AssignmentExpressionDesugaring(rvalue) {
    Desugaring.call(this, rvalue);
    this.expressions = [];
  }
  AssignmentExpressionDesugaring.prototype = traceur.createObject(
      Desugaring.prototype, {

    assign: function(lvalue, rvalue) {
      this.expressions.push(createAssignmentExpression(lvalue, rvalue));
    }
  });

  /**
   * Collects assignments as variable declarations. This is the
   * desugaring for 'var', 'const' declarations.
   * @param {ParseTree} rvalue
   * @constructor
   * @extends {Desugaring}
   */
  function VariableDeclarationDesugaring(rvalue) {
    Desugaring.call(this, rvalue);
    this.declarations = [];
  }
  VariableDeclarationDesugaring.prototype = traceur.createObject(
      Desugaring.prototype, {
    assign: function(lvalue, rvalue) {
      // TODO(arv): This should go away when destructuring is refactored.
      if (lvalue.type == ParseTreeType.IDENTIFIER_EXPRESSION)
        lvalue = toBindingIdentifier(lvalue);
      this.declarations.push(createVariableDeclaration(lvalue, rvalue));
    }
  });

  /**
   * Desugars destructuring assignment.
   *
   * @see <a href="http://wiki.ecmascript.org/doku.php?id=harmony:destructuring#assignments">harmony:destructuring</a>
   * 
   * @param {UniqueIdentifierGenerator} identifierGenerator
   * @constructor
   * @extends {TempVarTransformer}
   */
  function DestructuringTransformer(identifierGenerator) {
    TempVarTransformer.call(this, identifierGenerator);
  }

  /**
   * @param {UniqueIdentifierGenerator} identifierGenerator
   * @param {ParseTree} tree
   * @return {ParseTree}
   */
  DestructuringTransformer.transformTree = function(identifierGenerator, tree) {
    return new DestructuringTransformer(identifierGenerator).transformAny(tree);
  };

  var proto = TempVarTransformer.prototype;
  DestructuringTransformer.prototype = traceur.createObject(proto, {

    /**
     * @param {ArrayPattern} tree
     * @return {ParseTree}
     */
    transformArrayPattern: function(tree) {
      // Patterns should be desugared by their parent nodes.
      throw new Error('unreachable');
    },

    /**
     * @param {ObjectPattern} tree
     * @return {ParseTree}
     */
    transformObjectPattern: function(tree) {
      // Patterns should be desugard by their parent nodes.
      throw new Error('unreachable');
    },

    /**
     * Transforms:
     *   [a, [b, c]] = x
     * From an assignment expression into:
     *   (function (rvalue) {
     *     a = rvalue[0];
     *     [b, c] = rvalue[1];
     *   }).call(this, x);
     *
     * Nested patterns are desugared by recursive calls to transform.
     *
     * @param {BinaryOperator} tree
     * @return {ParseTree}
     */
    transformBinaryOperator: function(tree) {
      if (tree.operator.type == TokenType.EQUAL && tree.left.isPattern()) {
        return this.transformAny(this.desugarAssignment_(tree.left, tree.right));
      } else {
        return proto.transformBinaryOperator.call(this, tree);
      }
    },

    /**
     * @param {ParseTree} lvalue
     * @param {ParseTree} rvalue
     * @return {ParseTree}
     */
    desugarAssignment_: function(lvalue, rvalue) {
      var tempIdent = createIdentifierExpression(this.addTempVar());
      var desugaring = new AssignmentExpressionDesugaring(tempIdent);
      this.desugarPattern_(desugaring, lvalue);
      desugaring.expressions.unshift(createAssignmentExpression(tempIdent, rvalue));
      desugaring.expressions.push(tempIdent);

      return createParenExpression(
          createCommaExpression(desugaring.expressions));
    },

    /**
     * Transforms:
     *   [a, [b, c]] = x
     * From a variable declaration list into:
     *   tmp = x, a = x[0], [b, c] = x[1]
     *
     * We do it this way (as opposed to a block with a declaration and
     * initialization statements) so that we can translate const
     * declarations, which must be initialized at declaration.
     *
     * Nested patterns are desugared by recursive calls to transform.
     *
     * @param {VariableDeclarationList} tree
     * @return {ParseTree}
     */
    transformVariableDeclarationList: function(tree) {
      if (!this.destructuringInDeclaration_(tree)) {
        // No lvalues to desugar.
        return proto.transformVariableDeclarationList.call(this, tree);
      }

      // Desugar one level of patterns.
      var desugaredDeclarations = [];
      tree.declarations.forEach(function(declaration) {
        if (declaration.lvalue.isPattern()) {
          desugaredDeclarations.push.apply(desugaredDeclarations,
              this.desugarVariableDeclaration_(declaration));
        } else {
          desugaredDeclarations.push(declaration);
        }
      }, this);

      // Desugar more.
      return this.transformVariableDeclarationList(
          createVariableDeclarationList(
              tree.declarationType,
              desugaredDeclarations));
    },

    /**
     * @param {VariableDeclarationList} tree
     * @return {boolean}
     */
    destructuringInDeclaration_: function(tree) {
      return tree.declarations.some(function(declaration) {
        return declaration.lvalue.isPattern();
      });
    },

    /**
     * @param {VariableDeclaration} tree
     * @return {Array.<VariableDeclaration>}
     */
    desugarVariableDeclaration_: function(tree) {
      var desugaring =
          new VariableDeclarationDesugaring(
              createIdentifierExpression(this.gensym_(tree.lvalue)));
      // Evaluate the rvalue and store it in a temporary.
      desugaring.assign(desugaring.rvalue, tree.initializer);
      this.desugarPattern_(desugaring, tree.lvalue);
      return desugaring.declarations;
    },

    /**
     * @param {Desugaring} desugaring
     * @param {ParseTree} tree
     */
    desugarPattern_: function(desugaring, tree) {
      switch (tree.type) {
        case ParseTreeType.ARRAY_PATTERN: {
          var pattern = tree;

          for (var i = 0; i < pattern.elements.length; i++) {
            var lvalue = pattern.elements[i];
            if (lvalue.isNull()) {
              // A skip, for example [a,,c]
              continue;
            } else if (lvalue.isSpreadPatternElement()) {
              // Rest of the array, for example [x, ...y] = [1, 2, 3]
              desugaring.assign(
                  lvalue.lvalue,
                  createCallExpression(
                      createMemberExpression(
                          PredefinedName.ARRAY, PredefinedName.PROTOTYPE,
                          PredefinedName.SLICE, PredefinedName.CALL),
                      createArgumentList(
                          desugaring.rvalue,
                          createNumberLiteral(i))));
            } else {
              desugaring.assign(
                  lvalue,
                  createMemberLookupExpression(
                      desugaring.rvalue,
                      createNumberLiteral(i)));
            }
          }
          break;
        }

        case ParseTreeType.OBJECT_PATTERN: {
          var pattern = tree;

          pattern.fields.forEach(function(field) {
            var lookup =
                createMemberExpression(desugaring.rvalue, field.identifier);
            desugaring.assign(
                field.element == null ?
                    // Just 'a' is sugar for 'a: a'
                    createIdentifierExpression(field.identifier) :
                    field.element,
                lookup);
          });
          break;
        }

        case ParseTreeType.PAREN_EXPRESSION:
          this.desugarPattern_(desugaring, tree.expression);
          break;

        default:
          throw new Error('unreachable');
      }
    },

    /**
     * Generates a deterministic and (hopefully) unique identifier based
     * on the lvalue identifiers in tree.
     * @param {ParseTree} tree
     * @return {string}
     */
    gensym_: function(tree) {
      var ids = this.collectLvalueIdentifiers_(Object.create(null), tree);
      ids = Object.keys(ids).sort();
      return 'destructuring$' + ids.join('$');
    },

    /**
     * Helper for gensym_.
     * @param {Object} identifiers
     * @param {ParseTree} tree
     * @return {Object}
     */
    collectLvalueIdentifiers_: function(identifiers, tree) {

      switch (tree.type) {
        case ParseTreeType.IDENTIFIER_EXPRESSION:
          identifiers[tree.identifierToken.value] = true;
          break;

        case ParseTreeType.ARRAY_PATTERN:
          tree.elements.forEach(function(e) {
            this.collectLvalueIdentifiers_(identifiers, e);
          }, this);
          break;

        case ParseTreeType.OBJECT_PATTERN:
          tree.fields.forEach(function(f) {
            if (f.element == null) {
              identifiers[f.identifier.value] = true;
            } else {
              this.collectLvalueIdentifiers_(identifiers, f.element);
            }
          }, this);
          break;

        case ParseTreeType.PAREN_EXPRESSION:
          this.collectLvalueIdentifiers_(identifiers,
              tree.expression);
          break;

        default:
          throw new Error('unreachable');
      }

      return identifiers;
    }

  });

  return {
    DestructuringTransformer: DestructuringTransformer
  };
});
