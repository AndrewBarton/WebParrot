var path = require('path');
var fs = require('fs');
var log = require('../ParrotAPI').logger;
var lines;

exports.transcode = function(body, params, entry) {
   //log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!1\n'  + body, 4);
   var javascript = strip(body);
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!2\n' + javascript, 4);
   javascript.forEach(function(part) {
      var saveMe = part;
      part = addDummyVars(part);
      var output = traceur.codegeneration.ParseTreeWriter.write(traceur.codegeneration.Compiler.compileFile(new traceur.util.ErrorReporter(), new traceur.syntax.SourceFile(entry.id, part), entry.id), false);
      //log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!3\n' + output, 4);
      
      output = removeDummyVars(output);

      //log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!4\n' + output, 4);
      body = replace(body, saveMe, output);
      //log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!5\n' + body, 4);
   });
   
   //entry.headers['X-SourceMap'] = //\whatever they want to put here.
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!6\n' + body, 4);
   return body;
};


function strip(text) {
   //get all inline javascript
   //first remove all not-inline javascript to simplify
   //now split along all the script lines
   var splits = text.split(/<script (?!src=".*?")/);
   
   var returnMe = [];
   //for each split, remove the end of the starting script tag and everything after the end of the script tag
   for(var i = 1; i < splits.length; i++) {
      var part = splits[i];
      
      var type = part.match(new RegExp('type *= *"text/traceur"'));
      
      part = part.replace(new RegExp('[ "/=\\w]*>'), '');
      //also removes everything that doesn't end in </script>
      part = part.substring(0, part.indexOf('</script>'));
      if(part.length > 0) {
         returnMe[returnMe.length] = part;
      }
   }
   return returnMe;
}

function addDummyVars(text) {
   var dummies = fs.readFileSync('./transcoders/traceur/dummyVariables', 'utf-8');
   lines = dummies.split('\n');
   
   lines = lines.map(function(item) {
     return item.trim(); 
   });
   
   lines = lines.filter(function(item) {
      return !item.match(/#/) && item.length > 0;
   });
   
   lines.forEach(function(item) {
         text = 'var ' + item.trim() + ' = null;\n' + text;
   });
   return text;
}

function removeDummyVars(text) {
   
   lines.forEach(function(item) {
         text = text.replace('var ' + item.trim() + ' = null;', '');
   });

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