/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/

(function () {
    var types = {
            'text/javascript': 'js',
            'text/jscript': 'js',
            'application/javascript': 'js',
            'application/x-javascript': 'js',
            'text/js': 'js',

            'text/plain': 'doc',
            'text/html': 'doc',
            'application/xhtml+xml': 'doc',

            'text/css': 'css',

            'image/png': 'image',
            'image/jpeg': 'image',
            'image/gif': 'image',
            'image/x-icon': 'image',

            'application/x-shockwave-flash': 'flash',
                
            'text/x-json': 'json',
            'text/x-js': 'json',
            'application/json': 'json',
            'application/x-js': 'json',

            'application/xml': 'xml',
            'application/vnd.mozilla.xul+xml': 'xml',
            'text/xml': 'xml',
            'text/xul': 'xml',
            'application/rdf+xml': 'xml'
        },
        
        // distinguish images from css images
        setCssImages = function (cset) {
            var i, len, comp,
                urls = {},
                comps = cset.getComponentsByType('css');

            // loop all css and build url hash
            for (i = 0, len = comps.length; i < len; i += 1) {
                urls[comps[i].url] = 1;
            }

            // loop all images and set as cssimage those with referer
            comps = cset.getComponentsByType('image');
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                if (urls[comp.req_headers.referer]) {
                    comp.type = 'cssimage';
                }
            }
        },

        // split html (string) into head and body elements
        splitHtml = function (doc, base, html) {
            var reHEAD = /<\s*head[^>]*>([\s\S]*)<\s*\/\s*head\s*>/i,
                reBODY = /<\s*body[^>]*>([\s\S]*)<\s*\/\s*body\s*>/i,
                match = reHEAD.exec(html),
                ret = {
                    head: doc.createElement('div'),
                    body: doc.createElement('div')
                };

            base = '<base href="' + base + '" />';

            if (match) {
                ret.head.innerHTML = base + match[1];
                html = html.slice(match.index + match[0].length);
            }
            match = reBODY.exec(html);
            if (match) {
                ret.body.innerHTML = base + match[1];
            }

            return ret;
        },

        /**
         * Import har file
         * @param doct host document to support dom level 0 methods
         * @param har the har object
         */
        run = function (doct, har, ruleset) {
            var i, j, page, pageId, entry, comp, doc, len, lenJ, split, status,
                content, baseHref, base, onloadTimestamp, cset, html, tDone,
                comps, favicons, favicon, type, response, head, body, score,
                yscontext = new YSLOW.context(doct),
                log = har.log || {},
                pages = log.pages || [],
                entries = log.entries || [];
                
            // pages loop (first page only for now)
            // TODO: think of a way to analyze all pages
            for (i = 0, len = (pages.length ? 1 : 0); i < len; i += 1) {
                page = pages[i];
                pageId = page.id;
                tDone = page.pageTimings.onLoad || 0;
                onloadTimestamp = new Date((new Date(page.startedDateTime))
                    .getTime() + tDone);
                comps = [];

                // page entries loop
                for (j = 0, lenJ = entries.length; j < lenJ; j += 1) {
                    entry = entries[j];
                    response = entry.response;
                    status = parseInt(response.status, 10);
                    content = response.content;
                    type = (content.mimeType || '').toLowerCase();
                    idx = type.indexOf(';');
                    if (idx > -1) {
                        type = type.slice(0, idx);
                    }
                    type = types[type];

                    if (status === 301 || status === 302) {
                        type = 'redirect';
                    }

                    if (!type || status === 204 || entry.pageref !== pageId) {
                        continue;
                    }

                    // get page info
                    // TODO: find a better way to get multiple docs
                    if (!baseHref && type === 'doc') {
                        baseHref = entry.request.url;
                        html = content.text;
                        base = YSLOW.util.makeAbsoluteUrl('', baseHref);
                        doc = doct.createElement('div');
                        doc.innerHTML = '<base href="' + base + '" />' + html;

                        cset = new YSLOW.ComponentSet(doc, onloadTimestamp);
                    }

                    comps.push({
                        type: type,
                        href: entry.request.url,
                        entry: entry
                    });
                }

                // use empty doc if none found (redirect chain with no content)
                if (!cset) {
                    doc = doct.createElement('div');
                    cset = new YSLOW.ComponentSet(doc, onloadTimestamp);
                    entry = entries.length && entries[0];
                    baseHref = entry && entry.request.url;
                    cset.doc_comp = {
                        url: baseHref
                    };
                }

                // build YSlow component set
                for (j = 0, lenJ = comps.length; j < lenJ; j += 1) {
                    comp = comps[j]; 
                    cset.addComponent(comp.href, comp.type, baseHref, {
                            entry: comp.entry,
                            comp: comp
                        }
                    );
                }
            }

            // if no doc was provided return error
            if (!doc) {
                throw new Error('No document found');
                return;
            }

            // set favicon
            favicons = YSLOW.peeler.findFavicon(doc, baseHref);
            comps = cset.components;
            for (i = 0, len = favicons.length; i < len; i += 1) {
                favicon = favicons[i];
                for (j = 0, lenJ = comps.length; j < lenJ; j += 1) {
                    comp = comps[j];
                    if (comp.url === favicon.href) {
                        comp.type = 'favicon';
                    }  
                }
            }

            // refinement
            if (base && html) {
                split = splitHtml(doct, base, html);
                head = split.head;
                body = split.body;
                setCssImages(cset);
                cset.inline = YSLOW.util.getInlineTags(null, head, body);
                cset.domElementsCount = YSLOW.util.countDOMElements(doc);
                cset.cookies = cset.doc_comp.cookie;
                cset.components = YSLOW.util.setInjected(doc,
                    cset.components, cset.doc_comp.body);
            }

            // run analysis
            yscontext.component_set = cset;
            YSLOW.controller.lint(doc, yscontext, ruleset || 'ydefault');
            yscontext.result_set.url = baseHref;
            score = yscontext.PAGE.overallScore;
            yscontext.PAGE.t_done = tDone;
            yscontext.collectStats();

            return {
                score: Math.round(score),
                resultSet: yscontext.result_set,
                componentSet: cset,
                grade: YSLOW.util.prettyScore(score),
                url: baseHref,
                context: yscontext
            };
        };

    // expose to YSLOW
    YSLOW.harImporter = {
        run: run
    };
}());
