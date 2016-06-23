function with_style(callback) {  // callback(style, is_default);
    chrome.storage.sync.get(null, function(items) {
        if (items.customStyle !== undefined) {
            callback(items.customStyle, false);
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(response) {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    callback(xhr.responseText, true);
                }
            };
            var url = chrome.extension.getURL("options_default.css");
            xhr.open("GET", url, true);
            xhr.send();
        }
    });
}
