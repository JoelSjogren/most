/*  MoST Subtitle Player :: Implementation Overview

Code is inserted into the target web page.

We tap into the existing subtitle system.

A transparent overlay is created as a div.

Subtitles are configurable with CSS in a Chrome options page.

Things were more complicated before. See older commits.

*/

/*  Developer's notes

In order to access the global variable 'player' at Viki when debugging using
Chrome's Developer Tools, the 'Elements' tab must be active.

Tip: Use the 'debugger' command to insert a breakpoint!

*/

// One subtitle writer for each language.

$(document).ready(function () {
    
    function init(message, sender, callback) {
        $('#most-overlay').remove();  // hacky cleanup of possible old instances
        if (message.interactive) {
            alert("Hint: Use F11 instead of the fullscreen button to keep dual subtitles in that mode.");
        }
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

    // respond to window resize (e.g. F11)
    window.addEventListener("resize", updateVideoRectangle);
}

function addCueListeners(languages) {
    // Inject listeners ('specialCode') into the webpage.
    var script = document.createElement('script');
    script.appendChild(document.createTextNode('var most_dbg = {};'));
    script.appendChild(document.createTextNode(
        '('+ specialCode +')(' + JSON.stringify(languages) + ');'));
    (document.body || document.head || document.documentElement)
        .appendChild(script);
}

// To be injected -- as a string!
function specialCode (languages) {
    console.log("special code is actually running");
    
    // Make Viki load the required languages; keep the references.
    var tracks_source = player.subtitleManager.videojs.tech_.textTracks_;
    var tracks = most_dbg.tracks = {};
    var old_language = player.getCurrentSubtitle();
    for (var i = 0; i < languages.length; i++) {
        player.subtitleManager.cleanup();
        player.subtitleManager.setLanguage(languages[i]);
        console.assert(tracks_source.length == 1);
        console.assert(tracks_source[0].language == languages[i]);
        tracks[i] = tracks_source[0];
    }
    player.subtitleManager.cleanup();
    player.subtitleManager.setLanguage(old_language);

    // Without this configuration the listeners wouldn't get notified.
    for (var i = 0; i < languages.length; i++) {
        if (!(tracks[i] === undefined) && (tracks[i].mode === 'disabled')) {
            tracks[i].mode = 'hidden';  // known modes: disabled, hidden, showing
        }
    }
    
    // Register cue listeners for each language.
    for (var i = 0; i < languages.length; i++) {
        // Html entry for subtitles in one language.
        var element = document.createElement("div");
        element.className = "most-subtitles most-" + languages[i];
        document.getElementById("most-overlay").appendChild(element);
        
        // Cue listener.
        if (!(tracks[i] === undefined)) {
            addCueListener(element, languages[i], tracks[i]);
        }
        
        function addCueListener(element, language, track) {
            console.log("adding listener for: " + language);
            track.addEventListener('cuechange', function() {
                //console.log("> cue change (" + language + ") <");
                
                // Get the new subtitle page, or else an empty string.
                var cue = "";
                if (track.activeCues[0]) {
                    cue = track.activeCues[0].text;
                }
                
                // Show the new subtitle page.
                element.innerHTML = cue;
            });
        }
    }
}

function updateVideoRectangle() {
    // Get the video player.
    var video = document.getElementById("vmplayer_id_html5_api");
    var videoRect = video.getBoundingClientRect();
    
    $("#most-overlay").css({
        position: "fixed",
        width: videoRect.width + "px",
        height: videoRect.height + "px",
        left: videoRect.left,
        top: videoRect.top,
        zIndex: "2147483647",  // Place subtitles on top of the video.
        pointerEvents: "none",
        textAlign: "center"
    });
}








