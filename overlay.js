/*  MoST Subtitle Player :: Implementation Overview

Code is inserted into the target web page, making syncing possible.

Subtitles are downloaded via DownSub (but we could have used the api).

A transparent overlay is created as a div using Zepto; see addOverlay.

Subtitles are configurable with CSS in a Chrome options page.

*/

// Tip: Use the 'debugger' command to insert a breakpoint!

/*  Developer's notes

In order to access the global variable 'player' at Viki when debugging using
Chrome's Developer Tools, the 'Elements' tab must be active.

UPDATE 2016-10-07: player.player.tech_.textTracks() will be a list of all
subtitles for the current episode! This means that DownSub could be replaced.

*/

// One subtitle writer for each language.

$(document).ready(function () {
    
    function init(message, sender, callback) {
        alert("Alive!");
        addOverlay();
        setStyle(message.style);
        addCueListeners(message.languages);
    }

    chrome.extension.onMessage.addListener(init);

});

function addOverlay(style) {
    var overlay = $("<div id='most-overlay'></div>");
    $("body").append(overlay);
}

function setStyle(style) {
    updateVideoRectangle();
    var styleEl = document.createElement("style");
    styleEl.innerHTML = style;
    $("head").append(styleEl);
}

function addCueListeners(languages) {
    // Inject listeners ('specialCode') into the webpage.
    var script = document.createElement('script');
    script.appendChild(document.createTextNode(
        '('+ specialCode +')(' + JSON.stringify(languages) + ');'));
    (document.body || document.head || document.documentElement)
        .appendChild(script);
}

// To be injected -- as a string!
function specialCode (languages) {
    var player = html5player.player;
    var tracks = player.subtitle.videojs.tech_.textTracks_;
    
    // Fill Viki's subtitle cache.
    var old = player.getSubtitleLanguage();
    for (var i = 0; i < languages.length; i++) {
        player.setSubtitleLanguage(languages[i]);
    }
    player.setSubtitleLanguage(old);
    
    // Register listeners with that cache.
    for (var i = 0; i < languages.length; i++) {
        // Html entry for subtitles in one language.
        var element = document.createElement("div");
        element.className = "most-subtitles most-" + language;
        $("#most-overlay")[0].appendChild(element);
    
        // Cue listener.
        var j;  // Find a track with the right language.
        for (j = 0; j < tracks.length; j++) {
            if (tracks[j].language == languages[i]) break;
        }
        addCueListener(element, languages[i], tracks[j]);
        
        function addCueListener(element, language, track) {
            track.addEventListener('cuechange', function() {
                console.log("> cue change (" + language + ") <");
                
                var cue = "";
                if (track.activeCues[0]) {
                    cue = track.activeCues[0].text;
                }
                element.innerHTML = cue;
                
                // use this.element here
                /*
                // Remove old text. (This is an exceptional case.)
                if (this.current !== undefined) {
                    this.hide(this.current);
                }
            
                // Write the text to screen.
                var textEl = document.createElement("div");
                textEl.className = "uid-" + uid;
                textEl.innerHTML = text;
                this.element.appendChild(textEl);
                */
            });
        }
    }
}

function updateVideoRectangle() {
    // The video player.
    var video = $("#video-player_Shaka_api")[0] ||
        $("#video-player_html5_api")[0] || $("#subber_player")[0];
    var videoRect = video.getBoundingClientRect();
    
    $("#most-overlay").css({
        position: "fixed",
        width: videoRect.width + "px",
        height: videoRect.height + "px",
        left: videoRect.left,
        top: videoRect.top,
        zIndex: "2147483647",
        pointerEvents: "none",
        textAlign: "center"
    });
}








