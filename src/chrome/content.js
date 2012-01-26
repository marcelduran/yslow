/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW:true, chrome*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, maxerr: 50, indent: 4 */
function onRequest(request, sender, callback) {
    switch (request.action) {
    case 'peel':
        callback(YSLOW.peeler.peel(document));
        break;
    case 'run':
        callback(YSLOW.peeler.getBaseHref(document));
        break;
    case 'afterOnload':
        YSLOW.ComponentSet.prototype.setAfterOnload(callback, {
            docBody: request.docBody,
            doc: document,
            components: request.components
        });
        break;
    case 'inlineTags':
        callback(YSLOW.util.getInlineTags(document));
        break;
    case 'domElementsCount':
        callback(YSLOW.util.countDOMElements(document));
        break;
    case 'getDocCookies':
        callback(YSLOW.util.getDocCookies(document));
        break;
    case 'injected':
        callback(YSLOW.util.setInjected(document,
            request.components, request.docBody));
        break;
    }
}

chrome.extension.onRequest.addListener(onRequest);
