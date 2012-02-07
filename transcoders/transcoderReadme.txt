Introduction to transcoders

Transcoders allow you to modify the content sent from the cache to the client.

A transcoder must be located in the transcoders folder and will be 'required' by the parrot as needed.
any transcoders must export a function called transcode that takes the body and an object containing any parameters

see testTranscoder.js for an example

Note that transcoders will only be called for any content types containing the phrases 'javascript' or 'text'.

Also note that the transcoders will be loaded when called, so you can modify and re-run them without restarting the parrot.

If this becomes too slow send me an email at AndrewBBarton@gmail.com and I will change it to load on parrot start.

Copyright Andrew Barton andrewbbarton@gmail.com,  2012
http://www.opensource.org/licenses/MIT, see LICENSE