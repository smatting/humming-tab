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
                    // console.log('tabs inside closeTab', that.tabs);
                    that.tabs = _.filter(that.tabs, function(tab) {return tab.id !== tabId});
                });
            },
            switchToTab: function(tabid) {
                console.log('switchToTab', tabid);
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
                if ((0 <= i) && (i < n)) {
                    this.switchToTab(this.tabs[i].id);
                }
            },
            onSearchInput: function(value) {
                // console.log('onSearchInput', value);
                this.resortTabs(null, value);
            },
            resortTabs: function(tabs, query) {
                if (_.isNil(tabs)) {
                    tabs = this.tabs;
                }
                if ((!_.isNil(query)) && (!_.isEmpty(query))) {
                    tabs = _.sortBy(tabs, function(tab) {
                        if (_.isNil(tab.title) || _.isEmpty(tab.title)) {
                            return 1;
                        }
                        // console.log('tab', tab);
                        const title = tab.title.toLowerCase();
                        // console.log('title', title);
                        if (title.includes(query)) {
                            return 0;
                        } else {
                            return 1;
                        }
                    })
                    app.tabs = tabs;
                } else {
                    chrome.storage.local.get({tabsLastActive: {}}, function(data) {
                        var tabsFiltered = _.filter(tabs, function(tab) {return tab.url != window.location.href;});
                        // console.log('tabsFiltered', tabsFiltered);
                        const tabsSorted = sortTabs(tabsFiltered, data.tabsLastActive);
                        app.tabs = tabsSorted;
                    });
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

    function sortTabs(tabs, tabsLastActive) {
        const now = (+ new Date());
        const tabsSorted = _.sortBy(tabs, timeSinceLastActive(now, tabsLastActive))
        return tabsSorted;
    };

    function updateTabView() {
        document.getElementById('tab-search').focus();
        document.getElementById('tab-search').addEventListener('blur', function() {
            document.getElementById('tab-search').focus();
        });

        app.keyboardSelectionIndex = 0;

        console.log('updateTabView');
        chrome.tabs.query({}, function(tabs) {
            app.resortTabs(tabs);
            // chrome.storage.local.get({tabsLastActive: {}}, function(data) {
            //     var tabsFiltered = _.filter(tabs, function(tab) {return tab.url != window.location.href;});
            //     // console.log('tabsFiltered', tabsFiltered);
            //     const tabsSorted = sortTabs(tabsFiltered, data.tabsLastActive);
            //     app.tabs = tabsSorted;
            // });
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
        // console.log('keydown', e.keyCode);
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


    document.getElementById('tab-search').focus();
    document.getElementById('tab-search').addEventListener('blur', function() {
        document.getElementById('tab-search').focus();
    });

    updateTabView();
}, false);