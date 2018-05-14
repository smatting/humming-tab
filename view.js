document.addEventListener('DOMContentLoaded', function(){ 
    var app = new Vue({
        el: '#tab-view',
        data: {
            message: 'Hello Vue!',
            tabs: []
        }
    });

    function updateTabView() {
        chrome.storage.local.get({tabs: {}}, function(data) {
            console.log('tabs read', data.tabs);
            app.message = _.size(data.tabs);
            app.tabs = _.values(data.tabs);
        });
    };

    function tabOnCreated(tab) {
        chrome.storage.local.get({tabs: {}}, function(data) {
            data.tabs[tab.id] = tab;
            console.log('after setting', data.tabs);
            chrome.storage.local.set({tabs: data.tabs}, function() { updateTabView(); })
        })
    };
    chrome.tabs.onCreated.addListener(tabOnCreated);

    chrome.runtime.onMessage.addListener(function(message, sender) {
        console.log('We read you', message);
    });
}, false);