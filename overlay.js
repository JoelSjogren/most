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
        alert("Hint: Use F11 instead of the fullscreen button to keep dual subtitles in that mode.");
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
    script.appendChild(document.createTextNode(
        '('+ specialCode +')(' + JSON.stringify(languages) + ');'));
    (document.body || document.head || document.documentElement)
        .appendChild(script);
}

// To be injected -- as a string!
function specialCode (languages) {
    var tracks = player.subtitleManager.videojs.tech_.textTracks_;
    
    // Fill Viki's subtitle cache.
    var old = player.getCurrentSubtitle();
    for (var i = 0; i < languages.length; i++) {
        player.subtitleManager.subtitleLanguage = languages[i];
        player.loadSubtitles();
    }
    setTimeout(function() {  // Adding delay to workaround bug.
        player.subtitleManager.subtitleLanguage = old;
        player.loadSubtitles();
    }, 1000);
    
    // Register listeners with that cache.
    for (var i = 0; i < languages.length; i++) {
        // Html entry for subtitles in one language.
        var element = document.createElement("div");
        element.className = "most-subtitles most-" + languages[i];
	document.getElementById("most-overlay").appendChild(element);
    
        // Cue listener.
	// Find a track with the right language.
        for (var j = 0; j < tracks.length; j++) {
            if (tracks[j].language == languages[i]) {
		addCueListener(element, languages[i], tracks[j]);
		break;
	    }
        }
        
        function addCueListener(element, language, track) {
            track.addEventListener('cuechange', function() {
                console.log("> cue change (" + language + ") <");
                
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








