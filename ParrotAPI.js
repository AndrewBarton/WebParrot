var parrot = require('WebParrot.js');

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
	//remove response
	//
app.post(adminPageUrl, function(req, res) {
		var contents = JSON.parse(req.data);
		if(contents.)
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

