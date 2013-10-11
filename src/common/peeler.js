/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, plusplus: true, bitwise: true, continue: true, maxerr: 50, indent: 4 */

/**
 * @todo:
 * - need better way to discover @import stylesheets, the current one doesn't find them
 * - add request type - post|get - when possible, maybe in the net part of the peeling process
 *
 */

/**
 * Peeler singleton
 * @class
 * @static
 */
YSLOW.peeler = {

    /**
     * @final
     */
    types: ['doc', 'js', 'css', 'iframe', 'flash', 'cssimage', 'image',
        'favicon', 'xhr', 'redirect', 'font'],

    NODETYPE: {
        ELEMENT: 1,
        DOCUMENT: 9
    },

/*
     * http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSRule
     */
    CSSRULE: {
        IMPORT_RULE: 3,
        FONT_FACE_RULE: 5
    },

    /**
     * Start peeling the document in passed window object.
     * The component may be requested asynchronously.
     *
     * @param {DOMElement} node object
     * @param {Number} onloadTimestamp onload timestamp
     * @return ComponentSet
     * @type YSLOW.ComponentSet
     */
    peel: function (node, onloadTimestamp) {
        // platform implementation goes here
    },

    /**
     * @private
     * Finds all frames/iframes recursively
     * @param {DOMElement} node object
     * @return an array of documents in the passed DOM node.
     * @type Array
     */
    findDocuments: function (node) {
        var frames, doc, docUrl, type, i, len, el, frameDocs, parentDoc,
            allDocs = {};

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 1,
            'message': 'Finding documents'
        });

        if (!node) {
            return;
        }

        // check if frame digging was disabled, if so, return the top doc and return.
        if (!YSLOW.util.Preference.getPref('extensions.yslow.getFramesComponents', true)) {
            allDocs[node.URL] = {
                'document': node,
                'type': 'doc'
            };
            return allDocs;
        }

        type = 'doc';
        if (node.nodeType === this.NODETYPE.DOCUMENT) {
            // Document node
            doc = node;
            docUrl = node.URL;
        } else if (node.nodeType === this.NODETYPE.ELEMENT &&
                node.nodeName.toLowerCase() === 'frame') {
            // Frame node
            doc = node.contentDocument;
            docUrl = node.src;
        } else if (node.nodeType === this.NODETYPE.ELEMENT &&
                node.nodeName.toLowerCase() === 'iframe') {
            doc = node.contentDocument;
            docUrl = node.src;
            type = 'iframe';
            try {
                parentDoc = node.contentWindow;
                parentDoc = parentDoc && parentDoc.parent;
                parentDoc = parentDoc && parentDoc.document;
                parentDoc = parentDoc || node.ownerDocument;
                if (parentDoc && parentDoc.URL === docUrl) {
                    // check attribute
                    docUrl = !node.getAttribute('src') ? '' : 'about:blank';
                }
            } catch (err) {
                YSLOW.util.dump(err);
            }
        } else {
            return allDocs;
        }
        allDocs[docUrl] = {
            'document': doc,
            'type': type
        };

        try {
            frames = doc.getElementsByTagName('iframe');
            for (i = 0, len = frames.length; i < len; i += 1) {
                el = frames[i];
                if (el.src) {
                    frameDocs = this.findDocuments(el);
                    if (frameDocs) {
                        allDocs = YSLOW.util.merge(allDocs, frameDocs);
                    }
                }
            }

            frames = doc.getElementsByTagName('frame');
            for (i = 0, len = frames.length; i < len; i += 1) {
                el = frames[i];
                frameDocs = this.findDocuments(el);
                if (frameDocs) {
                    allDocs = YSLOW.util.merge(allDocs, frameDocs);
                }
            }
        } catch (e) {
            YSLOW.util.dump(e);
        }

        return allDocs;
    },

    /**
     * @private
     * Find all components in the passed node.
     * @param {DOMElement} node DOM object
     * @param {String} doc_location document.location
     * @param {String} baseHref href
     * @return array of object (array[] = {'type': object.type, 'href': object.href } )
     * @type Array
     */
    findComponentsInNode: function (node, baseHref, type) {
        var comps = [];
        
        try {
            comps = this.findStyleSheets(node, baseHref);
        } catch (e1) {
            YSLOW.util.dump(e1);
        }
        try {
            comps = comps.concat(this.findScripts(node));
        } catch (e2) {
            YSLOW.util.dump(e2);
        }
        try {
            comps = comps.concat(this.findFlash(node));
        } catch (e3) {
            YSLOW.util.dump(e3);
        }
        try {
            comps = comps.concat(this.findCssImages(node));
        } catch (e4) {
            YSLOW.util.dump(e4);
        }
        try {
            comps = comps.concat(this.findImages(node));
        } catch (e5) {
            YSLOW.util.dump(e5);
        }
        try {
            if (type === 'doc') {
                comps = comps.concat(this.findFavicon(node, baseHref));
            }
        } catch (e6) {
            YSLOW.util.dump(e6);
        }
        
        return comps;
    },

    /**
     * @private
     * Add components in Net component that are not component list found by
     * peeler. These can be xhr requests or images that are preloaded by
     * javascript.
     *
     * @param {YSLOW.ComponentSet} component_set ComponentSet to be checked
     * against.
     * @param {String} base_herf base href
     */
    addComponentsNotInNode: function (component_set, base_href) {
        var i, j, imgs, type, objs,
            types = ['flash', 'js', 'css', 'doc', 'redirect'],
            xhrs = YSLOW.net.getResponseURLsByType('xhr');

        // Now, check net module for xhr component.
        if (xhrs.length > 0) {
            for (j = 0; j < xhrs.length; j += 1) {
                component_set.addComponent(xhrs[j], 'xhr', base_href);
            }
        }

        // check image beacons
        imgs = YSLOW.net.getResponseURLsByType('image');
        if (imgs.length > 0) {
            for (j = 0; j < imgs.length; j += 1) {
                type = 'image';
                if (imgs[j].indexOf("favicon.ico") !== -1) {
                    type = 'favicon';
                }
                component_set.addComponentNoDuplicate(imgs[j], type, base_href);
            }
        }

        // should we check other types?
        for (i = 0; i < types.length; i += 1) {
            objs = YSLOW.net.getResponseURLsByType(types[i]);
            for (j = 0; j < objs.length; j += 1) {
                component_set.addComponentNoDuplicate(objs[j], types[i], base_href);
            }
        }
    },

    /**
     * @private
     * Find all stylesheets in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @param {String} doc_location document.location
     * @param {String} base_href base href
     * @return array of object (array[] = {'type' : 'css', 'href': object.href})
     * @type Array
     */
    findStyleSheets: function (node, baseHref) {
        var styles, style, i, len,
            head = node.getElementsByTagName('head')[0],
            body = node.getElementsByTagName('body')[0],
            comps = [],
            that = this,

            loop = function (els, container) {
                var i, len, el, href, cssUrl;

                for (i = 0, len = els.length; i < len; i += 1) {
                    el = els[i];
                    href = el.href || el.getAttribute('href');
                    if (href && (el.rel === 'stylesheet' ||
                            el.type === 'text/css')) {
                        comps.push({
                            type: 'css',
                            href: href === node.URL ? '' : href,
                            containerNode: container
                        });
                        cssUrl = YSLOW.util.makeAbsoluteUrl(href, baseHref);
                        comps = comps.concat(that.findImportedStyleSheets(el.sheet, cssUrl));
                    }
                }
            };

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 2,
            'message': 'Finding StyleSheets'
        });

        if (head || body) {
            if (head) {
                loop(head.getElementsByTagName('link'), 'head');
            }
            if (body) {
                loop(body.getElementsByTagName('link'), 'body');
            }
        } else {
            loop(node.getElementsByTagName('link'));
        }

        styles = node.getElementsByTagName('style');
        for (i = 0, len = styles.length; i < len; i += 1) {
            style = styles[i];
            comps = comps.concat(that.findImportedStyleSheets(style.sheet, baseHref));
        }

        return comps;
    },

    /**
     * @private
     * Given a css rule, if it's an "@import" rule then add the style sheet
     * component. Also, do a recursive check to see if this imported stylesheet
     * itself contains an imported stylesheet. (FF only)
     * @param {DOMElement} stylesheet DOM stylesheet object
     * @return array of object
     * @type Array
     */
    findImportedStyleSheets: function (styleSheet, parentUrl) {
        var i, rules, rule, cssUrl, ff, len,
            reFile = /url\s*\(["']*([^"'\)]+)["']*\)/i,
            comps = [];

        try {
            if (!(rules = styleSheet.cssRules)) {
                return comps;
            }
            for (i = 0, len = rules.length; i < len; i += 1) {
                rule = rules[i];
                if (rule.type === YSLOW.peeler.CSSRULE.IMPORT_RULE && rule.styleSheet && rule.href) {
                    // It is an imported stylesheet!
                    comps.push({
                        type: 'css',
                        href: rule.href,
                        base: parentUrl
                    });
                    // Recursively check if this stylesheet itself imports any other stylesheets.
                    cssUrl = YSLOW.util.makeAbsoluteUrl(rule.href, parentUrl);
                    comps = comps.concat(this.findImportedStyleSheets(rule.styleSheet, cssUrl));
                } else if (rule.type === YSLOW.peeler.CSSRULE.FONT_FACE_RULE) {
                    if (rule.style && typeof rule.style.getPropertyValue === 'function') {
                        ff = rule.style.getPropertyValue('src');
                        ff = reFile.exec(ff);
                        if (ff) {
                            ff = ff[1];
                            comps.push({
                                type: 'font',
                                href: ff,
                                base: parentUrl
                            });
                        }
                    }
                } else {
                    break;
                }
            }
        } catch (e) {
            YSLOW.util.dump(e);
        }

        return comps;
    },

    /**
     * @private
     * Find all scripts in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'js', 'href': object.href})
     * @type Array
     */
    findScripts: function (node) {
        var comps = [],
            head = node.getElementsByTagName('head')[0],
            body = node.getElementsByTagName('body')[0],

            loop = function (scripts, container) {
                var i, len, script, type, src;

                for (i = 0, len = scripts.length; i < len; i += 1) {
                    script = scripts[i];
                    type = script.type;
                    if (type &&
                            type.toLowerCase().indexOf('javascript') < 0) {
                        continue;
                    }
                    src = script.src || script.getAttribute('src');
                    if (src) {
                        comps.push({
                            type: 'js',
                            href: src === node.URL ? '' : src,
                            containerNode: container
                        });
                    }
                }
            };

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 3,
            'message': 'Finding JavaScripts'
        });

        if (head || body) {
            if (head) {
                loop(head.getElementsByTagName('script'), 'head');
            }
            if (body) {
                loop(body.getElementsByTagName('script'), 'body');
            }
        } else {
            loop(node.getElementsByTagName('script'));
        }

        return comps;
    },

    /**
     * @private
     * Find all flash in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] =  {'type' : 'flash', 'href': object.href } )
     * @type Array
     */
    findFlash: function (node) {
        var i, el, els, len,
            comps = [];

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 4,
            'message': 'Finding Flash'
        });

        els = node.getElementsByTagName('embed');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            if (el.src) {
                comps.push({
                    type: 'flash',
                    href: el.src
                });
            }
        }

        els = node.getElementsByTagName('object');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            if (el.data && el.type === 'application/x-shockwave-flash') {
                comps.push({
                    type: 'flash',
                    href: el.data
                });
            }
        }

        return comps;
    },

    /**
     * @private
     * Find all css images in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type' : 'cssimage', 'href': object.href } )
     * @type Array
     */
    findCssImages: function (node) {
        var i, j, el, els, prop, url, len,
            comps = [],
            hash = {},
            props = ['backgroundImage', 'listStyleImage', 'content', 'cursor'],
            lenJ = props.length;

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 5,
            'message': 'Finding CSS Images'
        });

        els = node.getElementsByTagName('*');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            for (j = 0; j < lenJ; j += 1) {
                prop = props[j];
                url = YSLOW.util.getComputedStyle(el, prop, true);
                if (url && !hash[url]) {
                    comps.push({
                        type: 'cssimage',
                        href: url
                    });
                    hash[url] = 1;
                }
            }
        }

        return comps;
    },

    /**
     * @private
     * Find all images in the passed DOM node.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'image', 'href': object.href} )
     * @type Array
     */
    findImages: function (node) {
        var i, img, imgs, src, len,
            comps = [],
            hash = {};

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 6,
            'message': 'Finding Images'
        });

        imgs = node.getElementsByTagName('img');
        for (i = 0, len = imgs.length; i < len; i += 1) {
            img = imgs[i];
            src = img.src;
            if (src && !hash[src]) {
                comps.push({
                    type: 'image',
                    href: src,
                    obj: {
                        width: img.width,
                        height: img.height
                    }
                });
                hash[src] = 1;
            }
        }

        return comps;
    },

    /**
     * @private
     * Find favicon link.
     * @param {DOMElement} node DOM object
     * @return array of object (array[] = {'type': 'favicon', 'href': object.href} )
     * @type Array
     */
    findFavicon: function (node, baseHref) {
        var i, len, link, links, rel,
            comps = [];

        YSLOW.util.event.fire('peelProgress', {
            'total_step': 7,
            'current_step': 7,
            'message': 'Finding favicon'
        });

        links = node.getElementsByTagName('link');
        for (i = 0, len = links.length; i < len; i += 1) {
            link = links[i];
            rel = (link.rel || '').toLowerCase(); 
            if (link.href && (rel === 'icon' ||
                rel === 'shortcut icon')) {
                comps.push({
                    type: 'favicon',
                    href: link.href
                });
            }
        }

        // add default /favicon.ico if none informed
        if (!comps.length) {
            comps.push({
                type: 'favicon',
                href: YSLOW.util.makeAbsoluteUrl('/favicon.ico', baseHref)
            });
        }

        return comps;
    },

    /**
     * @private
     * Get base href of document.  If <base> element is not found, use doc.location.
     * @param {Document} doc Document object
     * @return base href
     * @type String
     */
    getBaseHref: function (doc) {
        var base;
        
        try {
            base = doc.getElementsByTagName('base')[0];
            base = (base && base.href) || doc.URL; 
        } catch (e) {
            YSLOW.util.dump(e);
        }

        return base;
    }
};
