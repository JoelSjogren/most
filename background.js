// When the icon next to the address bar is clicked, the current url gets
// sent to the overlay. See 'init' in 'overlay.js' for the message listener.
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, tab.url);
    });
});
