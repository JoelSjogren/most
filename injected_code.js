// This file runs directly on the webpage, rather than isolated within the extension.

console.log("it is running");

var most_dbg = {};

var args = JSON.parse(document.currentScript.dataset.params);
var languages = args.languages;
console.log("args", args);
var autopause = args.autopause_options.autopause;
var autoresume = args.autopause_options.autoresume;
var autoresume_delay = args.autopause_options.autoresume_delay;

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

var first = true;
var blocked = false;
var waiting = [];
var is_seeking = false;

player.on("seeking", function() { is_seeking = true; });
player.on("seeked", function() { is_seeking = true; setTimeout(function(){ is_seeking = false; }, 500); });

// Register cue listeners for each language.
for (var i = 0; i < languages.length; i++) {
    // Html entry for subtitles in one language.
    var element = document.createElement("div");
    element.className = "most-subtitles most-" + languages[i];
    document.getElementById("most-overlay").appendChild(element);
    
    // Cue listener.
    if (!(tracks[i] === undefined)) {
        addCueListener(element, languages[i], tracks[i], (first && autopause ? true : false));
	first = false;
    }
    
    function addCueListener(element, language, track, autopause) {
        console.log("adding listener for: " + language);
	if (autopause) console.log("(^ this first language will control autopause functionality)");
	function simple_show(text) {
	    element.innerHTML = text;
	}
	if (autopause) {
	    var last = "";
	    function show(text) {
		var marks_end = !(last === "") && !is_seeking;
		last = text;
		function release() {
		    blocked = false;
		    simple_show(text);
		    waiting.forEach(function(f) { f(); });
		    waiting.length = 0;
		}
		if (marks_end) {
		    blocked = true;
		    player.player.pause();
		    if (autoresume) {
			setTimeout(function(){
			    player.player.play();
			    release();
			}, autoresume_delay * 1000);
		    } else {
			function onplay() {
			    release();
			    player.off("play", onplay);
			}
			player.on("play", onplay);
		    }
		} else {
		    simple_show(text);
		}
	    }
	} else {
	    function show(text) {
		if (blocked) { waiting.push(function() { simple_show(text); }); }
		else simple_show(text);
	    }
	}
        track.addEventListener('cuechange', function() {
            console.log("> cue change (" + language + ") < ... autopause? " + autopause);
            
            // Get the new subtitle page, or else an empty string.
	    cue = "";
            if (track.activeCues[0]) {
                cue = track.activeCues[0].text;
            }

	    // Show the new subtitle page.
	    show(cue);
        });
    }
}

function executeAutopause() {
    
}
