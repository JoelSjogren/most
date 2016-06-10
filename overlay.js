/*  MoST Subtitle Player :: Implementation Overview

Code is inserted into the target web page.
    * The current video can be determined
    * Syncing is possible
    * Communication with the inserted code is a bit complicated

Subtitles are downloaded via DownSub (but we could have used the api).

A transparent overlay is created using the following lines:
    var overlay = $("<div></div>");
    $("body").append(overlay);

*/

// Tip: Use the 'debugger' command to insert a breakpoint!

$(document).ready(function () {

    // The decoded srt file is organized into pages.
    var pages = [];
    var current;
    
    // Text is continuously written as html to a single element.
    var overlay;
    var timer;

    // Ugly hack independent of this scope (only its string will be injected).
    function specialcode () {
        //console.log("log message 595");
        //console.log(player.getCurrentTime());
        //player.playVideo();
      
        function sync() {
            // TODO export player.getCurrentTime() - new Date().getTime();
            window.setTimeout(sync, 100);
        };
      
        window.setTimeout(sync, 100);
    }

    function init(request, sender, callback) {
        // Inject the ugly hack into the web page.
        var script = document.createElement('script');
        script.appendChild(document.createTextNode(
            '('+ specialcode +')();'));
        (document.body || document.head || document.documentElement)
            .appendChild(script);

        addOverlay();
        downloadSubtitles();
        startPlayback();
    }

    chrome.extension.onMessage.addListener(init);

    function addOverlay() {
        if (!overlay) {
            overlay = $("<div></div>");
            $("body").append(overlay);
        }
        
        // Find the positioning of the video player, or use (bad) defaults.
        var video = $("#flashObject")[0];
        var videoRect = video ? video.getBoundingClientRect()
                              : {'width': 600, 'left': 20, 'bottom': 20};
        
        // Configure the looks and position.
        overlay.css({
            top: "0px", left: "0px",
            position: "fixed",
            width: videoRect.width + "px",
            height: "200px",
            left: videoRect.left,
            top: videoRect.bottom,
            background: "#b50",
            opacity: "0.8",
            zIndex: "99999999",
            pointerEvents: "none"
        });
    }


    function startPlayback() {
        var start = new Date().getTime();
        var local = 0;
        var period = 50;

        // To be run many times per second.
        function step() {
            local += period;

            // Reschedule.
            if (timer) {  // Compensate for sleep inaccuracy. TODO stabilize?
                timer = window.setTimeout(step,
                    period + start + local - new Date().getTime());
            }

            // Write current subtitle page to screen.
            for (var i = 0; i < pages.length; i++) {  // TODO binary search?
                var page = pages[i];
                if (page['loc0'] <= local && local <= page['loc1']
                        && current != i) {
                    show(page['s'], page['loc1']-page['loc0']-period, i);
                    //debugger;
                }
            }
        }

        timer = window.setTimeout(step, period);
    }

    // Convert an srt time string to integer.
    function strToMs(loc) {
        var h, m, s, ms;
        [h, m, s, ms] = loc.replace(',', ':').split(':');
        [h, m, s, ms] = [parseInt(h), parseInt(m), parseInt(s), parseInt(ms)];
        return ((h*60 + m)*60 + s)*1000 + ms;
    }


    // Turn the srt into computation-friendly form: pages.
    function parseSubtitles(srt) {
        pages = [];

        //debugger;
        var srt2 = srt.replace(/\r\n|\r|\n/g, '\n')  // Normalize newlines.
                      .trim(srt)
                      .split('\n\n');

        // Parse each page.
        for (var i = 0; i < srt2.length; i++) {
            var a, b, c, d, e, loc0, loc1;
            a = srt2[i];
            [b, c] = [a.slice(0, a.indexOf("\n")), a.slice(a.indexOf("\n")+1)];
            [d, e] = [c.slice(0, c.indexOf("\n")), c.slice(c.indexOf("\n")+1)];
            [loc0, loc1] = d.split(" --> ");
            pages.push({'loc0': strToMs(loc0), 'loc1': strToMs(loc1), 's': e});
        }
        
        show("Loaded " + (i+1) + " pages.", 2000, "info");
    }

    // Show text, typically a subtitle page.
    function show(text, duration, uid) {
        // Write the text to screen.
        overlay.append("<div class='uid_" + uid + "'>" + text + "</div>");
        
        // Don't rewrite it a lot.
        current = uid;
        
        // Remember to remove it after a while.
        window.setTimeout(function () { hide(uid); }, duration);
    }

    // Hide text. Inverse of 'show'.
    function hide(uid) {
        $(".uid_" + uid).remove();
    }

    function downloadSubtitles() {
        // Open the local demo file for now.
        // TODO: Download it from DownSub.
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", chrome.runtime.getURL("demo2.srt"), true);
        xhttp.onreadystatechange = function ()
        {
            if(xhttp.readyState == XMLHttpRequest.DONE && xhttp.status == 200)
            {
                //... The content has been read in xhttp.responseText
                //debugger;
                parseSubtitles(xhttp.responseText);
            }
        };
        xhttp.send();
    }

});











