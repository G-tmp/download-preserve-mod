# download-preserve-mod

MV2 browser file downloader extension preserve server last-modified time


* ```browser.downloads.download``` download file, webRequest capture response last-modified header, native application modify file datetime

* Content script download file  is considered, but it only works for same-origin URLs

* Native messaging manifest is required, location and fields on [native manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_manifests)

* Encountered a bug that browser.notifications.create() don't show notifications on linux Wayland desktop. install [mako](https://github.com/emersion/mako) for Sway and ```export MOZ_ENABLE_WAYLAND=1``` on bash for Firefox.