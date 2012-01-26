exports.logLevel = 1;

exports.log = function(message, level) {
   if(level <= exports.logLevel) {
      console.log(message);
   }
};

//0 is quiet mode
//1 is only messages about changes via API
//2 is messages about whole requests/responses
//3 is messages about the parts of each request/response