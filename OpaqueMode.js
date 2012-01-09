function TranslucentMode() {
	this.genResponse = genResponse;
}

function genResponse(request, gets) {
	response = Object.create(null);
	if(gets[request.headers.host + request.url] != null) {
		response.body = gets[request.headers.host + request.url].chunk;
		response.headers = gets[request.headers.host + request.url].headers;
		response.statusCode = gets[request.headers.host + request.url].statusCode;
	}else {
		response.chunk = "";
		response.statusCode = 404;
		response.headers = null;
	}
}