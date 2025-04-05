/*  MoST Subtitle Player :: Implementation Overview
   =================================================

   Code is inserted into the target web page.

   We tap into the existing subtitle system.

   A transparent overlay is created as a div.

   Subtitles are configurable with CSS in a Chrome options page.

   Things were more complicated before. See older commits.

 */

/*  Developer's notes
   ===================

   In order to access the global variable 'player' at Viki when debugging using
   Chrome's Developer Tools, the 'Elements' tab must be active.

   Tip: Use the 'debugger' command to insert a breakpoint!

   For notes about the manifest v3 migration, see the commit logs.

 */

$(document).ready(function () {
    
    function init({style, languages, interactive, autopause_config}, sender, callback) {
        $('#most-overlay').remove();  // hacky cleanup of possible old instances
        if (interactive) {
            alert("Hint: Use F11 instead of the fullscreen button to keep dual subtitles in that mode.");
        } else {
	    location.reload();  // TODO support reloading the extension without reloading the page. broken due to const.
	}
        addOverlay();
        setStyle(style);
        addCueListeners(languages, autopause_config);
    }

    chrome.runtime.onMessage.addListener(init);

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

function addCueListeners(languages, autopause_config) {
    // Inject listeners (`injected_code.js`) into the webpage.
    var script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected_code.js');
    script.onload = function() { this.remove(); };  // (Not sure what this does...)
    script.dataset.params = JSON.stringify({languages, autopause_config});
    //alert(JSON.stringify({languages: languages, autopause_options: autopause_options}));
    (document.head || document.documentElement).appendChild(script);
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








