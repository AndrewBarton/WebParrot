Introduction to transcoders

Transcoders allow you to modify the content sent from the cache to the client.

A transcoder must be located in the transcoders folder and will be 'required' by the parrot as needed.

All transcoders must export a function called transcode that takes the body, an object containing any parameters, and the
cache entry (for modifying headers, see currentEntry in WebParrot.js).

Transcoders will only be run if the content is of a type containing 'text' or 'javascript' and is not gziped.

see testTranscoder.js for an example

There are also two utility functions in utils.js, 
   getScripts(text, [keepType]) will get all of the scripts in text which have the type field match the provided keepType regex.
       If unspecified, will give scripts of type javascript and traceur
   replaceText(text, oldPart, newPart) will replace oldPart in text with the newPart. Straight string.replace will not work.
   
   
Make sure that you set the page to use your transcoder in the admin page. Multiple transcoders can be run, separated by hyphens,
    but they will share parameters.

The default transcoders can be set with the command line argument -defaulttranscoder [transcoder1-transcoder2-...]

Also note that the transcoders will be loaded when called, so you can modify and re-run them without restarting the parrot.

If this becomes too slow send me an email at AndrewBBarton@gmail.com and I will change it to load on parrot start.

Copyright Andrew Barton andrewbbarton@gmail.com,  2012
http://www.opensource.org/licenses/MIT, see LICENSE