/**
 * This is needed because a straight up replace won't work.
 * Instead it splits across the old part, then pieces the two 
 * halves back with the new part inserted.
 * 
 * @param body The overall text
 * @param oldPart The part of the text to be removed
 * @param newPart The text to be inserted.
 * @returns
 */
exports.replaceText = function (body, oldPart, newPart) {
   var pieces = body.split(oldPart);
   return pieces[0] + newPart + pieces[1];
};

/**
 * 
 * @param text The overall text
 * @param type a RegExp containing script types to KEEP
 * @returns {Array} The scripts
 */
exports.getScripts = function(text, keepType) {
 //if no type specified, use traceur or javascript
   keepType = (typeof keepType == 'undefined') ? 'text/(traceur|javascript)' : keepType;
   
   //now split along all the script lines, specifically those without an src field
   var splits = text.split(/<script (?!src=".*?")/);
   
   var returnMe = [];
   //for each split, remove the end of the starting script tag and everything after the end of the script tag
   for(var i = 1; i < splits.length; i++) {
      var part = splits[i];
      
      var scriptType = part.match(new RegExp('type *= *"' + keepType + '"'));
      
      //remove anything before the end of the opening script tag.
      part = part.replace(new RegExp('[ "/=\\w]*>'), '');
      //also removes everything that doesn't end in </script>
      part = part.substring(0, part.indexOf('</script>'));
      if(part.length > 0 && scriptType) {
         returnMe[returnMe.length] = part;
      }
   }
   return returnMe;
};