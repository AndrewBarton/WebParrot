var parrot = require('./WebParrot.js');
var app = require('express').createServer();
var adminPageUrl = "/admin";
app.get(adminPageUrl, function(req, res){
     var pageJs = require(req.url);
     var page = pageJs.fill();
     res.send(page);
   });

app.listen(8080);
   
   
//possible actions =
   //add get
   //add response
   //remove response
   //add to whiteList
   //remove from whiteList
   //add get to ignore list
   //
app.post(adminPageUrl, function(req, res) {
      var contents = JSON.parse(req.data);
      if(contents.addGet) {
      	for(var getsAdd in contents.addGet) {
      		if(parrot.gets[getsAdd]) {
      			//\get already added...
      		}else {
      			parrot.gets[getsAdd] = Object.create(null);
      		}
      	}
      }
      
      if(contents.addResponse) {
      	for(var responsesAdd in contents.addReponse) {
      		if(responsesAdd.get) {
      			if(parrot.gets[responsesAdd.get]) {
      				
      			}
      		}
      	}
      }
      
      if(contents.removeResponse) {
      	
      }
      
      if(contents.addToWhiteList) {
      	
      }
      
      if(contents.removeFromWhiteList) {
      	
      }
      
      if(contents.addToIgnore) {
      	
      }
      
      
});

function getWhiteList() {
   return parrot.getWhiteList();
}

function getCachedGets() {
   return parrot.getGets();
}

function getCachedResponse(get) {
   return parrot.getGets().get;
}

function getMode() {
   return parrot.getMode();
}

function setMode(newMode) {
   
}

