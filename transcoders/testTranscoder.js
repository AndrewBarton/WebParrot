//Copyright Andrew Barton andrewbbarton@gmail.com,  2012
//http://www.opensource.org/licenses/MIT, see LICENSE

exports.transcode = function(body, params) {
   if(typeof body == 'string') {
      body = body.replace(new RegExp('//', 'g'), '//Test transcoder succeeded!\n ');
      body = body.replace(new RegExp('</script>', 'g'), '//Test transcoder succeeded!\n</script> ');
   }else {
      log.log('Test transcoder received non-string instead got: ' + (typeof body), 1);
   }
   return body;
};