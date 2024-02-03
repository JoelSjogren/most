var tabs = [];

// When the icon next to the address bar is clicked, subtitles start playing.
chrome.browserAction.onClicked.addListener(function(tab) {
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

// Load options defined by user: css rules and subtitle languages.
function with_style_and_inferred_languages(callback) {
    with_style(function(style) {
        // Parse the stored style string.
        var styleEl = document.createElement("style");
        styleEl.innerHTML = style;
        document.head.appendChild(styleEl);
        var rules = styleEl.sheet.rules;
        
        // Infer the subtitle languages from the css rules.
        var languages = [];
        for (var i = 0; i < rules.length; i++) {
            var re = /\.most-([A-z][A-z])\W/g;  // Match things like ".most-en,".
            var m;
            while (m = re.exec(rules[i].selectorText + " ")) {
                if (languages.indexOf(m[1]) == -1) {
                    languages.push(m[1]);  // Store things like "en".
                }
            }
        }
        
        callback(style, languages);
    });
}
