// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE
var parrotAPI = require('../ParrotAPI');
var app = parrotAPI.app;
var fs = require('fs');

var demoPage = "";
function onStarterRead(err, data) {
   demoPage = data;
}
app.get('/demo', function(req, res) {
   
   var date = new Date(Date.now());
   res.send(demoPage.replace('%REPLACEME', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()));
});
fs.readFile('./public/demo.html', 'utf8', onStarterRead);