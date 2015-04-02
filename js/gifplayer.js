'use strict';

function GifPlayer(canvas) {
    
    var gif = null;
    var ctx = canvas.getContext('2d');
    
    var frameIndexCurr = 0;
    var frameIndexPrev = 1;
    var framePrev = null;
    var loopCount = 0;
    var timeout = null;
    var playing = false;
    var ready = false;
    var userInput = false;
    
    var renderRaw = false;
    var renderBackground = false;
    
    // override clearRect so it can also render the background color when enabled
    ctx.clearRect = function(x, y, width, height) {
        // I'd like a super.clearRect(), but JavaScript disagrees...
        Object.getPrototypeOf(this).clearRect.call(this, x, y, width, height);

        var hdr = gif.hdr;
        if (!renderRaw && renderBackground && hdr.gctFlag) {
            this.save();
            this.fillStyle = 'rgb(' + hdr.gct[hdr.bgColor].join() + ')';
            this.fillRect(x, y, width, height);
            this.restore();
        }
    };
    
    function render(frameIndex) {
        var frame = instance.getFrame(frameIndex);
        if (!frame) {
            throw new Error("Invalid frame index: " + frameIndex);
        }

        // restore previous area
        if (!renderRaw && framePrev) {
            framePrev.repair(ctx);
        }
        
        // clear canvas before rendering the background
        if (frameIndex === 0) {
            instance.clear();
        }
        
        // shade frame background in raw mode
        if (renderRaw) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(frame.left, frame.top, frame.width, frame.height);
            ctx.restore();
        }
        
        // render new frame
        frame.blit(ctx);

        framePrev = frame;
    }
    
    function setReady() {
        ready = true;
        instance.clear();
        instance.setFirst();
        instance.events.emit('ready', gif);
    }
        
    var instance = {
        events: new Events(),
        load: function(buffer) {
            gif = new GifFile();
            gif.byteLength = buffer.byteLength;
            gif.load(buffer, function() {
                canvas.width = gif.hdr.width;
                canvas.height = gif.hdr.height;

                setReady();
            }.bind(this));
        },
        play: function() {
            // don't try to animate static GIFs
            if (this.getFrameCount() <= 1) {
                return;
            }

            // don't play if it's aready playing
            if (playing) {
                return;
            }
                        
            var that = this;
            
            loopCount = 0;
            
            function fixDelay(delay) {
                // Set a fixed delay of 200 ms for GIF87a files to emulate old
                // decoders running on old hardware, which is what most ancient
                // animated GIFs are designed for.
                if (gif.hdr.ver === '87a' && delay === -1) {
                    return 20;
                }
                
                // GIFs with loop extensions and no frame delays is somewhat
                // undefined behavior, but most browsers change delays shorter
                // than 20 ms to 100 ms to avoid high CPU usage or even infinite
                // loops.
                if (gif.loopCount !== -1 && delay < 2) {
                    return 10;
                }
                
                return delay;
            }
            
            function playNext() {
                that.setNext();
                
                // check if the current frame is the last one
                if (that.isLastFrame()) {
                    loopCount++;
                    
                    // pause if there's no loop count
                    if (gif.loopCount === -1) {
                        that.pause();
                        return false;
                    }
                    
                    // pause if the loop count has been reached
                    if (gif.loopCount > 0 && loopCount >= gif.loopCount) {
                        that.pause();
                        return false;
                    }
                }
                
                return true;
            }
            
            // analyze the delay of all frames for some special cases
            var globalDelay = -1;
            var frameCount = this.getFrameCount();
            for (var i = 0; i < frameCount; i++) {
                var frame = this.getFrame(i);
                var gce = frame.gce;
                var frameDelay = gce ? gce.delayTime : -1;
                var frameUserInput = gce ? gce.userInput : false;
                
                // frames with user input need to be handled by playLoop()
                // further below
                if (frameUserInput) {
                    globalDelay = -2;
                    break;
                }
 
                if (i === 0) {
                    // first frame, set reference delay
                    globalDelay = frameDelay;
                } else {
                    if (frameDelay !== globalDelay) {
                        // frame has a different delay, invalidate global delay
                        globalDelay = -2;
                        break;
                    }
                }
            }
            
            // check if there's a global delay set for all frames
            if (globalDelay !== -2) {
                globalDelay = fixDelay(globalDelay);
                if (globalDelay === 0) {
                    // there's no point in playing the animation, simply display
                    // the last frame instead of spamming update events
                    this.setLast();
                    return;
                }
            }

            playing = true;
            
            function playNextLoop() {
                if (playNext()) {
                    playLoop();
                }
            }
            
            function playLoop() {
                var delay = 0;
                do {
                    var frame = that.getFrame();
                    var gce = frame.gce;
                    
                    delay = gce ? gce.delayTime : -1;
                    
                    // cancel previous user input
                    if (userInput) {
                        that.events.emit('userInputEnd');
                    }
                    
                    userInput = gce ? gce.userInput : false;
                    
                    // does the next frame require user input?
                    if (userInput) {
                        that.events.emit('userInputStart', delay);
                        
                        // pause when waiting for user input infinitely
                        if (delay === 0) {
                            return;
                        }
                    }
                    
                    // override delay where required
                    delay = fixDelay(delay);
                    
                    if (delay > 0) {
                        // play next frame with delay
                        timeout = setTimeout(playNextLoop, delay * 10);
                    } else {
                        // play next frame immediately
                        if (!playNext()) {
                            return;
                        }
                    }
                } while (delay <= 0);
            }
            
            playLoop();
            
            if (playing) {
                this.events.emit('play');
            }
        },
        pause: function() {
            if (!playing) {
                return;
            }

            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            
            if (userInput) {
                this.events.emit('userInputEnd');
                userInput = false;
            }
            
            playing = false;
            
            this.events.emit('pause');
        },
        stop: function() {
            if (!playing) {
                return;
            }

            this.pause();
            frameIndexCurr = 0;
        },
        toggle: function() {
            if (this.isPlaying()) {
                this.pause();
            } else {
                this.play();
            }
        },
        isPlaying: function() {
            return playing;
        },
        isReady: function() {
            return ready;
        },
        setNext: function() {
            this.setFrameIndex(frameIndexCurr + 1);
        },
        setPrevious: function() {
            this.setFrameIndex(frameIndexCurr - 1);
        },
        setFirst: function() {
            this.setFrameIndex(0);
        },
        setLast: function() {
            this.setFrameIndex(this.getFrameCount() - 1);
        },
        isLastFrame: function() {
            return this.getFrameIndex() === this.getFrameCount() - 1;
        },
        setFrameIndex: function(frameIndex) {
            var frameCount = this.getFrameCount();
            
            if (frameCount > 0) {
                while (frameIndex < 0) {
                    frameIndex += frameCount;
                }

                while (frameIndex >= frameCount) {
                    frameIndex -= frameCount;
                }
            }

            frameIndexCurr = frameIndex;

            this.update();
        },
        getFrameIndex: function() {
            return frameIndexCurr;
        },
        getFrameCount: function() {
            return gif.frames.length;
        },
        getFrame: function(frameIndex) {
            if (arguments.length === 1) {
                return gif.frames[frameIndex];
            } else {
                return gif.frames[frameIndexCurr];
            }
        },
        setRenderRaw: function(_renderRaw) {
            if (renderRaw === _renderRaw) {
                return;
            }
            
            renderRaw = _renderRaw;
            
            this.refresh();
        },
        isRenderRaw: function() {
            return renderRaw;
        },
        setRenderBackground: function(_renderBackground) {
            if (renderBackground === _renderBackground) {
                return;
            }
            
            renderBackground = _renderBackground;
            
            this.refresh();
        },
        isRenderBackground: function() {
            return renderBackground;
        },
        update: function() {
            // don't update if the indices are unchanged
            if (frameIndexCurr === frameIndexPrev) {
                return;
            }

            this.events.emit('update', frameIndexCurr, frameIndexPrev);

            // check if frames need to be replayed 
            var frameStart;
            var frameEnd;

            if (renderRaw) {
                this.clear();
                frameStart = frameEnd = frameIndexCurr;
            } else {
                if (frameIndexCurr < frameIndexPrev) {
                    // next frame is behind the current, clear screen and re-render
                    // all frames from start to the current position
                    frameStart = 0;
                    frameEnd = frameIndexCurr;
                } else {
                    // next frame comes after the current
                    frameStart = frameIndexPrev + 1;
                    frameEnd = frameIndexCurr;
                }
            }

            for (var i = frameStart; i <= frameEnd; i++) {
                render(i);
            }

            frameIndexPrev = frameIndexCurr;
        },
        refresh: function() {
            var frameIndex = frameIndexCurr;
            if (frameIndex === 0) {
                this.setNext();
                this.setPrevious();
            } else {
                this.setFrameIndex(0);
                this.setFrameIndex(frameIndex);
            }
        },
        clear: function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);            
            framePrev = null;
        },
        destroy: function() {
            if (!ready) {
                gif.cancel();
            }
            
            this.stop();
            this.clear();
        }
    };
    
    return instance;
}

function GifFile() {
    this.hdr = null;
    this.loopCount = -1;
    this.comments = [];
    this.frames = [];
    this.worker = undefined;
}

GifFile.prototype = {
    load: function(buffer, callback) {
        if (!callback) {
            callback = function() {};
        }
        
        var gce;
        var handleBlock = function(block) {
            switch (block.type) {
                case 'hdr':
                    this.hdr = block;
                    break;

                case 'img':
                    this.frames.push(new GifImageFrame(this.hdr, gce, block));
                    gce = null;
                    break;

                case 'ext':
                    switch (block.extType) {
                        case 'gce':
                            gce = block;
                            break;

                        case 'com':
                            // convert line breaks
                            var comment = block.comment.replace(/\r\n?/g, '\n');
                            this.comments.push(comment);
                            break;

                        case 'pte':
                            this.frames.push(new GifTextFrame(this.hdr, gce, block));
                            gce = null;
                            break;

                        case 'app':
                            if (block.identifier === 'NETSCAPE' && block.subBlockID === 1) {
                                this.loopCount = block.loopCount;
                            }
                            break;
                    }
                    break;

                case 'eof':
                    callback();
                    break;
            }
        }.bind(this);

        // load GIF in a worker if possible
        if (!!window.Worker) {
            this.worker = new Worker('js/gifworker.js');
            this.worker.addEventListener('message', function(evt) {
                handleBlock(evt.data);
            }, false);
            this.worker.postMessage(buffer);
        } else {
            var gif = new Gif();
            gif.handleBlock = handleBlock;
            gif.parse(buffer);
        }
    },
    cancel: function() {
        // terminate worker if running
        if (this.worker) {
            this.worker.terminate();
            this.worker = undefined;
        }
    }
};

function GifFrame(hdr, gce, block) {
    this.hdr = hdr;
    this.gce = gce;
    this.canvas = null;
    this.prevImageData = null;
    
    this.width = block.width;
    this.height = block.height;
    this.top = block.topPos;
    this.left = block.leftPos;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.ctx = this.canvas.getContext('2d');

    this.trans = -1;

    if (this.gce && this.gce.transparencyFlag) {
        this.trans = this.gce.transparencyIndex;
    }
}

GifFrame.prototype = {
    blit: function(ctx) {
        // keep a copy of the original rectangle for later disposal
        if (this.gce && this.gce.disposalMethod === 3) {
            this.prevImageData = ctx.getImageData(this.left, this.top,
                this.width, this.height);
        }
        
        ctx.drawImage(this.canvas, this.left, this.top);
    },
    repair: function(ctx) {
        if (!this.gce) {
            return;
        }
        
        switch (this.gce.disposalMethod) {
            // restore background
            case 2:
                ctx.clearRect(this.left, this.top, this.width, this.height);
                break;
                
            // restore previous
            case 3:
                if (this.prevImageData) {
                    ctx.putImageData(this.prevImageData, this.left, this.top);
                }
                break;
        }       
    }
};

function GifImageFrame(hdr, gce, img) {
    GifFrame.call(this, hdr, gce, img);
    
    this.img = img;
    
    var imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    var numPixels = this.img.pixels.length;
    var colorTable;

    if (this.img && this.img.lctFlag) {
        colorTable = this.img.lct;
    } else if (this.hdr.gctFlag) {
        colorTable = this.hdr.gct;
    } else {
        throw new GifError('No color table defined');
    }

    for (var i = 0; i < numPixels; i++) {
        // imageData.data = [R,G,B,A,...]
        var color = colorTable[this.img.pixels[i]];
        imageData.data[i * 4 + 0] = color[0];
        imageData.data[i * 4 + 1] = color[1];
        imageData.data[i * 4 + 2] = color[2];
        
        if (this.img.pixels[i] === this.trans) {
            imageData.data[i * 4 + 3] = 0;
        } else {
            imageData.data[i * 4 + 3] = 255;
        }
    }

    this.ctx.putImageData(imageData, 0, 0);

    // free the now unused pixel data buffer
    this.img.pixels = null;
}

GifImageFrame.prototype = Object.create(GifFrame.prototype);

function GifTextFrame(hdr, gce, pte) {
    GifFrame.call(this, hdr, gce, pte);
    
    this.pte = pte;
    
    // Plain text always uses the global color table, no matter what's
    // set in the GCE. This also means we can't continue without.
    var colorTable = this.hdr.gct;
    if (!colorTable) {
        throw new GifError('No color table defined');
    }

    // render background
    if (this.pte.bgColor !== this.trans) {
        var bgColor = colorTable[this.pte.bgColor];

        this.ctx.fillStyle = 'rgb(' + bgColor.join() + ')';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // render text
    if (this.pte.fgColor !== this.trans) {
        var fgColor = colorTable[this.pte.fgColor];
        var cellWidth = this.pte.charCellWidth;
        var cellHeight = this.pte.charCellHeight;

        // "The selection of font and size is left to the discretion of
        // the decoder." Well, who needs consistency, anyway?
        var fontSize = (cellHeight * 0.8).toFixed(2) + 'pt';
        this.ctx.font = fontSize + ' "Lucida Console", Monaco, monospace';

        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgb(' + fgColor.join() + ')';

        // text positions, the current values and their limits, rounded
        // down to cell size
        var textTop = 0;
        var textTopMax = (Math.floor(this.height / cellHeight) * cellHeight);
        var textTopOffset = (cellHeight / 2);
        var textLeft = 0;
        var textLeftMax = (Math.floor(this.width / cellWidth) * cellWidth);
        var text = this.pte.plainText;

        for (var i = 0; i < text.length; i++) {
            var char = text.charCodeAt(i);

            // see 25e
            if (char < 0x20 || char > 0x7f) {
                char = 0x20;
            }

            // for debugging
            //this.ctx.strokeRect(textLeft, textTop, cellWidth, cellHeight);

            // draw character
            this.ctx.fillText(String.fromCharCode(char), textLeft,
                textTop + textTopOffset, cellWidth);

            // move to the right by one char
            textLeft += cellWidth;

            // continue at next line when the grid was hit
            if (textLeft >= textLeftMax) {
                textLeft = 0;
                textTop += cellHeight;

                // cancel if the next line is outside the grid
                if (textTop >= textTopMax) {
                    break;
                }
            }
        }
    }
}

GifTextFrame.prototype = Object.create(GifFrame.prototype);