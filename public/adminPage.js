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
   
   var tempText = transcoderPage.replace('%REPLACEME', decodeURIComponent(req.query.site));
   res.send(tempText);
}); 

app.get('*reqList*', function(req, res) {
   log.log('reqList request received', 3);
   var entries = parrotAPI.getCachedReqsuests();
   var totalString = listPage + '\n<ul id="selectable">';
   var propString = '';
   for(req in entries) {
      actualReq = entries[req];
      var prop = {
            url:actualReq.request.url,
            lock:actualReq.lock,
            ignore:actualReq.ignore,
            etag:actualReq.headers.etag,
            status:actualReq.statusCode,
            expires:actualReq.headers.expires,
            cacheChecked:actualReq.cacheChecked,
            newCache:actualReq.newCache
      };
      propString += 'props["' + actualReq.request.url + actualReq.hash + '"] =' + JSON.stringify(prop) + '\n';
      totalString += '<li class="ui-selectee" id= "' + actualReq.request.url + actualReq.hash;
      
      totalString += '">' + actualReq.request.url + "     " + actualReq.hash;
      if(actualReq.cacheChecked) {
         if(actualReq.newCache) {
            totalString += ' o';
         }else {
            totalString += ' *';
         }
      }else {
         totalString += ' X';
      }
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