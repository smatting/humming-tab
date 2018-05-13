
function openTab() {
  chrome.tabs.create({url: "tabs.html"}, function(tab) {
    chrome.storage.local.set({tabsTabId: tab.id});
  });
}

function openSearch() {
  chrome.storage.local.get({tabsTabId: null}, function(data) {
    if (data.tabsTabId) {
      // chrome.tabs.highlight({tabs: 1});
      chrome.tabs.get(data.tabsTabId, function(tab) {
        if (tab) {
          console.log("found tab", tab);
          chrome.tabs.highlight({tabs: [tab.index]});
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

// function updateIcon() {
//   chrome.browserAction.setIcon({path:"icon" + current + ".png"});
//   current++;

//   if (current > max)
//     current = min;
// }

chrome.browserAction.onClicked.addListener(openSearch);
