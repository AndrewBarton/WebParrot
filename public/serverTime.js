// Copyright Andrew Barton andrewbbarton@gmail.com,  2012
// http://www.opensource.org/licenses/MIT, see LICENSE
var parrotAPI = require('../ParrotAPI');
var app = parrotAPI.app;
var fs = require('fs');

var demoPage = "";
function onStarterRead(err, data) {
   demoPage = data;
}
app.get('*demo*', function(req, res) {
   console.log('demo asked for');
   var date = new Date(Date.now());
   var temp = demoPage.replace('%DATE', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
   console.log(req.headers['from']);
   temp = temp.replace('%PROXY', req.headers['from'] == 'passed@through.com' ? 'Passed through proxy' : 'NOT passed through proxy');
   res.send(temp);
});
fs.readFile('./public/demo.html', 'utf8', onStarterRead);