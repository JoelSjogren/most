// This file runs directly on the webpage, rather than isolated within the extension.

const SkipLevel = {
    BEGINNER: 0,
    NOVICE: 1,
    N5: 2,
    N4: 3,
    EXPERT: 10
};

const N4_kanji = "夕干丸工不元公切引太心文方止牛犬区内王毛世主仕代以兄写冬去古台広正用田目立合会回同地池多字安好早有死考肉自色寺米光住体作別医図売弟町社私究花言赤走足近声事京使味夜妹姉始店明服歩注物画的知空者英青所使品室屋度建待思急持映春昼洋海界発研秋茶計送重音風草首県星映乗洗借勉員夏家帰料旅特病真紙起通院弱動問堂強悪教族理終習転週野魚鳥黒都船雪進動場朝着答買貸運道開集飯飲寒軽絵短暑意新業楽漢試暗遠働歌銀質親館薬頭曜題験顔";  // by iva - v1.0, 20250215 - MIT license
const N5_kanji = "一二八九力七十人入三口上下千万女子小大山川土五六中日月午今分天木水火友父犬少手円四白目田母古出北半左右石生立外本耳休先名多会安年毎気百行西社村花来言見男足車何林学金長空店東雨国前南後食校時高書魚週森飲道買間新話電聞語読駅";  // by iva - v1.0, 20250215 - MIT license

// TODO figure out how to allow reloading this file - not possible since classes etc have already been defined
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
    user_learned(c) { return this.user_kanji.includes(c); }
    user_knows(query_level) {
	let user_level = this.user_level;
	if (user_level === "beginner") user_level = SkipLevel.BEGINNER;
	if (user_level === "novice") user_level = SkipLevel.NOVICE;
	if (user_level === "n5") user_level = SkipLevel.N5;
	if (user_level === "n4") user_level = SkipLevel.N4;
	if (user_level === "expert") user_level = SkipLevel.EXPERT;
	return user_level >= query_level;
    }
    user_unknown_character(c) {
	const val = c.charCodeAt(0);
	if (this.user_learned(c) || !this.japanese(val)) return false;
	if (this.user_knows(SkipLevel.NOVICE) && this.easy(val)) return false;
	if (this.user_knows(SkipLevel.N5) && N5_kanji.includes(c)) return false;
	if (this.user_knows(SkipLevel.N4) && N4_kanji.includes(c)) return false;
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
    constructor(player, {race_time}) {
	this.player = player;
	this.race_time = race_time;
	this.paused = false;
	this.queue = [];
    }
    submit_action(f) {
	setTimeout(() => {
	    if (this.paused) this.queue.push(f);
	    else f();
	}, this.race_time);
    }
    pause(pause_time) {
	if (pause_time == 0) return;
	this.player.player.pause();
	this.paused = true;
	if (pause_time == Infinity) return;
	setTimeout(() => { this.resume(); }, pause_time);
    }
    resume() {
	this.player.player.play()
	this.resume_logic();
    }
    resume_logic() {
	this.paused = false;
	this.queue.forEach((f) => f());
	this.queue = [];
    }
}

class SubtitleDisplayer {
    constructor(language, track, autopause_config, coordinator) {
	this.language = language;
	this.track = track;
	const {autopause, autoresume, autoresume_delay_factor,
	       japanese_learner, japanese_highlight, user_level, user_kanji} = autopause_config;
	this.autopause = autopause && !japanese_learner;
	if (autopause && japanese_learner && language == "ja") {
	    this.kanji_detector = new KanjiDetector({user_level, user_kanji});
	    this.autopause = true;  // this will then be the only displayer which has "autopause = true"
	} else {
	    this.kanji_detector = undefined;
	}
	this.autoresume = autoresume;
	this.autoresume_delay_factor = autoresume_delay_factor;
	this.japanese_highlight = japanese_highlight;
	this.coordinator = coordinator;
	this.pause_time = 0;

	this.element = document.createElement("div");
	this.element.className = "most-subtitles most-" + this.language;
	document.getElementById("most-overlay").appendChild(this.element);
    }
    register_for_events() {
	// necessary in order to actually receive the events. known modes: disabled, hidden, showing
	if (this.track.mode === 'disabled') this.track.mode = 'hidden';
	this.track.addEventListener("cuechange", () => this.handle_cue_change());
    }
    handle_cue_change() {
	// Analyze the incoming cue change event.
	let text = "";
	const cue = this.track.activeCues[0];
	if (cue !== undefined) {
	    text = cue.text;
	    if (this.kanji_detector !== undefined) {
		var [any, highlighted] = this.kanji_detector.user_unknown_string(text);
		if (this.japanese_highlight) text = highlighted;
	    } else {
		var any = this.autopause && (text.length != 0);
	    }
        }
	console.log("cue change", this.language, text);

	// Display the new subtitles, but pause the video first if appropriate.
	coordinator.pause(this.pause_time);
	coordinator.submit_action(() => this.element.innerHTML = text);

	// Prepare for the next incoming event.
	this.pause_time = any ? this.calculate_pause_time(cue) : 0;
	
    }
    calculate_pause_time(cue) {
	const percent = 1/100;
	const factor = this.autoresume_delay_factor * percent;
	const duration = cue.endTime - cue.startTime;
	const s = 1000;  // ms
	console.log("preparing to pause for", this.pause_time, "due to language", this.language);
	return this.autoresume ? factor * duration * s : Infinity;
    }
    static load_required_languages(player, languages, autopause_config, coordinator) {
	const tracks = player.subtitleManager.videojs.tech_.textTracks_;
	const displayers = [];
	const old_language = player.getCurrentSubtitle();
	for (let i = 0; i < languages.length; i++) {
	    player.subtitleManager.cleanup();
	    player.subtitleManager.setLanguage(languages[i]);
	    if (tracks.length == 1 && tracks[0] !== undefined && tracks[0].language == languages[i]) {
		displayers[i] = new SubtitleDisplayer(languages[i], tracks[0], autopause_config, coordinator);
	    } else {
		alert('subtitles are unavailable for language ' + languages[i]);
	    }
	}
	player.subtitleManager.cleanup();
	player.subtitleManager.setLanguage(old_language);

	displayers.forEach((displayer) => displayer.register_for_events());
	return displayers;
    }
}

const {languages, autopause_config} = JSON.parse(document.currentScript.dataset.params);
if (!languages.includes("ja")) autopause_config.japanese_learner = false;
console.log("args", {languages, autopause_config});

const player = document.querySelector('.video-js').player.ima.controller.adUi.vmplayer;
const coordinator = new PauseCoordinator(player, {race_time: 100});
const displayers = SubtitleDisplayer.load_required_languages(player, languages, autopause_config, coordinator);

function reset() {
    coordinator.resume_logic();
    displayers.forEach((displayer) => displayer.pause_time = 0);
}
player.on("seeking", reset);
player.on("seeked", reset);

most_dbg = {coordinator, displayers};
console.log(most_dbg)
