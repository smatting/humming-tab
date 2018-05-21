
function makeTab() {
  chrome.tabs.create({url: "tabs.html", pinned: true});
}

function openSearch() {

  chrome.tabs.query({highlighted: true, currentWindow: true}, function(activeTabs) {
    chrome.tabs.query({url:"chrome-extension://*/tabs.html", currentWindow: true}, function(tabs) {
    if (tabs.length > 0) {
      const hummingTab = tabs[0];
      if ((activeTabs.length > 0) && (activeTabs[0].id == hummingTab.id)) {
        chrome.runtime.sendMessage(null, {"type": "REFRESH_TAB_VIEW"});
      } else {
        chrome.tabs.highlight({tabs: [hummingTab.index], windowId: hummingTab.windowId}, function() {
          chrome.runtime.sendMessage(null, {"type": "ACTIVATE_TAB_VIEW"});
        });
      }
    } else {
      makeTab();
    }
    })   
  });


}

function updateTabView() {

};

chrome.browserAction.onClicked.addListener(openSearch);

function onTabActivated(activeInfo) {
  chrome.storage.local.get({tabsLastActive: {}}, function(data) {
    // console.log('tabsLastActive', data.tabsLastActive);
    data.tabsLastActive[activeInfo.tabId] = (+ new Date());
    chrome.storage.local.set({tabsLastActive: data.tabsLastActive});
  });
}

chrome.tabs.onActivated.addListener(onTabActivated);

