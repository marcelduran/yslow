/*global YSLOW*/

YSLOW.peeler.peel = function (node) {
    var url, docs, doc, doct, baseHref,
        comps = [];

    try {
        // Find all documents in the window.
        docs = this.findDocuments(node);

        for (url in docs) {
            if (docs.hasOwnProperty(url)) {
                doc = docs[url];
                if (doc) {
                    // add the document.
                    comps.push({
                        type: doc.type,
                        href: url
                    });

                    doct = doc.document;
                    if (doct && url) {
                        baseHref = this.getBaseHref(doct);
                        comps = comps.concat(this.findComponentsInNode(doct,
                            baseHref, doc.type));
                    }
                }
            }
        }
    } catch (err) {
        YSLOW.util.dump(err);
        YSLOW.util.event.fire('peelError', {
            'message': err
        });
    }

    return comps;
};
