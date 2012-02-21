// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrotAPI = require('../ParrotAPI');
var express = require('express');
var app = parrotAPI.app;
var fs = require('fs');
var log = require('../ParrotLogger');
var path = require('path');

app.get('/admin(.html)?', function(req, res) {
   log.log('admin page request received', 3);
   var adminPage = fs.readFileSync('./public/admin.html', 'utf-8');
   res.send(adminPage);
});

app.get('/transcoder.html', function (req, res) {

   var transcoderPage = fs.readFileSync('./public/transcoder.html', 'utf8');
   var tempText = transcoderPage.replace('%SITE', decodeURIComponent(req.query.site));
   tempText = tempText.replace('%NAME', parrotAPI.getCachedRequest(req.query.site).transcodeName);
   tempText = tempText.replace('%PARAMS', JSON.stringify(parrotAPI.getCachedRequest(req.query.site).transcodeParams));
   res.send(tempText);
}); 

app.get('/reqList', function(req, res) {
   log.log('reqList request received', 3);
   var entries = parrotAPI.getCachedReqsuests();
   var listPage = fs.readFileSync('./public/list.html', 'utf-8');
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
            newVer:entry.newCache,
            timeRetrieved:entry.timeRetrieved,
            timeChecked:entry.timeChecked,
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

app.get('/parrotPreview.html', function (req, res) {

   var previewPage = fs.readFileSync('./public/parrotPreview.html', 'utf8');
   res.send(previewPage);
});

app.get('/traceur/:one/:two?/:three?', function (req, res) {
   var filePath = req.params.one;
   filePath = ((typeof req.params.two == "undefined") ? filePath : path.join(filePath, req.params.two));
   filePath = ((typeof req.params.three == "undefined") ? filePath : path.join(filePath, req.params.three));
   var returnMe = fs.readFileSync('./public/traceur/' + filePath, 'utf-8');
   res.send(returnMe);
});

app.get('/', function (req, res) {
   console.log('admin page redirect received');
   res.redirect('/admin');
});