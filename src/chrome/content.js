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
        function buildComponentSet(comps) {
            var i, comp, len, score,
                baseHref = request.baseHref,
                doc = document,
                yscontext = new YSLOW.context(doc),
                cset = new YSLOW.ComponentSet(doc);

            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                cset.addComponent(comp.href, comp.type,
                    comp.base ? comp.base : baseHref, {
                        obj: comp.obj,
                        component: comp,
                        comp: comp
                    });
            }
            yscontext.component_set = cset;
            YSLOW.controller.lint(doc, yscontext, /*ruleset ||*/ 'ydefault');
            yscontext.result_set.url = baseHref;
            score = yscontext.PAGE.overallScore;
            yscontext.collectStats();
            console.log(yscontext);
        }
        YSLOW.ComponentSet.prototype.setAfterOnload(buildComponentSet, {
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
