// This file is used by both service_worker.js and options.js

let options_default = (
`.most-subtitles {
    position: absolute;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    font-size: 26px;
    text-align: center;
    line-height: 2;
    color: white;
    text-shadow: 1px 1px black;
}
.most-en {
    top: 0%;
}
   
.most-ko {
    bottom: 0%;
}`);

export function with_style(callback) {  // callback(style, is_default);
    chrome.storage.sync.get(null, function(items) {
	// things console.logged from here will appear in the service worker window
	console.log(items);
	var style = (items.customStyle !== undefined) ? items.customStyle : options_default;
	var is_default = (items.customStyle !== undefined) ? false : true;
	//alert("%" +items.autopause);
	//alert("%" +items.autoresume);
	//alert("%" +items.autoresume_delay);
	var autopause = (items.autopause !== undefined) ? items.autopause : false;
	var autoresume = (items.autoresume !== undefined) ? items.autoresume : true;
	var autoresume_delay_factor = (items.autoresume_delay_factor !== undefined) ? items.autoresume_delay_factor : 100;
	var japanese_learner = (items.japanese_learner !== undefined) ? items.japanese_learner : false;
	if (items.japanese_highlight !== undefined) {
	    console.log("with highlight", items.japanese_highlight);
	} else {
	    console.log("no saved highlight setting");
	}
	var japanese_highlight = (items.japanese_highlight !== undefined) ? items.japanese_highlight : true;
	var user_level = (items.user_level !== undefined) ? items.user_level : "novice";
	var user_kanji = (items.user_kanji !== undefined) ? items.user_kanji : "";
	const autopause_config = {autopause, autoresume, autoresume_delay_factor, japanese_learner, japanese_highlight,
				  user_level, user_kanji};
	callback(style, is_default, autopause_config);
    });
}
