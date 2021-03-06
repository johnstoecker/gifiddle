# gifiddle

gifiddle is a GIF viewer based on JavaScript and HTML5 that runs entirely in a browser.

Now, you may think: *"Who the hell would need that? GIFs are supported by browsers since the invention of the WWW!"*.

That's correct. But wait, there's more!

* A video player interface for frame-precise playback control.
* Detailed information and various rendering modes for analysis and optimization.
* Correct delay handling for non-looping GIF animations.
* Full support of all GIF89a features, including the long-forgotten plain text extension and the "wait for user input" flag, which allows some historical GIFs to be viewed correctly.

### Examples

Mixed image/text GIFs (browsers display the images only):

* [BOB_89A.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/gifsgalore/GIFS/MISC/BOB_89A.GIF) - GIF89a introduction by Bob Berry
* [STIGR9.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/megarom/megarom1/GIF/STIGR9.GIF) - Steel Tiger V9 by Jim Burton
* [CG89A.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/megarom/megarom1/GIF/CG89A.GIF) - A GIF with two dogs and text shadow effects

Pure text GIFs (broken in browsers):

* [89AILLUS.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/megarom/megarom1/GIF/89AILLUS.GIF) - GIF89a illustration
* [TEXTTST.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/megarom/megarom1/GIF/TEXTTST.GIF) - Text test

GIF87a animations:

* [ANIPEPSI.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/gifsgalore/GIFS/LOGOS/ANIPEPSI.GIF) - Old Pepsi animation
* [BUBBLES2.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/gifsgalore/GIFS/FOOD/BUBBLES2.GIF) - Old bubbles animation
* [SHINY2.GIF](http://ata4.github.io/gifiddle/#http://cd.textfiles.com/gifsgalore/GIFS/MISC/SHINY2.GIF) - Another animation by Jim Burton (NSFW)

Cinemagraph examples (activate "Render raw frames" to visualize the optimization):

* [cointreau-table-980.gif](http://ata4.github.io/gifiddle/#http://static1.squarespace.com/static/51c748abe4b0c275d0aa86bf/56141f2be4b0a4afc2d17505/56141f47e4b050ae7ebb8a20/1444159373902/cointreau-table-980.gif)
* [patagonia-cinemagraph.gif](http://ata4.github.io/gifiddle/#http://static1.squarespace.com/static/51c748abe4b0c275d0aa86bf/56141631e4b0095d43132f02/5614164ae4b018c0454fd5e0/1444744691618/patagonia-cinemagraph.gif)
* [spg.gif](http://ata4.github.io/gifiddle/#http://static1.squarespace.com/static/51c748abe4b0c275d0aa86bf/56141631e4b0095d43132f02/56143453e4b06dc85b46bf6b/1444744863151/spg.gif)

### Compatibility

Most modern browsers in their recent versions (as of 2015) should work. I tested gifiddle with Firefox 36, Chrome 41 and, with a few quirks, Internet Explorer 10. The app makes extensive use of HTML5 and JavaScript features, so don't expect it to run in old browsers.

Also note that gifiddle requires quite a lot of RAM for large GIFs, since every frame needs to be decoded and kept in memory.

### Credits

The GIF reading code is mostly based on [shachaf's](https://github.com/shachaf) [jsgif](https://github.com/shachaf/jsgif), modified with a fast LZW implementation from [deanm's](https://github.com/deanm) [omggif](https://github.com/deanm/omggif) and a few extensions on my side.