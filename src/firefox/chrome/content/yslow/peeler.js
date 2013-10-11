/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, maxerr: 50, indent: 4 */

YSLOW.peeler.peel = function (node, onloadTimestamp) {
    var url, docs, doc, doct, base_href, objs, cset;

    try {
        if (!(cset = new YSLOW.ComponentSet(node,
                onloadTimestamp))) {
            return;
        }

        // Find all documents in the window.
        docs = this.findDocuments(node);

        for (url in docs) {
            if (docs.hasOwnProperty(url)) {
                doc = docs[url];
                if (doc) {
                    doct = doc.document;

                    base_href = this.getBaseHref(doct);

                    // add the document.
                    cset.addComponent(url, doc.type, base_href);

                    objs = this.findComponentsInNode(doct, base_href, doc.type);
                    this.addComponents(cset, objs, base_href);
                }
            }
        }

        this.addComponentsNotInNode(cset, base_href);

        // set page info to avoid using doc on rules
        // this was necessary due to issues with direct access to
        // document on chrome/bookmarklet/har, ff is ok but needs
        // to be cross browser consistent
        cset.inline = YSLOW.util.getInlineTags(node);
        cset.domElementsCount = YSLOW.util.countDOMElements(node);
        cset.cookies = YSLOW.util.getDocCookies(node);
        cset.components = YSLOW.util.setInjected(node, cset.components,
            cset.doc_comp.body);
    } catch (err) {
        YSLOW.util.dump('YSLOW.peeler.peel', err);
        YSLOW.util.event.fire('peelError', {
            'message': err
        });
    }

    return cset;
};

/**
 * @private
 * Add an array of obj in the passed component set.
 * @param {YSLOW.ComponentSet} cset ComponentSet object
 * @param {Array} comps array of objects to be added to ComponentSet.
 * @param {String} baseHref base href
 */
YSLOW.peeler.addComponents = function (cset, comps, baseHref) {
    var i, len, comp;

    for (i = 0, len = comps.length; i < len; i += 1) {
        comp = comps[i];
        if (typeof comp.type === 'string' && typeof comp.href === 'string') {
            cset.addComponent(comp.href, comp.type,
                comp.base || baseHref, {
                    obj: comp.obj,
                    comp: comp
                });
        }
    }
};
