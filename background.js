
function openTab() {
  chrome.tabs.create({url: "tabs.html", pinned: true}, function(tab) {
    chrome.storage.local.set({tabsTabId: tab.id});
  });
}

function openSearch() {
  chrome.storage.local.get({tabsTabId: null}, function(data) {
    if (data.tabsTabId) {
      // chrome.tabs.highlight({tabs: 1});
      chrome.tabs.get(data.tabsTabId, function(tab) {
        if (tab) {
          // console.log("found tab", tab);
          chrome.tabs.highlight({tabs: [tab.index]});

          // console.log('houston you read me?');
          chrome.runtime.sendMessage(null, {"bottle": "send nudes"});

        } else {
          openTab();
        }
        // tab.windowId
        // tab.index
      });
    } else {
      openTab();
    }
    // console.log('stored tab id', data);
  });
  // const extensionId = chrome.i18n.getMessage("@@extension_id");
  // const urlPattern = "chrome-extension://" + extensionId + "/tabs.html";
  // const urlPattern = "*://*/tabs.html";
  // const urlPattern = "*://*/*";
  // chrome.tabs.query({}, function (tabs) {
  //   console.log('tabs', tabs);
  // });


  // chrome-extension://kdaoofjgkmolaccnhjeckkghlgknggif/tabs.html
  // console.log('id', id);
  
  // chrome.tabs.create({url: "tabs.html"});
  // chrome.tabs.highlight({tabs: 1});
}

function updateTabView() {

};

chrome.browserAction.onClicked.addListener(openSearch);

function onTabActivated(activeInfo) {
  chrome.storage.local.get({tabsLastActive: {}}, function(data) {
    console.log('tabsLastActive', data.tabsLastActive);
    data.tabsLastActive[activeInfo.tabId] = (+ new Date());
    chrome.storage.local.set({tabsLastActive: data.tabsLastActive});
  });
}

chrome.tabs.onActivated.addListener(onTabActivated);

