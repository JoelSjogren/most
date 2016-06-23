/*  MoST Subtitle Player :: Implementation Overview

Code is inserted into the target web page, making syncing possible.

Subtitles are downloaded via DownSub (but we could have used the api).

A transparent overlay is created as a div using Zepto; see addOverlay.

*/

// Tip: Use the 'debugger' command to insert a breakpoint!

/*  Developer's notes (strange behavior)

In order to access the global variable 'player' at Viki when debugging using
Chrome's Developer Tools, the 'Elements' tab must be active.

*/

// One subtitle writer for each language.
var writers = [];

$(document).ready(function () {
    
    function init(message, sender, callback) {
        clean();
    
        // Initiate communication.
        startSync();
        addOverlay(message.style);
        writers = [];
        for (var i = 0; i < message.languages.length; i++) {
            var srt = message.subtitles[message.languages[i]];
            //debugger;
            writers[i] = new Writer(message.languages[i], srt);
            writers[i].play();
        }
    }

    chrome.extension.onMessage.addListener(init);

});

function clean() {
    // Stop the old "instance" if there is one.
    for (var i = 0; i < writers.length; i++) {
        writers[i].stop();
    }
    
    //$(".most-subtitles").remove();
    $("#most-overlay").remove();
}

function Writer(language, srt) {
    // The decoded srt file is organized into pages.
    this.pages = parseSubtitles(srt);
    this.current;
    
    // Text is continuously written as html.
    this.element = document.createElement("div");
    this.element.className = "most-subtitles most-" + language;
    $("#most-overlay")[0].appendChild(this.element);
    
    this.timer;

    this.play = function () {
        this.timer = true;
        
        var that = this;
        
        // To be run many times per second.
        function updateRepeatedly() {
            var period = 50;  // sleep time between updates
            
            // Get the local playback time (in milliseconds, starting at 0).
            var syncEl = document.getElementById("most-sync");
            var local = new Date().getTime() - parseInt(syncEl.innerHTML);
            
            // Write current subtitle page to screen.
            for (var i = 0; i < that.pages.length; i++) {  // TODO binary search?
                var page = that.pages[i];
                // the " + period" here is just for fine tuning, not optimal
                if (page['loc0'] <= local + period
                        && local + period <= page['loc1']
                        && that.current != i) {
                    that.show(page['s'], page['loc1']-local, i);
                }
            }
            
            // Reschedule, creating an infinite loop.
            if (that.timer) {
                that.timer = window.setTimeout(updateRepeatedly, period);
            }
        };
        
        updateRepeatedly();
    }
    
    this.stop = function() {
        this.timer = false;
    }

    // Show text, typically a subtitle page.
    this.show = function(text, duration, uid) {
        // Remove old text. (This is an exceptional case.)
        if (this.current !== undefined) {
            this.hide(this.current);
        }
    
        // Write the text to screen.
        var textEl = document.createElement("div");
        textEl.className = "uid_" + uid;
        textEl.innerHTML = text;
        this.element.appendChild(textEl);
        
        // Don't rewrite it a lot.
        this.current = uid;
        
        // Remember to remove it after a while.
        var that = this;
        window.setTimeout(function () {
            if (that.current === uid) {
                that.hide(uid);
                that.current = undefined;
            }
        }, duration);
    }

    // Hide text. Inverse of 'show'.
    this.hide = function(uid) {
        $(".uid_" + uid).remove();
    }
    
    this.show("Loaded " + this.pages.length + " pages.", 2000, "info");
    
    //debugger;

}

// Ugly hack independent of this scope (only its string will be injected).
function specialCode () {
    // Will hold the unix time minus local playback time (in milliseconds).
    $("body").append("<div id='most-sync'></div>");
    
    // Determine how the target player will tell its current position
    // (in seconds).
    var getCurrentTime = function() {
        // look for the regular player, subtitle editor (flash or html5)
        if ("player" in window) {
            return player.getCurrentTime();
        }
        if ("subber_player_flash_api" in window) {
            return subber_player_flash_api.player.currentTime();
        }
        if ("subber_player" in window) {
            return subber_player.player.currentTime();
        }
    }
    
    // Export this position continuously in html format (using the DOM).
    function syncForever() {
        var local = Math.round(getCurrentTime() * 1000);
        var syncVal = new Date().getTime() - local;
        document.getElementById("most-sync").innerHTML = syncVal;
        window.setTimeout(syncForever, 100);
    };
  
    syncForever();
}

function startSync() {
    // Inject the ugly hack into the web page.
    var script = document.createElement('script');
    script.appendChild(document.createTextNode(
        '('+ specialCode +')();'));
    (document.body || document.head || document.documentElement)
        .appendChild(script);
}

function addOverlay(style) {    
    // Create the overlay
    overlay = $("<div id='most-overlay'></div>");
    $("body").append(overlay);
    
    // Find the positioning of the video player, or use (bad) defaults.
    var video = $("#flashObject")[0] || $("#subber_player")[0];
    var videoRect = video ? video.getBoundingClientRect()
                          : {'width': 600, 'left': 20, 'bottom': 20};
    
    // Configure the looks and position.
    /*
    shadow = "0 0 black";  // transparent text shadow:
    for (var i=-1; i<=1; i++) for (var j=-1; j<=1; j++)
        shadow = i + "px " + j + "px rgba(0, 0, 0, 1), " + shadow;
    for (var i=-2; i<=2; i++) for (var j=-2; j<=2; j++)
        shadow = i + "px " + j + "px rgba(0, 0, 0, 0.4), " + shadow;
    for (var i=-3; i<=3; i++) for (var j=-3; j<=3; j++)
        shadow = i + "px " + j + "px rgba(0, 0, 0, 0.1), " + shadow;
    */
        
    overlay.css({
        position: "fixed",
        width: videoRect.width + "px",
        height: videoRect.height + "px",
        left: videoRect.left,
        top: videoRect.top,
        //background: "rgba(255, 150, 0, 0.5)",
        zIndex: "99999999",
        pointerEvents: "none",
        textAlign: "center"
    });
    
    // Set the subtitle style
    var styleEl = document.createElement("style");
    styleEl.innerHTML = style;
    $("head").append(styleEl);
}

// Convert an srt time string to integer.
function strToMs(loc) {
    var h, m, s, ms;
    [h, m, s, ms] = loc.replace(',', ':').split(':');
    [h, m, s, ms] = [parseInt(h), parseInt(m), parseInt(s), parseInt(ms)];
    return ((h*60 + m)*60 + s)*1000 + ms;
}

// Turn an srt into computation-friendly form: pages.
function parseSubtitles(srt) {
    var pages = [];

    var srt2 = srt.replace(/\r\n|\r|\n/g, '\n')  // Normalize newlines.
                  .trim(srt)
                  .split('\n\n');

    // Parse each page.
    for (var i = 0; i < srt2.length; i++) {
        var a, b, c, d, e, loc0, loc1;
        a = srt2[i];
        [b, c] = [a.slice(0, a.indexOf("\n")), a.slice(a.indexOf("\n")+1)];
        [d, e] = [c.slice(0, c.indexOf("\n")), c.slice(c.indexOf("\n")+1)];
        [loc0, loc1] = d.split(" --> ");
        
        // The following line improves security but comes at the cost of
        // not supporting arbitrary html markup.
        e = e.replace(/<\/?[^>]+(>|$)/g, function(part) {
            var accept = ['<i>', '</i>', '<br>', '</br>', '<b>', '</b>'];
            for (var i = 0; i < accept.length; i++) {
                if (part === accept[i]) return part;
            }
            return "";
        });
        
        pages.push({'loc0': strToMs(loc0), 'loc1': strToMs(loc1), 's': e});
    }
    
    return pages;
}






