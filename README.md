MoST - More Subtitles
=====================

Unofficial chrome extension for showing more subtitles at viki.com.

The code is largely inspired by chrome-subtitles and subber, but more minimal and targeted toward use at viki.com. It is commented and open-source, too. More most-like.

Install this under Tools -> Extensions (Enable developer mode) and then add this directory as an unpacked extension.

In early versions, only Korean was supported, but it is now possible to view as many languages as you want! In the options page, simply add more blocks, for example `.most-de { bottom: -100px; height: 100px; }` for German subtitles just below the player.

Visit https://github.com/JoelSjogren/most to fork, contribute, report bugs and request features!

# pinyin branch

Currently Pinyin is available in the form of `.most-zh { ... }`. It is hardcoded to replace the Chinese characters. If you want Chinese characters at the same time the only way as of now is to also choose Chinese in Viki's usual menu.

This branch uses a browserify-bundled version of https://pinyin.js.org/en-US/ which is available under the MIT license. The bundle is 7 MB large. There are no plans to merge it into the master branch at the moment. So no plans to publish it in the Chrome Web Store either. To install it locally, go to `Code -> Download ZIP` and double-check that the ZIP is called `most-pinyin.zip` because otherwise you got the wrong version. Then extract it and `Load unpacked` under `Manage Extensions` in Chrome.
