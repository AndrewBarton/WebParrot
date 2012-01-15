// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrot = require('./WebParrot');
var express = require('express');
var log = require('./parrotLogger');

var app = express.createServer();
app.use(express.bodyParser());
exports.app = app;
var apiPageUrl = "/API";


app.use(express.static(__dirname + '/public'));
log.log("Web server running on port: " + parrot.webPort, 0);
app.listen(parrot.webPort);
   

//possible actions =
   //remove request
   //get response text
   //get request text
   //set request to ignore
   //set request to lock
   //change mode
   
app.post(apiPageUrl, function(req, res) {
      var contents = req.body;
      if(contents.removeRequest) {
         for(var i = 0; i < contents.removeRequest.length; i++) {
            parrot.removeReq(contents.removeRequest[i]);
         }
         res.send(JSON.stringify(req.body));
      }
      
      if(contents.getResponseText) {
         res.send(JSON.stringify(getCachedRequest(resText.ID).myRequest));
      }
      
      if(contents.getRequestText) {
         res.send(JSON.stringify(getCachedRequest(resText.ID).data));
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
      if(contents.setMode) {
         parrot.setMode(contents.setMode.mode);
         res.send();
      }
      if(contents.getMode) {
         res.send(JSON.stringify(getMode()));
      }
      
      
});

exports.getWhiteList = function () {
   return parrot.getWhiteList();
};

exports.getCachedReqsuests = function () {
   return parrot.getReqs();
};

exports.getCachedRequest = function (ID) {
   return parrot.getReqs()[ID];
};

exports.getMode =  function () {
   return parrot.getMode();
};
var page = require('./public/adminPage');
