
// Right-click menu
browser.menus.create({
  id: "download-with-timestamp",
  title: "Download (preserve mod time)",
  contexts: ["image", "video", "audio", "link"]
});

const downloadState = new Map(); 

// Right-click event
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "download-with-timestamp") 
    return;

  const url = info.srcUrl || info.linkUrl;
  if (!url) 
    return;

  // Capture url header "last-modified"
  function readHeaders(details){
    if (details.url != url)       
      return

    let lastMod = details.responseHeaders
      ?.find(h => h.name.toLowerCase() === "last-modified")
      ?.value;
    console.log(details.statusCode, details.url, lastMod)
    
    for (const[id, state] of downloadState){
      if (state.url === details.url) {
        console.log(id, details.statusCode, details.url, lastMod)
        state.lastModified = lastMod;
        trySendToNative(id);
      }
    }

    browser.webRequest.onHeadersReceived.removeListener(readHeaders);
  }
  browser.webRequest.onHeadersReceived.addListener(
    readHeaders,
    { urls: [url] },
    ["responseHeaders"]
  );


  // download started
  function downloadCreated(item){
    downloadState.set(item.id, {
      url: item.url,
      filepath: item.filename,
      complete: false,
      lastModified: null
    });
    browser.downloads.onCreated.removeListener(downloadCreated);
  }
  browser.downloads.onCreated.addListener(downloadCreated);


  // listen file download completed
  function downloadChanged(delta){
    if (delta.id !== downloadId) 
      return

    if (delta.error?.current) {
      console.error(delta.error.current);
    } else if (delta.state?.current === "complete") {
      console.log(delta.id, "complete");
      const state = downloadState.get(delta.id);
      state.complete = true;
      trySendToNative(delta.id);
    }

    browser.downloads.onChanged.removeListener(downloadChanged);
  }
  browser.downloads.onChanged.addListener(downloadChanged);


  // Download
  let downloadId;
  browser.downloads.download({
    url: url,
    saveAs: true,
    conflictAction: "overwrite",
    headers: [
      {
        name: "Referer",
        value: url
      }
    ]
  }).then(id => {
    downloadId = id;
  })
  .catch(error => {
    console.error(error);
    browser.webRequest.onHeadersReceived.removeListener(readHeaders);
    browser.downloads.onChanged.removeListener(downloadChanged);
    browser.downloads.onCreated.removeListener(downloadCreated);
  });


  // send data to native app
  function trySendToNative(id){
    const state = downloadState.get(id);

    if (!state || !state.complete || !state.lastModified) 
      return
    
    browser.runtime.sendNativeMessage(
      "chtime",
      {
        downloadId: id,
        path: state.filepath,
        mtime: new Date(state.lastModified).getTime() / 1000
      }
    ).then((response)=>{
      console.log("Native app resp:", response);
      downloadState.delete(id);
      if (!response.ok) {
        browser.notifications.create({
          type: "basic",
          iconUrl: browser.extension.getURL("mikoto.jpg"),
          title: `${state.filepath.split("/").pop()}`,
          message: `${response.error}`
        });
      }
    }).catch((error) => {
      console.error(error);
      browser.notifications.create({
        type: "basic",
        iconUrl: browser.extension.getURL("mikoto.jpg"),
        title: `${state.filepath.split("/").pop()}`,
        message: `${error}`,
      });
    });
  }

});