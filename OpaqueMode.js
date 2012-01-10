
exports.genResponse = function(request, gets) {
	response = Object.create(null);
	if(gets[ request.url] != null) {
		response.body = gets[request.url].chunk;
		response.headers = gets[request.url].headers;
		response.statusCode = gets[request.url].statusCode;
	}else {
		response.chunk = "";
		response.statusCode = 404;
		response.headers = null;
	}
};