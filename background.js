
// Right-click menu
browser.contextMenus.create({
  id: "download-with-timestamp",
  title: "Download (preserve mod time)",
  contexts: ["image", "video", "audio"]
});


let lastMod;
// Right-click event
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "download-with-timestamp") 
    return;

  const url = info.srcUrl;
  if (!url) 
    return;

  // Capture url header "last-modified"
  browser.webRequest.onHeadersReceived.addListener(
    function onHeaders(details){
      console.log(details.statusCode, details.url)
      if (details.url != url) 
        return

      lastMod = details.responseHeaders
        ?.find(h => h.name.toLowerCase() === "last-modified")
        ?.value;
      console.log("last mod:", lastMod);

      browser.webRequest.onHeadersReceived.removeListener(onHeaders);
    },
    { urls: [url] },
    ["responseHeaders"]
  );

  // Download 
  const downloadId = await browser.downloads.download({
    url: url,
    saveAs: true,
    conflictAction: "overwrite",
    headers: [
      {
        name: "Referer",
        value: info.srcUrl
      }
    ]
  });

  // listen file downloading and change file modified time
  browser.downloads.onChanged.addListener(
    function listener(delta){
      if (delta.id !== downloadId) 
        return

      if (delta.error?.current) {
        console.error(delta.error.current);
      } else if (delta.state?.current === "complete") {
        browser.downloads.search({ id: delta.id }).then(results => {
          if (!results.length) 
            return;
              
          // Native messaging
          if (lastMod) {
            browser.runtime.sendNativeMessage(
              "chtime",
              {
                path: results[0].filename,
                mtime: new Date(lastMod).getTime() / 1000
              }
            ).then((response)=>{
              if (!response.ok) {
                console.error(`Native modify failed: ${response.error}`);
              }
            }, (error) => {
              console.error(error);
            });
           }
        });
      }

      browser.downloads.onChanged.removeListener(listener);
  });

});