# download-preserve-mod

MV2 browser extension download file with server last-modified time


* ```browser.downloads.download``` download file, webRequest capture response last-modified header, native application modify file datetime

* [native manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests)

* Content script download file  is considered, but it only works for same-origin URLs

* Encountered a bug that browser.notifications.create() don't show notifications on Firefox. install ```mako``` for sway and ```export MOZ_ENABLE_WAYLAND=1``` on bash