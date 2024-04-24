// This file runs directly on the webpage, rather than isolated within the extension.

console.log("it is running");

var most_dbg = {};

var args = JSON.parse(document.currentScript.dataset.params);
languages = args.languages;

// Make Viki load the required languages; keep the references.
var tracks_source = player.subtitleManager.videojs.tech_.textTracks_;
var tracks = most_dbg.tracks = {};
var old_language = player.getCurrentSubtitle();
for (var i = 0; i < languages.length; i++) {
    player.subtitleManager.cleanup();
    player.subtitleManager.setLanguage(languages[i]);
    if (tracks_source.length == 1
	&& tracks_source[0] !== undefined
	&& tracks_source[0].language == languages[i]) {
	tracks[i] = tracks_source[0];
    } else {
	alert('subtitles are unavailable for language ' + languages[i]);
    }
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
