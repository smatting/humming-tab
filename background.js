
function openSearch() {
  chrome.tabs.create({url: "tabs.html"});
}

// function updateIcon() {
//   chrome.browserAction.setIcon({path:"icon" + current + ".png"});
//   current++;

//   if (current > max)
//     current = min;
// }

chrome.browserAction.onClicked.addListener(openSearch);
