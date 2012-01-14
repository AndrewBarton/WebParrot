// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrot = require('./WebParrot');
var express = require('express');


var app = express.createServer();
app.use(express.bodyParser());
exports.app = app;
var adminPageUrl = "/admin";
app.get(adminPageUrl, function(req, res){
     res.send(page);
   });


app.use(express.static(__dirname + '/public'));

app.listen(8081);
   

//possible actions =
   //remove request
   //get response text
   //get request text
   //set request to ignore
   //set request to lock
   //change mode
   
app.post(adminPageUrl, function(req, res) {
      var contents = req.body;
      console.log(contents);
      if(contents.removeRequest) {
         for(var removes in contents.removeRequest) {
            parrot.removeReq(removes.ID);
         }
      }
      
      if(contents.getResponseText) {
         
      }
      
      if(contents.getRequestText) {
         
      }
      
      if(contents.setIgnore) {
         for(var ignores in contents.setIgnore) {
            parrot.setIgnore(ignores.ID);
         }
      }
      
      if(contents.setLock) {
         for(var locks in contents.setLock) {
            parrot.setLock(locks.ID);
         }
      }
      if(contents.setMode) {
         parrot.setMode(contents.setMode.mode);
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
