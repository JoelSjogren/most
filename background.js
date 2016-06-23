// TODO: restrict content script matches

// When the icon next to the address bar is clicked, subtitles start playing.
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        // Extract the video id based on the current url.
        var known = ["viki.com/videos/", "subber.viki.com/translations/",
            "subber.viki.com/subtitlers/"];
        var id;
        for (var i = 0; i < known.length; i++) {
            if (tab.url.indexOf(known[i]) != -1) {
                id = tab.url.split(known[i])[1];
            }
        }
        id = id.split("?")[0];
        
        // Download all subtitles mentioned in the user-defined css.
        var subtitles = {};
        with_style_and_inferred_languages(function(style, languages) {
            wait = countdown(languages.length);
            for (var i = 0; i < languages.length; i++) {
                request(subtitles, id, languages[i], wait, function() {
                    // Finally, display the subtitles.
                    chrome.tabs.sendMessage(tab.id, {
                        style: style,
                        languages: languages,
                        subtitles: subtitles
                    });
                });
            }
        });
    });
});

// Make a request to DownSub and store the result in 'subtitles'.
// Then either wait for other requests to finish or call the callback.
function request(subtitles, videoId, language, wait, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(response) {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status == 200) {
                console.log("Obtained subtitles for " + language);
                subtitles[language] = xhr.responseText;
            } else {
                console.log("Failed to obtain subtitles for " + language);
            }
            if (!wait()) {
                callback();
            } else {
                console.log("Waiting...");
            }
        }
    };
    var subtitleURL = 'http://downsub.com/index.php?title=' + videoId +
        "&url=http%3A%2F%2Fviki.com%2F" + language;
    xhr.open("GET", subtitleURL, true);
    xhr.send();
}

// A simple counter: n-1, n-2, n-3, ...
function countdown(n) {
    return function () { return n -= 1; };
}

// Load options defined by user: css rules and subtitle languages.
function with_style_and_inferred_languages(callback) {
    chrome.storage.sync.get(null, function(items) {
        // Parse the stored style string. TODO: Handle undefined.
        var styleEl = document.createElement("style");
        styleEl.innerHTML = items.customStyle;
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
        
        callback(items.customStyle, languages);
    });
}
