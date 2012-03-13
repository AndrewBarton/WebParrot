exports.strip = false;
exports.proxyPort = 9090;
exports.defaultTranscoder = 'traceurCompiler';
exports.defaultParameters = {};
exports.logLevel = 1;
exports.include = {status:[200]};
var pragma = {pragma:['no-parrot']};
exports.exclude = {headers:pragma, status:[400, 401, 402, 403, 404, 500] };
exports.mode = require('./modes/Translucent');

/**
 * Parses arguments and sets the values accordingly.
 */
exports.parseArgs = function(args) {
   for(var i = 0; i < args.length; i++) {
      if(args[i] == '-v') {
         i++;
         if(args[i]) {
            exports.logLevel = args[i];
         }
         
      }
      if(args[i] == '-m') {
         i++;
         mode = require('./modes/' + args[i]);
      }
      if(args[i] == '-p') {
         i++;
         if(args[i]) {
            exports.proxyPort = args[i];
         }
      }
      if(args[i].toLowerCase() == '-defaulttranscoder') {
         i++;
         if(args[i]) {
            console.log('Default transcoders set to: ' + args[i]);
            exports.defaultTranscoder = args[i];
         }
      }
      if(args[i].toLowerCase() == '-defaultparameters') {
         i++;
         if(args[i]) {
            exports.defaultParameters = parseParameters(args[i]);
         }
         console.log('Default transcoder parameters set to: ' + exports.defaultParameters);
      }
      if(args[i] == '-h' || args[i] == '?') {
         var fs = require('fs');
         
         console.log(fs.readFileSync('./cmdHelp', 'utf-8'));
         process.exit(0);
      }
      if(args[i] == '-strip') {
         strip = true;
      }
      if(args[i] == '-config') {
         i++;
         console.log('Reading config from ' + args[i]);
         exports.parseArgs(parseConfigFile(args[i]));
      }
      if(args[i].toLowerCase() == '-includestatus') {
         //-status:200-300-400; -headers:name:value-name:value
         
            i++;
            if(args[i].toLowerCase() == 'all') {
               exports.include.status = 'all';
            }else {
               exports.include.status = args[i].split('-');
            }
            
         
      }
      if(args[i].toLowerCase() == '-includeheaders') {
            i++;
            exports.include.headers = parseParameters(args[i]);
      }

      
      if(args[i].toLowerCase() == '-excludestatus') {
          //-status:200-300-400; -headers:name:value-name:value
         i++;
         if(args[i] == 'none') {
            exports.exclude.status = [];
         }else {
            exports.exclude.status = args[i].split('-');
         }
         
      }
      if(args[i].toLowerCase() =='-excludeheaders') {
         i++;
         if(args[i] == 'none') {
            exports.exclude.headers = {};
         }else {
            exports.exclude.headers = parseParameters(args[i]);
         }
         
      }
         
         
   }
};

function parseHeaders(str) {
   var parts = str.split('-');
   var blorp = '{';
   parts.forEach(function(item) {
      blorp += item + ',';
   });
   
   blorp += '}';
   
   return JSON.parse(blorp);
}

function parseConfigFile(fileName) {

   var fs = require('fs');
   var config = fs.readFileSync(fileName, 'UTF-8');
   
   lines = config.split('\n');
   
   //trim all of the inputs
   lines = lines.map(function(item) {
     return item.trim(); 
   });
   
   //remove blank lines and comment lines.
   lines = lines.filter(function(item) {
      return !item.match(/#/) && item.length > 0;
   });
   
   var parts = [];
   lines.forEach(function(item) {
      var splits = item.split(' ');
      splits.forEach(function(piece) {
         parts[parts.length] = piece;
      });
   });
   
   return parts;
};

/**
 * 
 * @param paras The string containing the command line formatted parameters
 * @returns An object containing the default parameters
 */
exports.parseParameters = function(paras) {
   var parts = paras.split('-');
   var json = '{';
   parts.forEach(function(part) {
      var subParts = part.split(':');
      json += '"' + subParts[0] + '":"' + subParts[1] + '",';
   });
   json = json.substring(0, json.length-1);
   json += '}';
   return JSON.parse(json);
};