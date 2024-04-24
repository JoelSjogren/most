import { with_style } from './options_load.js';

var tabs = [];

// When the icon next to the address bar is clicked, subtitles start playing.
chrome.action.onClicked.addListener(function(tab) {
    tabs.push(tab);
    launch_overlay(tab, true);
});

function launch_overlay(tab, interactive) {
    with_style_and_inferred_languages(function(style, languages) {
        chrome.tabs.sendMessage(tab.id, {
            style: style,
            languages: languages,
	    interactive: interactive
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'options update') {
	console.log('will try to update');
	tabs.forEach(tab => launch_overlay(tab, false));
    }
});

// Load options defined by user: css rules and active subtitle languages.
function with_style_and_inferred_languages(callback) {
    with_style(function(style) {
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
	
        callback(style, languages);
    });
}
