var path = require('path');
var fs = require('fs');

var api = require('../ParrotAPI');
var log = api.logger;
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
   if(entry.isSourceMap) {
      return body;
   }
   
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!1\n'  + body, 4);
   var javascript = utils.getScripts(body);
   log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!2\n' + javascript, 4);
   for(var i = 0; i < javascript.length; i++) {
      var part = javascript[i];
      var saveMe = part;
      part = addDummyVars(part);
      var sourceFile = new traceur.syntax.SourceFile(entry.id, part);
      var project = new traceur.semantics.symbols.Project(entry.id);
      project.addFile(sourceFile);
      var reporter = new traceur.util.ErrorReporter();
      var res = traceur.codegeneration.Compiler.compile(reporter, project, false);
      var sourceMapGenerator = new traceur.codegeneration.sourceMap.SourceMapGenerator({file: 'traceured.js'});
      var options = {sourceMapGenerator: sourceMapGenerator};
      var output = traceur.codegeneration.ProjectWriter.write(res, options);
      
      var entries = api.getCachedReqsuests();
      var newUrl = entry.request.url;
      if(newUrl.match('\\?')) {
         newUrl += '&source_map' + i + '=yes';
      }else {
         newUrl += '?source_map' + i + '=yes';
      }
      newUrl += '0';
      entries[newUrl] = Object.create(entry);
      entries[newUrl].request = {};
      for(var x in entry.request) {
         entries[newUrl].request[x] = entry.request[x];
      }
      entries[newUrl].request.headers = {};
      for(var x in entry.request.headers) {
         entries[newUrl].request.headers[x] = entry.request.headers[x];
      }
      entries[newUrl].request.url = newUrl;

      delete entries[newUrl].request.headers.from;
      var newData = [options.sourceMap];
      entries[newUrl].data = newData;
      entries[newUrl].id = newUrl;
      entries[newUrl].isSourceMap = true;
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!3\n' + output, 4);
      
      output = removeDummyVars(output);

      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!4\n' + output, 4);
      body = utils.replaceText(body, saveMe, output);
      log.log('!!!!!!!!!!!!!!!!!!!!!!!!!!5\n' + body, 4);
   }
   
   entry.headers['X-SourceMap'] = entry.request.url;
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
importScript('./traceurSourceMaps.js');