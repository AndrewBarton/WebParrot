// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrot = require('./WebParrot');
var express = require('express');
var log = require('./parrotLogger');

var app = express.createServer();
app.use(express.bodyParser());
exports.app = app;
if(parrot.demoPort != 0) {
   var demoApp = express.createServer();
   exports.demoApp = demoApp;

   log.log('demo running on port: ' + parrot.demoPort, 0);
   demoApp.listen(parrot.demoPort);
}

var apiPageUrl = "/api";

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
  res.redirect('/admin.html'); 
});



//possible actions =
   //remove request
   //get response text
   //get request text
   //set request to ignore
   //set request to lock
   //change mode
   
app.post(apiPageUrl, function(req, res) {
      var contents = req.body;
      console.log(contents);
      if(contents.removeRequest) {
         for(var i = 0; i < contents.removeRequest.length; i++) {
            parrot.removeReq(contents.removeRequest[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      
      if(contents.requestSource) {
         request = exports.getCachedRequest(contents.requestSource).myRequest;
         var text = 'method: ' + request.method + '\n';
         res.send(text + request.headers);
      }
      
      if(contents.responseSource) {
         res.send(JSON.stringify(exports.getCachedRequest(contents.requestSource).headers + exports.getCachedRequest(contents.requestSource).data));
      }
      if(contents.getResponseRender) {
         res.send(getCachedRequest(contents.requestSource).data);
      }
      
      if(contents.toggleIgnore) {
         for(var i = 0; i < contents.toggleIgnore.length; i++) {
            parrot.toggleIgnore(contents.toggleIgnore[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      
      if(contents.toggleLock) {
         for(var i = 0; i < contents.toggleLock.length; i++) {
            parrot.toggleLock(contents.toggleLock[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      if(contents.mode) {
         parrot.setMode(contents.mode);
         res.send();
      }
      if(contents.getMode) {
         res.send(parrot.getMode());
      }
      if(contents.cacheCheck) {
            parrot.cacheCheck(contents.cacheCheck, res, function(updated) {
               if(updated) {
                  req.body.updated = true;
                  res.send(JSON.stringify(req.body));
               }else {
                  req.body.updated = false;
                  res.send(JSON.stringify(req.body));
               }
               
            });
      }
      if(contents.cacheReplace) {
            parrot.cacheReplace(contents.cacheReplace, res);
      }
      
      
});

exports.getCachedReqsuests = function () {
   return parrot.getReqs();
};

exports.getCachedRequest = function (ID) {
   return parrot.getReqs()[ID];
};

exports.getMode =  function () {
   return parrot.getMode();
};
require('./public/');
log.log("Web server running on port: " + parrot.webPort, 0);
app.listen(parrot.webPort);
