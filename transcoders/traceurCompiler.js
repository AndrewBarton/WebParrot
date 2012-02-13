var path = require('path');
var fs = require('fs');
var log = require('../ParrotAPI').logger;

exports.transcode = function(body, params, entry) {
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!1\n'  + body, 4);
   var javascript = strip(body);
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!2\n' + javascript, 4);
   javascript.forEach(function(part) {
      part = addDummyVars(part);
      var reporter = new traceur.util.ErrorReporter();
      var sourceFile = new traceur.syntax.SourceFile("how now brown cow", part);
      var results = traceur.codegeneration.Compiler.compileFile(reporter, sourceFile, 'TODO');
      var output = traceur.codegeneration.ParseTreeWriter.write(results, false);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!3\n' + output, 4);
      
      part = removeDummyVars(part);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!6\n' + part, 4);
      output = removeDummyVars(output);
      body = replace(body, part, output);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!4\n' + body, 4);
   });
   
   //entry.headers['X-SourceMap'] = //\whatever they want to put here.
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!5\n' + body, 4);
   return body;
};


function strip(text) {
   //get all inline javascript
   //first remove all not-inline javascript to simplify
   text = text.replace(new RegExp('<script (type="\w*")? src=\w*></script>', 'g'), '');
   //now split along all the script lines
   //\detect type, so it doesn't bother with non-JS stuff
   var splits = text.split('<script');
   var returnMe = [];
   //for each split, remove the end of the starting script tag and everything after the end of the script tag
   splits.forEach(function(part) {
      
      part = part.replace(new RegExp('[ "/=\\w]*>'), '');
      //also removes everything that doesn't end in </script>
      part = part.substring(0, part.indexOf('</script>'));
      if(part.length > 0) {
         returnMe[returnMe.length] = part;
      }
   });
   return returnMe;
}

function addDummyVars(text) {
   text = 'var XMLHttpRequest = null;' + text;
   text = 'var window = null;' + text;
   text = 'var document = null;' + text;
   return text;
}

function removeDummyVars(text) {
   text = text.replace('var XMLHttpRequest = null;', '');
   text = text.replace('var window = null;', '');
   text = text.replace('var document = null;', '');
   return text;
}

function getParamString(params) {
   return 'IMPLEMENT ME';
}

function replace(body, oldPart, newPart) {
   //this may or may not work...
   var pieces = body.split(oldPart);
   var output = pieces[0] + newPart + pieces[1];
   return output;
}


/**
 * Reads a script and eval's it into the global scope.
 * TODO: this is needed for now because of how our scripts are designed.
 * Change this once we have a module system.
 * @param {string} filename
 */
function importScript(filename) {
  filename = path.join(path.dirname(process.argv[1]), 'transcoders', 'traceur', filename);
  var data = fs.readFileSync(filename);
  if (!data) {
    throw new Error('Failed to import ' + filename);
  }
  data = data.toString('utf8');
  eval.call(global, data);
}

// Allow traceur.js to use importScript.
global.importScript = importScript;

importScript('./traceur.js');