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
        
        // Make a request to DownSub.
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(response) {
            if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                // Display the subtitles.
                chrome.tabs.sendMessage(tab.id, xhr.responseText);
            }
        };
        var subtitleURL = 'http://downsub.com/index.php?title=' + id +
            "&url=http%3A%2F%2Fviki.com%2Fko";  // <--Korean subtitles
            //"&url=http%3A%2F%2Fviki.com%2Fen";  // <-- English subtitles
            /* Use something like
             *   subtitleURL = chrome.runtime.getURL("demo2.srt");
             * if you want to load local files. */
        xhr.open("GET", subtitleURL, true);
        xhr.send();
    });
});
