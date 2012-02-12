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

traceur.define('syntax.trees', function() {
  'use strict';

  var ParseTree = traceur.syntax.trees.ParseTree;
  var ParseTreeType = traceur.syntax.trees.ParseTreeType;

  var instance;

  ParseTreeType.NULL_TREE = 'NULL_TREE';

  /**
   * TODO: this was a Java-ism. Remove and use 'null' instead.
   * @constructor
   * @extends {ParseTree}
   */
  function NullTree() {
    if (instance)
      return instance;
    ParseTree.call(this, ParseTreeType.NULL_TREE, null);
    Object.freeze(this);
    instance = this;
  }

  NullTree.prototype = Object.create(ParseTree.prototype);

  return {
    NullTree: NullTree
  };
});
