// When the icon next to the address bar is clicked, subtitles start playing.
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        with_style_and_inferred_languages(function(style, languages) {
            chrome.tabs.sendMessage(tab.id, {
                style: style,
                languages: languages
            });
        });
    });
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
