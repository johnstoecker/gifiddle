function MapDecorator(player, data) {
    // TODO: calculate this on fly for variable height maps
    const MAPSCALE=5;
    console.log(player)
    console.log(data);

    data = {
      events: [{
        text: "Kings Landing Founded",
        position: [50,50],
        time: 1
      },{
        text: "Children of the Forest Retreat",
        position: [50, 10],
        time: 2
      },{
        text: "Doom of Valyria",
        position: [80,80],
        time: 25
      }],
      legend: {
        position: [0,80],
        symbols: [{
          text: "The North",
          color: "#FFFFFF"
        }, {
          text: "Iron Islands",
          color: "#333333"
        }]
      },
      labels: [{
        text: "The Narrow Sea",
        frames: [1,100],
        position: [80, 50]
      }, {
        text: "Dorne",
        frames: [5,15],
        position: [50, 90]
      }]
    }
    var eventsHashMap = new Map();
    $.each(data.events, function($index, event) {
      eventsHashMap.set(event.time, event)
    })
    var mapDiv = $('#map-overlay');

    // initialize function that puts up the legend
    // function that grabs exactly what is visible from current mapData
    // function that renders those objects (turns everything else off?) + sets the text for event + puts dot on event
    initializeComponents();

    player.events.on('update', function(currentFrameIndex,prevFrameIndex) {
      renderMapComponents(currentFrameIndex);
      // console.log(x+' '+y)
    })

    function renderMapComponents(frame) {
      // if no frames given, render for all frames
      // for ease of jquery selection
      hiddenDivIds = "#no-id-given"
      visibleDivIds = "#no-id-given"
      $.each(data.labels, function($index, label) {
        if(label.frames && label.frames.length && label.frames.length > 0) {
          if(frame > label.frames[0] && frame < label.frames[1]) {
            visibleDivIds+=(", #"+label.id)
          } else {
            hiddenDivIds+=(", #"+label.id)
          }
        } else {
          visibleDivIds+=(", #"+label.id)
        }
      })
      var currentEvent = eventsHashMap.get(frame);
      if(currentEvent){
        visibleDivIds+=(", #event-text");
        $("#event-text").text(currentEvent.text);
        if(currentEvent.position) {
          visibleDivIds+=(", #event-pixel");
          setPosition($("#event-pixel"), currentEvent.position);
        }
      } else {
        hiddenDivIds+=(", #event-text, #event-pixel");
      }
      $(visibleDivIds).removeClass("hidden");
      $(hiddenDivIds).addClass("hidden");
    }

    function initializeComponents() {
      // mapDiv.append( "<div class='legend'>Test</div>" );
      // build legend
      if (data.legend && data.legend.position) {
        $legend = buildLegend(data.legend)
        $labels = buildLabels(data.labels)
        mapDiv.append($legend);
        mapDiv.append($labels);
      }
      // var photos = [];
      // $.each(data.items, function(index, photo) {
      //   var $imageSpan = $("<span></span>").addClass("image");
      //   var $anchorTag = $("<a></a>").prop("href", photo.link);
      //   $("<img/>").prop("src", photo.media.m.replace("_m", "_o")).appendTo($anchorTag);
      //   $anchorTag.appendTo($imageSpan);
      //   photos.push($imageSpan);
      // });
      // $photoDiv.append(photos);
    }
    // var instance = {
    //     events: new Events(),
    //     // loader: new GifiddleLoader(),
    //     loadBuffer: function(buffer) {
    //         if (player) {
    //             player.destroy();
    //         }
    //
    //         player = new GifPlayer(domViewport[0]);
    //         this.events.emit('initPlayer', player);
    //         player.events.on('ready', function() {
    //             this.loader.showCanvas();
    //         }.bind(this));
    //         player.events.on('error', function(evt) {
    //             this.loader.showError(evt.message);
    //             console.error(evt);
    //         }.bind(this));
    //         player.load(buffer);
    //     },
    //     loadBlob: function(blob) {
    //         this.loader.showLoad();
    //
    //         var reader = new FileReader();
    //         reader.addEventListener('load', function(event) {
    //             this.loadBuffer(event.target.result);
    //         }.bind(this));
    //         reader.readAsArrayBuffer(blob);
    //     },
    //     loadFile: function(file) {
    //         document.title = title + ': ' + file.name;
    //         window.location.hash = '';
    //
    //         this.loadBlob(file);
    //     },
    // };
    // safely grab position
    function setPosition($div, pos) {
      divPosition = [parseInt(pos[0]), parseInt(pos[1])]
      $div.css("position", "absolute");
      $div.css("left", divPosition[0] * MAPSCALE + "px")
      $div.css("top", divPosition[1] * MAPSCALE + "px")
      return $div;
    }

    function buildLegend(legend) {
      var $legend = $(".legend");
      $legend = setPosition($legend, legend.position)
      $.each(legend.symbols, function($index, symbol) {
        var $legendSymbol = $("<div></div>").addClass("legend-symbol").text(symbol.text);
        var $legendColor = $("<div></div>").addClass("legend-color").css('background-color', symbol.color);
        $legendSymbol.appendTo($legend);
        $legendColor.appendTo($legend);
      })
      // $.each(data.items, function(index, photo) {
      //   var $imageSpan = $("<span></span>").addClass("image");
      //   var $anchorTag = $("<a></a>").prop("href", photo.link);
      //   $("<img/>").prop("src", photo.media.m.replace("_m", "_o")).appendTo($anchorTag);
      //   $anchorTag.appendTo($imageSpan);
      //   photos.push($imageSpan);
      // });
      return $legend;
    }
    function buildLabels(labels){
      var labelDivs = []
      $.each(labels, function($index, label) {
        var $label = $("<div></div>").addClass("map-overlay-label").text(label.text);
        var id = generateUUID();
        $label.attr('id', id)
        label.id = id;
        // make it hidden first, enable per-frame
        // $label.addClass("hidden");
        $label = setPosition($label, label.position);
        labelDivs.push($label);
      })
      return labelDivs;
    }

    // function renderFrame() {
    //
    // }

}

// lol
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};
