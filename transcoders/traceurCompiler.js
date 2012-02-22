var path = require('path');
var fs = require('fs');
var log = require('../ParrotAPI').logger;
var lines;
var utils = require('./utils');
/**
 * 
 * @param body The body of the site
 * @param params Any parameters (currently does notin)
 * @param entry The cache entry for the site
 * @returns The new body.
 */
exports.transcode = function(body, params, entry) {
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!1\n'  + body, 4);
   var javascript = utils.getScripts(body);
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!2\n' + javascript, 4);
   javascript.forEach(function(part) {
      var saveMe = part;
      part = addDummyVars(part);
      var output = traceur.codegeneration.ParseTreeWriter.write(traceur.codegeneration.Compiler.compileFile(new traceur.util.ErrorReporter(), new traceur.syntax.SourceFile(entry.id, part), entry.id), false);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!3\n' + output, 4);
      
      output = removeDummyVars(output);

      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!4\n' + output, 4);
      body = utils.replaceText(body, saveMe, output);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!5\n' + body, 4);
   });
   
   //entry.headers['X-SourceMap'] = //\whatever they want to put here.
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!6\n' + body, 4);
   return body;
};



/**
 * Adds a list of dummy variables to the beginning of the file.
 * TODO: change this to load at start instead of load at run to speed it up if neccesary.
 * @param text The overall text of the script
 * @returns The new text with dummy vars inserted
 */
function addDummyVars(text) {
   
   var dummies = fs.readFileSync('./transcoders/traceur/dummyVariables', 'utf-8');
   lines = dummies.split('\n');
   
   //trim all of the inputs
   lines = lines.map(function(item) {
     return item.trim(); 
   });
   
   //remove blank lines and comment lines.
   lines = lines.filter(function(item) {
      return !item.match(/#/) && item.length > 0;
   });
   
   //and add in the dummy variables.
   lines.forEach(function(item) {
         text = 'var ' + item.trim() + ' = null;\n' + text;
   });
   return text;
}

/**
 * 
 * @param text
 * @returns The text with the dummy vars removed
 */
function removeDummyVars(text) {
   
   lines.forEach(function(item) {
         text = text.replace('var ' + item + ' = null;', '');
   });

   return text;
}

/**
 * 
 * @param params
 * @returns {String}
 */
function getParamString(params) {
   return 'IMPLEMENT ME';
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