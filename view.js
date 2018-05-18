document.addEventListener('DOMContentLoaded', function(){ 
    var app = new Vue({
        el: '#tab-view',
        data: {
            message: 'Hello Vue!',
            tabs: [],
            keyboardSelectionIndex: 0
        },
        methods: {
            moveKeyboardSelection: function(delta) {
                const i = this.keyboardSelectionIndex;
                const n = _.size(this.tabs);
                const iNext = Math.min((Math.max(i + delta, 0)), n-1);
                this.keyboardSelectionIndex = iNext;
            },
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
            },
            switchToSelectedTab: function() {
                const i = this.keyboardSelectionIndex;
                const n = _.size(this.tabs);
                if ((0 < i) && (i < n)) {
                    this.switchToTab(this.tabs[i].id);
                }
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
        app.keyboardSelectionIndex = 0;

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

    window.addEventListener("keydown", function(e) {
        console.log('keydown', e.keyCode);
        if (e.keyCode == 38) {
            e.preventDefault();
            e.stopPropagation();
            app.moveKeyboardSelection(-1);
        }
        if (e.keyCode == 40) {
            e.preventDefault();
            e.stopPropagation();
            app.moveKeyboardSelection(1);
        }
        if (e.keyCode == 13) {
            app.switchToSelectedTab();
        }
    });


    updateTabView();
}, false);