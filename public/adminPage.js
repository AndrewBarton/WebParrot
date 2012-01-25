// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE

var parrotAPI = require('../ParrotAPI');
var app = parrotAPI.app;
var fs = require('fs');


var starter = '';

function onStarterRead(err, data) {
   starter = data;
}

app.get('/reqList', function(req, res) {
   var reqs = parrotAPI.getCachedReqsuests();
   var totalString = starter + '\n<ul id="selectable">';
   var propString = '';
   for(req in reqs) {
      actualReq = reqs[req];
      propString += 'props["' + actualReq.myRequest.url + actualReq.hash + '"] = { url:"' + actualReq.myRequest.url + '", lock:';
      propString += actualReq.lock + ', ignore:' + actualReq.ignore + ', etag:' + actualReq.headers.etag;
      propString +=  ', cacheChecked:' + actualReq.cacheChecked  +  ', newCache:' + actualReq.newCache + '};\n';
      totalString += '<li class="ui-selectee" id= "' + actualReq.myRequest.url + actualReq.hash;
      
      totalString += '">' + actualReq.myRequest.url + "     " + actualReq.hash;
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
fs.readFile('./public/list.html', 'utf8', onStarterRead);