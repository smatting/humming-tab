document.addEventListener('DOMContentLoaded', function(){ 
    var app = new Vue({
        el: '#tab-view',
        data: {
            message: 'Hello Vue!',
            tabs: []
        },
        methods: {
            closeTab: function(tabId, event) {
                const that = this;
                chrome.tabs.remove(tabId, function() {
                    console.log('tabs inside closeTab', that.tabs);
                    that.tabs = _.filter(that.tabs, function(tab) {return tab.id !== tabId});
                });
            },
            switchToTab: function(tabid) {
                console.log('switchToTab method', tabid);
                chrome.tabs.get(tabid, function(tab) {
                    if (tab) {
                    //   console.log("found tab", tab);
                        chrome.tabs.highlight({tabs: [tab.index]});
                    } else {
                    console.log("did not find tab", tabid);
                    }
                });
            }
        }
    });

    function timeSinceLastActive(now, tabsLastActive) {
        return function(tab) {
            const t = tabsLastActive[tab.id];
            if (t !== undefined) {
                return now - t;
            } else {
                return 1000000000000;
            }
        };
    };

    function updateTabView() {
        console.log('updateTabView');
        chrome.tabs.query({}, function(tabs) {
            chrome.storage.local.get({tabsLastActive: {}}, function(data) {
                const now = (+ new Date());
                var tabsFiltered = _.filter(tabs, function(tab) {return tab.url != window.location.href;});
                console.log('tabsFiltered', tabsFiltered);
                const tabsSorted = _.sortBy(tabsFiltered, timeSinceLastActive(now, data.tabsLastActive))
                app.tabs = tabsSorted;
            });
        });
        // chrome.storage.local.get({tabs: {}}, function(data) {
        //     console.log('tabs read', data.tabs);
        //     app.message = _.size(data.tabs);
        //     app.tabs = _.values(data.tabs);
        // });
    };

    // function tabOnCreated(tab) {
    //     console.log('tabOnCreated', tab);
    //     chrome.storage.local.get({tabs: {}}, function(data) {
    //         data.tabs[tab.id] = tab;
    //         console.log('after setting', data.tabs);
    //         chrome.storage.local.set({tabs: data.tabs}, function() { updateTabView(); })
    //     })
    // };
    // chrome.tabs.onCreated.addListener(tabOnCreated);

    chrome.runtime.onMessage.addListener(function(message, sender) {
        // console.log('We read you', message);
        updateTabView();
    });

    updateTabView();
}, false);