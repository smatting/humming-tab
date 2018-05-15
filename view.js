document.addEventListener('DOMContentLoaded', function(){ 
    var app = new Vue({
        el: '#tab-view',
        data: {
            message: 'Hello Vue!',
            tabs: []
        },
        methods: {
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

    function updateTabView() {
        console.log('updateTabView');
        chrome.tabs.query({}, function(tabs) {
            console.log(tabs);
            app.tabs = tabs;
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