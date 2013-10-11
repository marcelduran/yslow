/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

window.addEventListener('DOMContentLoaded', function () {
    // Wait for a message from the background process
    // i.e. when the toolbar button is pressed
    opera.extension.onmessage = function (event) {

        (function (y, p, o) {
            p = y.body.appendChild(y.createElement('iframe'));
            p.id = 'YSLOW-bookmarklet';
            p.style.cssText = 'display:none';
            o = p.contentWindow.document;
            o.open().write(
                '<head>' + 
                '<body onload = "' + 
                '   YUI_config = {' + 
                '       win: window.parent,' + 
                '       doc: window.parent.document' + 
                '   };' + 
                '   var d = document;' + 
                '   d.getElementsByTagName(\'head\')[0]' + 
                '       .appendChild(' + 
                '           d.createElement(\'script\')' + 
                '       ).src = \'http://d.yimg.com/jc/yslow-bookmarklet.js\'"' + 
                '>'
            );
            o.close()
        }(document))

    };
}, false);
