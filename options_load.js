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
        if (items.customStyle !== undefined) {
            callback(items.customStyle, false);
        } else {
	    callback(options_default, true);
	}
    });
}
