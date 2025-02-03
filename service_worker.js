import { with_style } from './options_load.js';

var tabs = [];

// When the icon next to the address bar is clicked, subtitles start playing.
chrome.action.onClicked.addListener(function(tab) {
    tabs.push(tab);
    launch_overlay(tab, true);
});

function launch_overlay(tab, interactive) {
    with_style_and_inferred_languages(function(style, languages, autopause_options) {
        chrome.tabs.sendMessage(tab.id, {
            style: style,
            languages: languages,
	    interactive: interactive,
	    autopause_options: autopause_options,
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'options update') {
	console.log('will try to update');
	tabs.forEach(tab => launch_overlay(tab, false));
    }
    return true;
});

// Load options defined by user: css rules and active subtitle languages.
function with_style_and_inferred_languages(callback) {
    with_style(function(style, is_default, autopause, autoresume, autoresume_delay) {
	// Infer the subtitle languages from the css rules.
	// (This used to be done more properly but regex is sufficient really.)

	var languages = [];
	var re = /\.most-([A-z]*)/g;  // Match things like ".most-en".
	var m;
	while (m = re.exec(style)) {
	    var lang = m[1];
	    if (lang == 'subtitles') continue; // False positive!
            if (languages.indexOf(lang) == -1) {
                languages.push(lang);  // Store things like "en".
            }
        }

	const autopause_options = {};
	autopause_options.autopause = autopause;
	autopause_options.autoresume = autoresume;
	autopause_options.autoresume_delay = autoresume_delay;
	
        callback(style, languages, autopause_options);
    });
}
