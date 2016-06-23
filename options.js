function handle_input(e) {
    var styleEl = document.getElementById('custom-style');
    var inputEl = document.getElementById('config-area');
    var saveEl = document.getElementById('save');
    
    styleEl.innerHTML = inputEl.value;
    saveEl.disabled = false;
    
    repopulate_subtitles();
}

function repopulate_subtitles() {
    $(".most-subtitles").remove();
    
    var samples = {
        en: "<i>He doesn't have any friends in Korea so he probably doesn't even have anyone to eat with.</i>",
        de: "<i> Er hat keine Freunde in Korea, also wird er wahrscheinlich niemanden haben, mit dem er was essen kann.</i>"
    };
    
    var styleEl = document.getElementById('custom-style');
    var languages = get_used_languages();
    for (var i = 0; i < languages.length; i++) {
        var div = document.createElement("div");
        div.className = "most-subtitles most-" + languages[i];
        div.innerHTML = samples[languages[i]] ||
            "[No sample available for language " + languages[i] + ".]" +
            "<br>[Some more text.]";
        document.getElementById("common-container").appendChild(div);
    }
}

function get_used_languages() {
    result = [];
    var styleEl = document.getElementById('custom-style');
    for (var i = 0; i < styleEl.sheet.rules.length; i++) {
        var re = /\.most-([A-z][A-z])\W/g;
        var m;
        while (m = re.exec(styleEl.sheet.rules[i].selectorText + " ")) {
            if (result.indexOf(m[1]) == -1) {
                result.push(m[1]);
            }
        }
    }
    return result;
}

function restore_options() {
    var styleEl = document.getElementById('custom-style');
    var inputEl = document.getElementById('config-area');
    
    chrome.storage.sync.get(null, function(items) {
        if (items.customStyle !== undefined) {
            styleEl.innerHTML = items.customStyle;
        }
        inputEl.innerHTML = styleEl.innerHTML;
    });
    
    repopulate_subtitles();
}

function save_options() {
    var styleEl = document.getElementById('custom-style')
  
    chrome.storage.sync.set({customStyle: styleEl.innerHTML}, function() {
        var saveEl = document.getElementById('save');
        saveEl.disabled = true;
    });
}

function remove_storage() {
    chrome.storage.sync.remove('customStyle');
}

$("#config-area").on('input', handle_input);
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('remove').addEventListener('click', remove_storage);
