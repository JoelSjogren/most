// This file runs directly on the webpage, rather than isolated within the extension.
console.log("it is running");
var most_dbg = {};

/* BEGINNING OF AUTO-PAUSE FUNCTIONALITY */

const SkipLevel = {
    BEGINNER: 0,
    NOVICE: 1,
    N5: 2,
    N4: 3,
    EXPERT: 10
};

const N4_kanji = "夕干丸工不元公切引太心文方止牛犬区内王毛世主仕代以兄写冬去古台広正用田目立合会回同地池多字安好早有死考肉自色寺米光住体作別医図売弟町社私究花言赤走足近声事京使味夜妹姉始店明服歩注物画的知空者英青所使品室屋度建待思急持映春昼洋海界発研秋茶計送重音風草首県星映乗洗借勉員夏家帰料旅特病真紙起通院弱動問堂強悪教族理終習転週野魚鳥黒都船雪進動場朝着答買貸運道開集飯飲寒軽絵短暑意新業楽漢試暗遠働歌銀質親館薬頭曜題験顔";  // by iva - v1.0, 20250215 - MIT license
const N5_kanji = "一二八九力七十人入三口上下千万女子小大山川土五六中日月午今分天木水火友父犬少手円四白目田母古出北半左右石生立外本耳休先名多会安年毎気百行西社村花来言見男足車何林学金長空店東雨国前南後食校時高書魚週森飲道買間新話電聞語読駅";  // by iva - v1.0, 20250215 - MIT license

class KanjiDetector {
    constructor({user_level, user_kanji}) {
	this.user_level = user_level;
	this.user_kanji = user_kanji;
    }
    ordered(x, y, z) { return x <= y && y <= z };
    punctuation(val) { return this.ordered(0x3000, val, 0x303f) || this.ordered(0xff00, val, 0xffef); }
    hiragana(val) { return this.ordered(0x3040, val, 0x309f); }
    katakana(val) { return this.ordered(0x30a0, val, 0x30ff); }
    kanji(val) { return this.ordered(0x4e00, val, 0x9faf); }
    easy(val) { return this.punctuation(val) || this.hiragana(val) || this.katakana(val); }
    japanese(val) { return this.easy(val)  || this.kanji(val); }
    user_learned(val) { return this.user_kanji.includes(val); }
    user_unknown_character(c) {
	const val = c.charCodeAt(0);
	if (this.user_learned(val) || !this.japanese(val)) return false;
	if (this.user_level >= SkipLevel.NOVICE && this.easy(val)) return false;
	if (this.user_level >= SkipLevel.N5 && N5_kanji.includes(c)) return false;
	if (this.user_level >= SkipLevel.N4 && N4_kanji.includes(c)) return false;
	return true;
    }
    red(c) { return `<span style="color: red;">${c}</span>` }
    user_unknown_string(s) {
	let t = [];
	let any = false;
	for (let i = 0; i < s.length; i++) {
	    let c = s[i];
	    if (this.user_unknown_character(c)) {
		c = this.red(c);
		any = true;
	    }
	    t.push(c);
	}
	let highlighted = t.join('')
	return [any, highlighted];
    }
};

class PauseCoordinator {
    constructor({race_time}) {
	this.race_time = race_time;
	this.queue = [];
	this.paused = false;
    }
    submit_action(f) {
	setTimeout(() => {
	    if (this.paused) this.queue.push(f);
	    else f();
	}, this.race_time);
    }
    pause(pause_time) {
	this.paused = true;
	setTimeout(() => {
	    this.queue.forEach((f) => f());
	    this.queue = [];
	    this.paused = false;
	}, pause_time);
    }
}

function wait_until(cond, then) {
    // console.log("waiting");
    if (cond()) then();
    else setTimeout(() => wait_until(cond, then), 100);
}

/* END OF AUTO-PAUSE FUNCTIONALITY */

var {languages, autopause_config} = JSON.parse(document.currentScript.dataset.params);
console.log("args", {languages, autopause_config});
var {autopause, autoresume, autoresume_delay_factor,
     japanese_learner, japanese_highlight, user_level, user_kanji} = args.autopause_options.autopause;
//var detector = new KanjiDetector({user_level: SkipLevel.NOVICE, user_kanji: ""});
//var coordinator = new PauseCoordinator({race_time: 100, pause_time: 3000});
var detector = new KanjiDetector({user_level, user_kanji});
var coordinator = new PauseCoordinator({race_time: 100, pause_time: 3000});

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

//var is_seeking = false;
//player.on("seeking", function() { is_seeking = true; });
player.on("seeked", function() { coordinator.queue = []; );

// Register cue listeners for each language.
for (var i = 0; i < languages.length; i++) {
    // Html entry for subtitles in one language.
    var element = document.createElement("div");
    element.className = "most-subtitles most-" + languages[i];
    document.getElementById("most-overlay").appendChild(element);
    
    // Cue listener.
    if (!(tracks[i] === undefined)) {
        addCueListener(element, languages[i], tracks[i], (first && autopause ? true : false));
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
    
    function addCueListenerOBSOLETE(element, language, track, autopause) {
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
		//cue = cue + `<span style="color: red;">foo</span>`;
		if (language == "ja") {
		    let [any, highlighted] = detector.user_unknown_string(cue);
		    console.log(any, highlighted);
		    cue = highlighted;
		}
            }

	    // Show the new subtitle page.
	    show(cue);
        });
    }
}
