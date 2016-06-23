function handle_input(e) {
    var styleEl = document.getElementById('custom-style');
    var inputEl = document.getElementById('config-area');
    var saveEl = document.getElementById('save');
    
    styleEl.innerHTML = inputEl.value;
    saveEl.disabled = false;
}

$("#config-area").on('input', handle_input);

function restore_options() {
    var styleEl = document.getElementById('custom-style');
    var inputEl = document.getElementById('config-area');
    
    chrome.storage.sync.get(null, function(items) {
        if (items.customStyle !== undefined) {
            styleEl.innerHTML = items.customStyle;
        }
        inputEl.innerHTML = styleEl.innerHTML;
    });
}

function save_options() {
    var styleEl = document.getElementById('custom-style')
  
    chrome.storage.sync.set({customStyle: styleEl.innerHTML}, function() {
        var saveEl = document.getElementById('save');
        saveEl.disabled = true;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);


