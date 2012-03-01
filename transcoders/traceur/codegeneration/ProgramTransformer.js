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

traceur.define('codegeneration', function() {
  'use strict';

  var ObjectMap = traceur.util.ObjectMap;

  var ParseTreeValidator = traceur.syntax.ParseTreeValidator;
  var ProgramTree = traceur.syntax.trees.ProgramTree;
  var UniqueIdentifierGenerator = traceur.codegeneration.UniqueIdentifierGenerator;
  var ForOfTransformer = traceur.codegeneration.ForOfTransformer;
  var PropertyMethodAssignmentTransformer = traceur.codegeneration.PropertyMethodAssignmentTransformer;
  var PropertyNameShorthandTransformer = traceur.codegeneration.PropertyNameShorthandTransformer;
  var RestParameterTransformer = traceur.codegeneration.RestParameterTransformer;
  var DefaultParametersTransformer = traceur.codegeneration.DefaultParametersTransformer;
  var GeneratorTransformPass = traceur.codegeneration.GeneratorTransformPass;
  var DestructuringTransformer = traceur.codegeneration.DestructuringTransformer;
  var SpreadTransformer = traceur.codegeneration.SpreadTransformer;
  var BlockBindingTransformer = traceur.codegeneration.BlockBindingTransformer;
  var TraitTransformer = traceur.codegeneration.TraitTransformer;
  var ClassTransformer = traceur.codegeneration.ClassTransformer;
  var ModuleTransformer = traceur.codegeneration.ModuleTransformer;
  var FreeVariableChecker = traceur.semantics.FreeVariableChecker;
  var ArrowFunctionTransformer = traceur.codegeneration.ArrowFunctionTransformer;
  var QuasiLiteralTransformer = traceur.codegeneration.QuasiLiteralTransformer;
  var CollectionTransformer = traceur.codegeneration.CollectionTransformer;
  var CascadeExpressionTransformer = traceur.codegeneration.CascadeExpressionTransformer;
  var IsExpressionTransformer = traceur.codegeneration.IsExpressionTransformer;

  var CLASS_DECLARATION = traceur.syntax.trees.ParseTreeType.CLASS_DECLARATION;
  var TRAIT_DECLARATION = traceur.syntax.trees.ParseTreeType.TRAIT_DECLARATION;

  var options = traceur.options.transform;

  /**
   * Transforms a Traceur file's ParseTree to a JS ParseTree.
   *
   * @param {ErrorReporter} reporter
   * @param {Project} project
   * @constructor
   */
  function ProgramTransformer(reporter, project) {
    this.project_ = project;
    this.reporter_ = reporter;
    this.results_ = new ObjectMap();
    this.identifierGenerator_ = new UniqueIdentifierGenerator();
    Object.freeze(this);
  }

  /**
   * @param {ErrorReporter} reporter
   * @param {Project} project
   * @return {ObjectMap}
   */
  ProgramTransformer.transform = function(reporter, project) {
    var transformer = new ProgramTransformer(reporter, project);
    transformer.transform_();
    return transformer.results_;
  };

  /**
   * @param {ErrorReporter} reporter
   * @param {Project} project
   * @param {SourceFile} sourceFile
   * @return {ObjectMap}
   */
  ProgramTransformer.transformFile = function(reporter, project, sourceFile) {
    var transformer = new ProgramTransformer(reporter, project);
    transformer.transformFile_(sourceFile);
    return transformer.results_;
  };

  /**
   * @param {ErrorReporter} reporter
   * @param {Project} project
   * @param {ModuleSymbol}
   * @param {SourceFile} sourceFile
   * @return {ObjectMap}
   */
  ProgramTransformer.transformFileAsModule = function(reporter, project,
                                                      module, sourceFile) {
    var transformer = new ProgramTransformer(reporter, project);
    transformer.transformFileAsModule_(module, sourceFile);
    return transformer.results_;
  };

  ProgramTransformer.prototype = {
    /**
     * @return {void}
     * @private
     */
    transform_: function() {
      this.project_.getSourceFiles().forEach(function(file) {
        this.transformFile_(file);
      }, this);
    },

    /**
     * @param {SourceFile} file
     * @return {void}
     * @private
     */
    transformFile_: function(file) {
      var result = this.transform(this.project_.getParseTree(file));
      this.results_.put(file, result);
    },

    /**
     * @param {ModuleSymbol} module
     * @param {SourceFile} file
     * @return {void}
     * @private
     */
    transformFileAsModule_: function(module, file) {
      var result = this.transformTree_(this.project_.getParseTree(file),
                                       module);
      this.results_.put(file, result);
    },

    /**
     * This is the root of the code generation pass.
     * Each pass translates one contruct from Traceur to standard JS constructs.
     * The order of the passes matters.
     *
     * @param {Program} tree
     * @return {ParseTree}
     */
    transform: function(tree) {
      return this.transformTree_(tree);
    },

    transformTree_: function(tree, opt_module) {
      var identifierGenerator = this.identifierGenerator_;
      var reporter = this.reporter_;

      function chain(enabled, transformer, var_args) {
        if (!enabled)
          return;

        if (!reporter.hadError()) {
          if (traceur.options.validate) {
            ParseTreeValidator.validate(tree);
          }
          var args = Array.prototype.slice.call(arguments, 2);
          args.push(tree);
          tree = transformer.apply(null, args) || tree;
        }
      }

      if (options.modules && !reporter.hadError()) {
        if (traceur.options.validate) {
          ParseTreeValidator.validate(tree);
        }
        tree = this.transformModules_(tree, opt_module);
      }

      // TODO: many of these simple, local transforms could happen in the same
      // tree pass

      chain(options.quasi, QuasiLiteralTransformer.transformTree, identifierGenerator);
      chain(options.arrowFunctions,
            ArrowFunctionTransformer.transformTree, reporter);
      chain(options.propertyMethods,
            PropertyMethodAssignmentTransformer.transformTree);
      chain(options.propertyNameShorthand,
            PropertyNameShorthandTransformer.transformTree);
      chain(options.traceurClasses,
            ClassTransformer.transform, reporter);
      chain(options.isExpression, IsExpressionTransformer.transformTree);

      // for of must come before destructuring and generator, or anything
      // that wants to use VariableBinder
      chain(options.forOf, ForOfTransformer.transformTree, identifierGenerator);

      // rest parameters must come before generator
      chain(options.restParameters, RestParameterTransformer.transformTree);

      // default parameters should come after rest parameter to get the
      // expected order in the transformed code.
      chain(options.defaultParameters,
            DefaultParametersTransformer.transformTree);

      // generator must come after for of and rest parameters
      chain(options.generators || options.deferredFunctions,
            GeneratorTransformPass.transformTree,
            identifierGenerator,
            reporter);

      // destructuring must come after for of and before block binding
      chain(options.destructuring,
            DestructuringTransformer.transformTree, identifierGenerator);
      chain(options.spread, SpreadTransformer.transformTree);
      chain(options.blockBinding, BlockBindingTransformer.transformTree);

      // Cascade must come before CollectionTransformer.
      chain(options.cascadeExpression,
            CascadeExpressionTransformer.transformTree,
            identifierGenerator,
            reporter);

      chain(options.collections || options.privateNames,
            CollectionTransformer.transformTree);

      // Issue errors for any unbound variables
      chain(traceur.options.freeVariableChecker,
            FreeVariableChecker.checkProgram, reporter);

      return tree;
    },

    /**
     * Transforms a program tree. If an optional module is passed in the
     * program is treated as a module body.
     * @param {Program} tree
     * @param {ModuleSymbol} module
     * @return {Program}
     * @private
     */
    transformModules_: function(tree, opt_module) {
      if (opt_module) {
        return ModuleTransformer.transformAsModule(opt_module, tree);
      } else {
        return ModuleTransformer.transform(this.project_, tree);
      }
    }
  };

  return {
    ProgramTransformer: ProgramTransformer
  };
});
