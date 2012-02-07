// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrotAPI = require('../ParrotAPI');
var app = parrotAPI.app;
var fs = require('fs');
var log = require('../ParrotLogger');

var listPage = '';
var adminPage = '';
var previewPage = '';
var transcoderPage = '';

function onListRead(err, data) {
   listPage = data;
}

function onAdminRead(err, data){
   adminPage = data;
}

function onPreviewRead(err, data){
   previewPage = data;
}

function onTranscoderRead(err, data) {
   transcoderPage = data;
}

function adminGet(req, res) {
   log.log('admin page request received', 3);
   res.send(adminPage);
}



app.get('*admin(\.html)?*', adminGet);

app.get('*transcoder.html*', function (req, res) {
   
   var tempText = transcoderPage.replace('%SITE', decodeURIComponent(req.query.site));
   tempText = tempText.replace('%NAME', parrotAPI.getCachedRequest(req.query.site).transcodeName);
   tempText = tempText.replace('%PARAMS', JSON.stringify(parrotAPI.getCachedRequest(req.query.site).transcodeParams));
   res.send(tempText);
}); 

app.get('*reqList*', function(req, res) {
   log.log('reqList request received', 3);
   var entries = parrotAPI.getCachedReqsuests();
   var totalString = listPage + '\n<ul id="selectable">';
   var propString = '';
   for(req in entries) {
      entry = entries[req];
      var prop = {
            url:entry.request.url,
            lock:entry.lock,
            ignore:entry.ignore,
            etag:entry.headers.etag,
            status:entry.statusCode,
            expires:entry.headers.expires,
            cacheChecked:entry.cacheChecked,
            newCache:entry.newCache,
            timeRetrieved:entry.timeRetrieved,
            timeChecked:entry.timeChecked
      };
      propString += 'props["' + entry.request.url + entry.hash + '"] =' + JSON.stringify(prop) + '\n';
      totalString += '<li class="ui-selectee" id= "' + entry.request.url + entry.hash;
      
      totalString += '">' + entry.request.url + "     " + entry.hash;
      totalString += '</li>\n';
   }
   totalString += '</ul> \n</body> \n</html>';
   totalString = totalString.replace('REPLACEME', propString);
   res.send(totalString);
   
});

app.get('*parrotPreview\.html*', function (req, res) {
   res.send(previewPage);
});

fs.readFile('./public/parrotPreview.html', 'utf8', onPreviewRead);
fs.readFile('./public/list.html', 'utf8', onListRead);
fs.readFile('./public/admin.html', 'utf8', onAdminRead);
fs.readFile('./public/transcoder.html', 'utf8', onTranscoderRead);