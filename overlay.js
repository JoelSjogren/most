/*  MoST Subtitle Player :: Implementation Overview

Code is inserted into the target web page.
    * The current video can be determined
    * Syncing is possible
    * Communication with the inserted code is a bit complicated

Subtitles are downloaded via DownSub (but we could have used the api).

A transparent overlay is created using as a div using zepto; see addOverlay.

*/

// Tip: Use the 'debugger' command to insert a breakpoint!

$(document).ready(function () {

    // The decoded srt file is organized into pages.
    var pages = [];
    var current;
    
    // Text is continuously written as html to a single element.
    var overlay;
    var timer;
    
    // The unix time minus local playback time (in milliseconds, as always).
    var sync;

    // Ugly hack independent of this scope (only its string will be injected).
    function specialCode () {
        $("body").append("<div id='most_sync'></div>");
      
        function syncForever() {
            var local = Math.round(player.getCurrentTime() * 1000);
            var syncVal = new Date().getTime() - local;
            document.getElementById("most_sync").innerHTML = syncVal;
            window.setTimeout(syncForever, 100);
        };
      
        syncForever();
    }

    function init(request, sender, callback) {
        // Inject the ugly hack into the web page.
        var script = document.createElement('script');
        script.appendChild(document.createTextNode(
            '('+ specialCode +')();'));
        (document.body || document.head || document.documentElement)
            .appendChild(script);

        addOverlay();
        downloadSubtitles();
        sync = new Date().getTime();  // TODO get this from the video player.
        sync -= 17000;  // temporary; remove this
        startPlayback();
    }

    chrome.extension.onMessage.addListener(init);

    function addOverlay() {
        if (!overlay) {
            overlay = $("<div id='most_overlay'></div>");
            $("body").append(overlay);
        }
        
        // Find the positioning of the video player, or use (bad) defaults.
        var video = $("#flashObject")[0];
        var videoRect = video ? video.getBoundingClientRect()
                              : {'width': 600, 'left': 20, 'bottom': 20};
        
        // Configure the looks and position.
        shadow = "0 0 black";  // transparent text shadow:
        for (var i=-1; i<=1; i++) for (var j=-1; j<=1; j++)
            shadow = i + "px " + j + "px rgba(0, 0, 0, 1), " + shadow;
        for (var i=-2; i<=2; i++) for (var j=-2; j<=2; j++)
            shadow = i + "px " + j + "px rgba(0, 0, 0, 0.4), " + shadow;
        for (var i=-3; i<=3; i++) for (var j=-3; j<=3; j++)
            shadow = i + "px " + j + "px rgba(0, 0, 0, 0.1), " + shadow;
            
        overlay.css({
            position: "fixed",
            width: videoRect.width + "px",
            height: "200px",
            left: videoRect.left,
            top: videoRect.bottom,
            background: "#0000",
            zIndex: "99999999",
            pointerEvents: "none",
            fontSize: "24px",
            textAlign: "center",
            color: "#fff",
            textShadow: shadow
        });
    }


    function startPlayback() {
        timer = true;
        
        // To be run many times per second.
        function update() {
            var period = 50;
            //var local = new Date().getTime() - sync;  // = 0 at the beginning.
            var syncEl = document.getElementById("most_sync");
            var local = new Date().getTime() - parseInt(syncEl.innerHTML);
            
            // Write current subtitle page to screen.
            for (var i = 0; i < pages.length; i++) {  // TODO binary search?
                var page = pages[i];
                // the " - period" here is just for fine tuning
                if (page['loc0'] - period <= local && local <= page['loc1']
                        && current != i) {
                    show(page['s'], page['loc1']-page['loc0'], i);
                    //debugger;
                }
            }
            
            // Reschedule.
            if (timer) {  // Compensate for sleep inaccuracy. TODO stabilize?
                timer = window.setTimeout(update, period);
            }
        };
        
        update();
    }
    
    function stopPlayback() {
        timer = false;
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
        // Remove old text. (This is an exceptional case.)
        if (current !== undefined) {
            hide(current);
        }
    
        // Write the text to screen.
        textEl = $("<div class='uid_" + uid + "'>" + text + "</div>");
        overlay.append(textEl);
        
        // Don't rewrite it a lot.
        current = uid;
        
        // Remember to remove it after a while.
        window.setTimeout(function () {
            if (current === uid) {
                hide(uid);
                current = undefined;
            }
        }, duration);
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











