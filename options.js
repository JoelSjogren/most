function handle_input(e) {
    $("#custom-style")[0].innerHTML = $("#config-area")[0].value;
    $("#save")[0].disabled = false;
    
    repopulate_subtitles();
}

function repopulate_subtitles() {
    $(".most-subtitles").remove();
    
    var samples = {
        en: "<i>He doesn't have any friends in Korea so he probably doesn't even have anyone to eat with.</i>",
        de: "<i> Er hat keine Freunde in Korea, also wird er wahrscheinlich niemanden haben, mit dem er was essen kann.</i>"
    };  // TODO: add more sample languages
    
    var languages = get_used_languages();
    for (var i = 0; i < languages.length; i++) {
        var div = document.createElement("div");
        div.className = "most-subtitles most-" + languages[i];
        div.innerHTML = samples[languages[i]] ||
            "[No sample available for language " + languages[i] + ".]" +
            "<br>[Some more text.]";
        $("#common-container")[0].appendChild(div);
    }
}

function get_used_languages() {
    var result = [];
    var rules = $("#custom-style")[0].sheet.rules;
    for (var i = 0; i < rules.length; i++) {
        var re = /\.most-([A-z][A-z])\W/g;
        var m;
        while (m = re.exec(rules[i].selectorText + " ")) {
            if (result.indexOf(m[1]) == -1) {
                result.push(m[1]);
            }
        }
    }
    return result;
}

function restore_options() {
    chrome.storage.sync.get(null, function(items) {
        if (items.customStyle === undefined) {
            $("#remove")[0].disabled = true;
        } else {
            $("#custom-style")[0].innerHTML = items.customStyle;
        }
        
        $("#config-area")[0].innerHTML = $("#custom-style")[0].innerHTML;
        
        repopulate_subtitles();
    });
}

function save_options() {
    var customStyle = $("#custom-style")[0].innerHTML;
    
    chrome.storage.sync.set({customStyle: customStyle}, function() {
        $("#save")[0].disabled = true;
        $("#remove")[0].disabled = false;
    });
}

function remove_storage() {
    chrome.storage.sync.remove('customStyle');
    $("#remove")[0].disabled = true;
}

$("#config-area").on('input', handle_input);
document.addEventListener('DOMContentLoaded', restore_options);
$("#save")[0].addEventListener('click', save_options);
$("#remove")[0].addEventListener('click', remove_storage);
