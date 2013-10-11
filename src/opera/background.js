/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

window.addEventListener('DOMContentLoaded', function () {
    // Specify the properties of the button before creating it.
    var UIItemProperties = {
            disabled: true,
            title: 'YSlow',
            icon: 'images/icon_18.png',
            onclick: function (event) {
                // Send a message to the currently-selected tab.
                var tab = opera.extension.tabs.getFocused();
                if (tab) {
                    // Null if the focused tab is not accessible
                    // by this extension
                    tab.postMessage('go');
                }
            }
        },
        button = opera.contexts.toolbar.createItem(UIItemProperties),

        toggleButton = function () {
            var tab = opera.extension.tabs.getFocused();
            if (tab) {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        };

    // Create the button and add it to the toolbar.
    opera.contexts.toolbar.addItem(button);
    
    // Only enable the button when the extension and page are ready.
    opera.extension.onconnect = toggleButton;
    opera.extension.tabs.onfocus = toggleButton;
    opera.extension.tabs.onblur = toggleButton;
}, false);
