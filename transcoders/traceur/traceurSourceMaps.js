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


// Include require.js before and traceur.js after this file

/*globals traceur */

(function() {
  'use strict';
  
  // Use comma expression to use global eval.
  var global = ('global', eval)('this');

  var path;

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
  
  var exports = {};
  function define(fn) {
    fn(require, exports, module);
  }
  
  var sourceMapFiles =  [
    'source-map/array-set',
    'source-map/base64',
    'source-map/base64-vlq',
    'source-map/binary-search',
    'source-map/util',
    'source-map/source-map-generator',
    'source-map/source-map-consumer',
    'source-map/source-node'
  ];
  
  sourceMapFiles.forEach(function(file) {
    importScript('./third_party/source-map/lib/'+file+'.js');
  });

  importScript('./codegeneration/SourceMapIntegration.js');

}());