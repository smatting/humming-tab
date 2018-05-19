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
                    tabs = _.orderBy(tabs, function(tab) {
                        if (_.isNil(tab.title) || _.isEmpty(tab.title)) {
                            return 0;
                        }

                        const res = doScore(query, tab.title);

                        return res[0];

                        // // console.log('tab', tab);
                        // const title = tab.title.toLowerCase();
                        // // console.log('title', title);
                        // if (title.includes(query)) {
                        //     return 1;
                        // } else {
                        //     return 0;
                        // }
                    },
                    ["desc"])
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

    const NO_MATCH = 0;

    // function computeCharScore(query: string, queryLower: string, queryIndex: number, target: string, targetLower: string, targetIndex: number, matchesSequenceLength: number): number {
    function computeCharScore(query, queryLower, queryIndex, target, targetLower, targetIndex, matchesSequenceLength) {
        let score = 0;

        if (queryLower[queryIndex] !== targetLower[targetIndex]) {
            return score; // no match of characters
        }

        // Character match bonus
        score += 1;

        // if (DEBUG) {
        // 	console.groupCollapsed(`%cCharacter match bonus: +1 (char: ${queryLower[queryIndex]} at index ${targetIndex}, total score: ${score})`, 'font-weight: normal');
        // }

        // Consecutive match bonus
        if (matchesSequenceLength > 0) {
            score += (matchesSequenceLength * 5);

            // if (DEBUG) {
            // 	console.log('Consecutive match bonus: ' + (matchesSequenceLength * 5));
            // }
        }

        // Same case bonus
        if (query[queryIndex] === target[targetIndex]) {
            score += 1;

            // if (DEBUG) {
            // 	console.log('Same case bonus: +1');
            // }
        }

        // Start of word bonus
        if (targetIndex === 0) {
            score += 8;

            // if (DEBUG) {
            // 	console.log('Start of word bonus: +8');
            // }
        }

        else {

            // After separator bonus
            // const separatorBonus = scoreSeparatorAtPos(target.charCodeAt(targetIndex - 1));
            const separatorBonus = 0;
            if (separatorBonus) {
                score += separatorBonus;

                // if (DEBUG) {
                // 	console.log('After separtor bonus: +4');
                // }
            }

            // Inside word upper case bonus (camel case)
            // else if (isUpper(target.charCodeAt(targetIndex))) {
            //     score += 1;

            //     // if (DEBUG) {
            //     // 	console.log('Inside word upper case bonus: +1');
            //     // }
            // }
        }

        // if (DEBUG) {
        // 	console.groupEnd();
        // }

        return score;
    }


    // function scoreSeparatorAtPos(charCode: number): number {
    function scoreSeparatorAtPos(charCode) {
        switch (charCode) {
            case CharCode.Slash:
            case CharCode.Backslash:
                return 5; // prefer path separators...
            case CharCode.Underline:
            case CharCode.Dash:
            case CharCode.Period:
            case CharCode.Space:
            case CharCode.SingleQuote:
            case CharCode.DoubleQuote:
            case CharCode.Colon:
                return 4; // ...over other separators
            default:
                return 0;
        }
    }

    // function doScore(query: string, queryLower: string, queryLength: number, target: string, targetLower: string, targetLength: number): [number, number[]] {
    function doScore(query, target) {

        const targetLength = target.length;
        const queryLength = query.length;
        const targetLower = target.toLowerCase();
        const queryLower = query.toLowerCase();

        if (!target || !query) {
            return NO_SCORE; // return early if target or query are undefined
        }

        if (targetLength < queryLength) {
            return NO_SCORE; // impossible for query to be contained in target
        }
        

        const scores = [];
        const matches = [];

        //
        // Build Scorer Matrix:
        //
        // The matrix is composed of query q and target t. For each index we score
        // q[i] with t[i] and compare that with the previous score. If the score is
        // equal or larger, we keep the match. In addition to the score, we also keep
        // the length of the consecutive matches to use as boost for the score.
        //
        //      t   a   r   g   e   t
        //  q
        //  u
        //  e
        //  r
        //  y
        //
        for (let queryIndex = 0; queryIndex < queryLength; queryIndex++) {
            for (let targetIndex = 0; targetIndex < targetLength; targetIndex++) {
                const currentIndex = queryIndex * targetLength + targetIndex;
                const leftIndex = currentIndex - 1;
                const diagIndex = (queryIndex - 1) * targetLength + targetIndex - 1;

                const leftScore = targetIndex > 0 ? scores[leftIndex] : 0;
                const diagScore = queryIndex > 0 && targetIndex > 0 ? scores[diagIndex] : 0;

                const matchesSequenceLength = queryIndex > 0 && targetIndex > 0 ? matches[diagIndex] : 0;

                // If we are not matching on the first query character any more, we only produce a
                // score if we had a score previously for the last query index (by looking at the diagScore).
                // This makes sure that the query always matches in sequence on the target. For example
                // given a target of "ede" and a query of "de", we would otherwise produce a wrong high score
                // for query[1] ("e") matching on target[0] ("e") because of the "beginning of word" boost.
                let score;
                if (!diagScore && queryIndex > 0) {
                    score = 0;
                } else {
                    score = computeCharScore(query, queryLower, queryIndex, target, targetLower, targetIndex, matchesSequenceLength);
                    // score = 1;
                }

                // We have a score and its equal or larger than the left score
                // Match: sequence continues growing from previous diag value
                // Score: increases by diag score value
                if (score && diagScore + score >= leftScore) {
                    matches[currentIndex] = matchesSequenceLength + 1;
                    scores[currentIndex] = diagScore + score;
                }

                // We either have no score or the score is lower than the left score
                // Match: reset to 0
                // Score: pick up from left hand side
                else {
                    matches[currentIndex] = NO_MATCH;
                    scores[currentIndex] = leftScore;
                }
            }
        }

        // Restore Positions (starting from bottom right of matrix)
        const positions = [];
        let queryIndex = queryLength - 1;
        let targetIndex = targetLength - 1;
        while (queryIndex >= 0 && targetIndex >= 0) {
            const currentIndex = queryIndex * targetLength + targetIndex;
            const match = matches[currentIndex];
            if (match === NO_MATCH) {
                targetIndex--; // go left
            } else {
                positions.push(targetIndex);

                // go up and left
                queryIndex--;
                targetIndex--;
            }
        }

        // Print matrix
        // if (DEBUG_MATRIX) {
        // printMatrix(query, target, matches, scores);
        // }

        return [scores[queryLength * targetLength - 1], positions.reverse()];
    }

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

    // const r = doScore("tef ma", "stefan matting");
    // console.log('r', r);

}, false);