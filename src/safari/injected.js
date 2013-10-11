/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

safari.self.addEventListener('message', function (msg) {
    var ifrm, idoc,
        id = 'YSLOW-bookmarklet',
        win = window,
        doc = document;

    if (msg.name === 'init' && win === win.top && !doc.getElementById(id)) {
        ifrm = doc.body.appendChild(doc.createElement('iframe'));
        ifrm.id = id;
        ifrm.style.cssText = 'display:none';
        idoc = ifrm.contentWindow.document;
        idoc.open().write(
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
        idoc.close()
    }
}, false);
