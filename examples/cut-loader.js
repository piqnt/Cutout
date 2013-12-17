/*
 * Cut.js
 * Copyright (c) 2013 Ali Shakiba, Piqnt LLC and other contributors
 * Available under the MIT license
 * @license
 */

DEBUG = (typeof DEBUG === 'undefined' || DEBUG) && console;

/**
 * Simple full-screen and resizable loader for web.
 */

window.addEventListener("load", function() {
  DEBUG && console.log("On load.");
  Cut.Loader.start();
}, false);

Cut.Loader = {
  start : function() {
    if (this.started) {
      return;
    }
    this.started = true;
    Cut.Loader.play();
  },
  play : function() {
    this.played = true;
    for ( var i = this.loaders.length - 1; i >= 0; i--) {
      this.players.push(this.loaders[i]());
      this.loaders.splice(i, 1);
    }
  },
  pause : function() {
    for ( var i = this.loaders.length - 1; i >= 0; i--) {
      this.players[i].player.pause();
    }
  },
  resume : function() {
    for ( var i = this.loaders.length - 1; i >= 0; i--) {
      this.players[i].player.resume();
    }
  },
  loaders : [],
  players : [],
  load : function(app, canvas) {
    function loader() {
      var result = {}, context, root, full = false;
      var width = 0, height = 0;
      var devicePixelRatio = 1, backingStoreRatio = 1, ratio = 1;

      DEBUG && console.log("Loading images...");
      Cut.loadImages(function(src, handleComplete, handleError) {
        var image = new Image();
        DEBUG && console.log("Loading image: " + src);
        image.onload = handleComplete;
        image.onerror = handleError;
        image.src = src;
        return image;
      }, init);

      function init() {
        DEBUG && console.log("Images loaded.");

        if (!canvas) {
          canvas = document.getElementById("cutout");
        }

        if (!canvas) {
          full = true;
          DEBUG && console.log("Creating canvas...");
          canvas = document.createElement("canvas");
          canvas.style.position = "absolute";
          var body = document.body;
          body.insertBefore(canvas, body.firstChild);
        }

        context = canvas.getContext("2d");

        DEBUG && console.log("Creating root...");
        root = app(canvas);

        devicePixelRatio = window.devicePixelRatio || 1;
        backingStoreRatio = context.webkitBackingStorePixelRatio
            || context.mozBackingStorePixelRatio
            || context.msBackingStorePixelRatio
            || context.oBackingStorePixelRatio
            || context.backingStorePixelRatio || 1;

        ratio = devicePixelRatio / backingStoreRatio;

        resize();
        window.addEventListener("resize", resize, false);

        DEBUG && console.log("Playing...");
        result.player = Cut.Player.play(root, function(root) {
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, width, height);
          root.render(context);
        }, requestAnimationFrame);
      }

      function resize() {

        if (full) {
          width = (window.innerWidth > 0 ? window.innerWidth : screen.width);
          height = (window.innerHeight > 0 ? window.innerHeight : screen.height);
        } else {
          width = canvas.clientWidth;
          height = canvas.clientHeight;
        }

        width *= ratio;
        height *= ratio;

        canvas.width = width;
        canvas.height = height;
        canvas.ratio = ratio;

        DEBUG
            && console.log("Resize: " + width + " x " + height + " / " + ratio);

        root.visit({
          start : function(cut) {
            var stop = true;
            var listeners = cut.listeners("resize");
            if (listeners) {
              for ( var l = 0; l < listeners.length; l++)
                stop &= !listeners[l].call(cut, width, height);
            }
            return stop;
          }
        });
      }

      return result;
    }

    if (this.played) {
      this.players.push(loader());
    } else {
      this.loaders.push(loader);
    }

  }
};

!function() {
  var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
  for ( var v = 0; v < vendors.length && !window.requestAnimationFrame; v++) {
    var vendor = vendors[v];
    window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame']
        || window[vendor + 'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame) {
    var next = 0;
    window.requestAnimationFrame = function(callback) {
      var now = new Date().getTime();
      next = Math.max(next + 16, now);
      return window.setTimeout(function() {
        callback(next);
      }, next - now);
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}();