Introduction to transcoders

Transcoders allow you to modify the content sent from the cache to the client. By default the transcoder 'traceurCompiler' is run on every page.
New transcoders can be easily written and added to WebParrot.




-------------------------------
Configuring transcoders:
-------------------------------

Transcoders will only be run if the content is of a type containing 'text' or 'javascript' and is not gziped.

Each page can be set to use a different transcoder and different parameters. This is done on the admin page.
Default transcoders and parameters can be set at startup on the command line.

Multiple transcoders can be given, separated by hyphens, but they will share parameters.






----------------------------------
Writing a new transcoder:
----------------------------------

Any transcoder must be located in the WebParrot/transcoders/ folder and will be 'required' by the parrot as needed.

All transcoders must export a function called transcode(body, params, entry) that takes the body, an object containing any parameters, and the
cache entry. Access to the cache entry allows for modification of the HTTP headers. The headers are available at entry.headers


see testTranscoder.js for an example

There are two utility functions in utils.js, 
   getScripts(text, [keepType]) will get all of the scripts in text which have the type field match the provided keepType regex.
       If unspecified, will give scripts of type javascript and traceur
   replaceText(text, oldPart, newPart) will replace oldPart in text with the newPart. Straight string.replace will not work.


Also note that the transcoders will be loaded when called, so you can modify and re-run them without restarting the parrot.

If this becomes too slow send me an email at AndrewBBarton@gmail.com and I can change it to load on parrot start.



----------------------------------

Command-line parameters:
----------------------------------

The default transcoders for every page can be set with the command line argument -defaulttranscoder [transcoder1-transcoder2-...]
The default parameters for every page can be set with the command line argument -defualtParameters [name1:value1-name2:value2]






Copyright Andrew Barton andrewbbarton@gmail.com,  2012
http://www.opensource.org/licenses/MIT, see LICENSE