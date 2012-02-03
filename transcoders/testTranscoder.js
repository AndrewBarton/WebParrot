exports.transcode = function(body, params) {
   if(typeof body == 'string') {
      body = body.replace(new RegExp('</script>', 'g'), '//Test transcoder succeeded!\n</script> ');
      console.log(body);
   }else {
      log.log('Test transcoder received non-string instead got: ' + (typeof body), 1);
   }
   return body;
};