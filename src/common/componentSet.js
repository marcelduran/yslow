/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW,MutationEvent*/
/*jslint browser: true, continue: true, sloppy: true, maxerr: 50, indent: 4 */

/**
 * ComponentSet holds an array of all the components and get the response info from net module for each component.
 *
 * @constructor
 * @param {DOMElement} node DOM Element
 * @param {Number} onloadTimestamp onload timestamp
 */
YSLOW.ComponentSet = function (node, onloadTimestamp) {

    //
    // properties
    //
    this.root_node = node;
    this.components = [];
    this.outstanding_net_request = 0;
    this.component_info = [];
    this.onloadTimestamp = onloadTimestamp;
    this.nextID = 1;
    this.notified_fetch_done = false;

};

YSLOW.ComponentSet.prototype = {

    /**
     * Call this function when you don't use the component set any more.
     * A chance to do proper clean up, e.g. remove event listener.
     */
    clear: function () {
        this.components = [];
        this.component_info = [];
        this.cleared = true;
        if (this.outstanding_net_request > 0) {
            YSLOW.util.dump("YSLOW.ComponentSet.Clearing component set before all net requests finish.");
        }
    },

    /**
     * Add a new component to the set.
     * @param {String} url URL of component
     * @param {String} type type of component
     * @param {String} base_href base href of document that the component belongs.
     * @param {Object} obj DOMElement (for image type only)
     * @return Component object that was added to ComponentSet
     * @type ComponentObject
     */
    addComponent: function (url, type, base_href, o) {
        var comp, found, isDoc;

        if (!url) {
            if (!this.empty_url) {
                this.empty_url = [];
            }
            this.empty_url[type] = (this.empty_url[type] || 0) + 1;
        }
        if (url && type) {
            // check if url is valid.
            if (!YSLOW.ComponentSet.isValidProtocol(url) ||
                    !YSLOW.ComponentSet.isValidURL(url)) {
                return comp;
            }

            // Make sure url is absolute url.
            url = YSLOW.util.makeAbsoluteUrl(url, base_href);
            // For security purpose
            url = YSLOW.util.escapeHtml(url);

            found = typeof this.component_info[url] !== 'undefined';
            isDoc = type === 'doc';

            // make sure this component is not already in this component set,
            // but also check if a doc is coming after a redirect using same url
            if (!found || isDoc) {
                this.component_info[url] = {
                    'state': 'NONE',
                    'count': found ? this.component_info[url].count : 0
                };

                comp = new YSLOW.Component(url, type, this, o);
                if (comp) {
                    comp.id = this.nextID += 1;
                    this.components[this.components.length] = comp;

                    // shortcup for document component
                    if (!this.doc_comp && isDoc) {
                        this.doc_comp = comp;
                    }

                    if (this.component_info[url].state === 'NONE') {
                        // net.js has probably made an async request.
                        this.component_info[url].state = 'REQUESTED';
                        this.outstanding_net_request += 1;
                    }
                } else {
                    this.component_info[url].state = 'ERROR';
                    YSLOW.util.event.fire("componentFetchError");
                }
            }
            this.component_info[url].count += 1;
        }

        return comp;
    },

    /**
     * Add a new component to the set, ignore duplicate.
     * @param {String} url url of component
     * @param {String} type type of component
     * @param {String} base_href base href of document that the component belongs.
     */
    addComponentNoDuplicate: function (url, type, base_href) {

        if (url && type) {
            // For security purpose
            url = YSLOW.util.escapeHtml(url);
            url = YSLOW.util.makeAbsoluteUrl(url, base_href);
            if (this.component_info[url] === undefined) {
                return this.addComponent(url, type, base_href);
            }
        }

    },

    /**
     * Get components by type.
     *
     * @param {String|Array} type The type of component to get, e.g. "js" or
     *        ['js', 'css']
     * @param {Boolean} include_after_onload If component loaded after onload
     *        should be included in the returned results, default is FALSE,
     *        don't include
     * @param {Boolean} include_beacons If image beacons (1x1 images) should
     *        be included in the returned results, default is FALSE, don't
     *        include
     * @return An array of matching components
     * @type Array
     */
    getComponentsByType: function (type, includeAfterOnload, includeBeacons) {
        var i, j, len, lenJ, t, comp, info,
            components = this.components,
            compInfo = this.component_info,
            comps = [],
            types = {};

        if (typeof includeAfterOnload === 'undefined') {
            includeAfterOnload = !(YSLOW.util.Preference.getPref(
                'excludeAfterOnload',
                true
            ));
        }
        if (typeof includeBeacons === 'undefined') {
            includeBeacons = !(YSLOW.util.Preference.getPref(
                'excludeBeaconsFromLint',
                true
            ));
        }

        if (typeof type === 'string') {
            types[type] = 1;
        } else {
            for (i = 0, len = type.length; i < len; i += 1) {
                t = type[i];
                if (t) {
                    types[t] = 1;
                }
            }
        }

        for (i = 0, len = components.length; i < len; i += 1) {
            comp = components[i];
            if (!comp || (comp && !types[comp.type]) ||
                    (comp.is_beacon && !includeBeacons) ||
                    (comp.after_onload && !includeAfterOnload)) {
                continue;
            }
            comps[comps.length] = comp;
            info = compInfo[i];
            if (!info || (info && info.count <= 1)) {
                continue;
            }
            for (j = 1, lenJ = info.count; j < lenJ; j += 1) {
                comps[comps.length] = comp;
            }
        }

        return comps;
    },

    /**
     * @private
     * Get fetching progress.
     * @return { 'total' => total number of component, 'received' => number of components fetched  }
     */
    getProgress: function () {
        var i,
            total = 0,
            received = 0;

        for (i in this.component_info) {
            if (this.component_info.hasOwnProperty(i) &&
                    this.component_info[i]) {
                if (this.component_info[i].state === 'RECEIVED') {
                    received += 1;
                }
                total += 1;
            }
        }

        return {
            'total': total,
            'received': received
        };
    },

    /**
     * Event callback when component's GetInfoState changes.
     * @param {Object} event object
     */
    onComponentGetInfoStateChange: function (event_object) {
        var comp, state, progress;

        if (event_object) {
            if (typeof event_object.comp !== 'undefined') {
                comp = event_object.comp;
            }
            if (typeof event_object.state !== 'undefined') {
                state = event_object.state;
            }
        }
        if (typeof this.component_info[comp.url] === 'undefined') {
            // this should not happen.
            YSLOW.util.dump("YSLOW.ComponentSet.onComponentGetInfoStateChange(): Unexpected component: " + comp.url);
            return;
        }

        if (this.component_info[comp.url].state === "NONE" && state === 'DONE') {
            this.component_info[comp.url].state = "RECEIVED";
        } else if (this.component_info[comp.url].state === "REQUESTED" && state === 'DONE') {
            this.component_info[comp.url].state = "RECEIVED";
            this.outstanding_net_request -= 1;
            // Got all component detail info.
            if (this.outstanding_net_request === 0) {
                this.notified_fetch_done = true;
                YSLOW.util.event.fire("componentFetchDone", {
                    'component_set': this
                });
            }
        } else {
            // how does this happen?
            YSLOW.util.dump("Unexpected component info state: [" + comp.type + "]" + comp.url + "state: " + state + " comp_info_state: " + this.component_info[comp.url].state);
        }

        // fire event.
        progress = this.getProgress();
        YSLOW.util.event.fire("componentFetchProgress", {
            'total': progress.total,
            'current': progress.received,
            'last_component_url': comp.url
        });
    },

    /**
     * This is called when peeler is done.
     * If ComponentSet has all the component info, fire componentFetchDone event.
     */
    notifyPeelDone: function () {
        if (this.outstanding_net_request === 0 && !this.notified_fetch_done) {
            this.notified_fetch_done = true;
            YSLOW.util.event.fire("componentFetchDone", {
                'component_set': this
            });
        }
    },

    /**
     * After onload guess (simple version)
     * Checkes for elements with src or href attributes within
     * the original document html source
     */
    setSimpleAfterOnload: function (callback, obj) {
        var i, j, comp, doc_el, doc_comps, src,
            indoc, url, el, type, len, lenJ,
            docBody, doc, components, that;

        if (obj) {
            docBody = obj.docBody;
            doc = obj.doc;
            components = obj.components;
            that = obj.components;
        } else {
            docBody = this.doc_comp && this.doc_comp.body;
            doc = this.root_node;
            components = this.components;
            that = this;
        }

        // skip testing when doc not found
        if (!docBody) {
            YSLOW.util.dump('doc body is empty');
            return callback(that);
        }

        doc_el = doc.createElement('div');
        doc_el.innerHTML = docBody;
        doc_comps = doc_el.getElementsByTagName('*');

        for (i = 0, len = components.length; i < len; i += 1) {
            comp = components[i];
            type = comp.type;
            if (type === 'cssimage' || type === 'doc') {
                // docs are ignored
                // css images are likely to be loaded before onload
                continue;
            }
            indoc = false;
            url = comp.url;
            for (j = 0, lenJ = doc_comps.length; !indoc && j < lenJ; j += 1) {
                el = doc_comps[j];
                src = el.src || el.href || el.getAttribute('src') ||
                    el.getAttribute('href') ||
                    (el.nodeName === 'PARAM' && el.value);
                indoc = (src === url);
            }
            // if component wasn't found on original html doc
            // assume it was loaded after onload
            comp.after_onload = !indoc;
        }

        callback(that);
    },

    /**
     * After onload guess
     * Checkes for inserted elements with src or href attributes after the
     * page onload event triggers using an iframe with original doc html
     */
    setAfterOnload: function (callback, obj) {
        var ifrm, idoc, iwin, timer, done, noOnloadTimer,
            that, docBody, doc, components, ret, enough, triggered,
            util = YSLOW.util,
            addEventListener = util.addEventListener,
            removeEventListener = util.removeEventListener,
            setTimer = setTimeout,
            clearTimer = clearTimeout,
            comps = [],
            compsHT = {},

            // get changed component and push to comps array
            // reset timer for 1s after the last dom change
            getTarget = function (e) {
                var type, attr, target, src, oldSrc;

                clearTimer(timer);

                type = e.type;
                attr = e.attrName;
                target = e.target;
                src = target.src || target.href || (target.getAttribute && (
                    target.getAttribute('src') || target.getAttribute('href')
                ));
                oldSrc = target.dataOldSrc;

                if (src &&
                        (type === 'DOMNodeInserted' ||
                        (type === 'DOMSubtreeModified' && src !== oldSrc) ||
                        (type === 'DOMAttrModified' &&
                            (attr === 'src' || attr === 'href'))) &&
                        !compsHT[src]) {
                    compsHT[src] = 1;
                    comps.push(target);
                }

                timer = setTimer(done, 1000);
            },

            // temp iframe onload listener
            // - cancel noOnload timer since onload was fired
            // - wait 3s before calling done if no dom mutation happens
            // - set enough timer, limit is 10 seconds for mutations, this is
            //   for edge cases when page inserts/removes nodes within a loop
            iframeOnload =  function () {
                var i, len, all, el, src;

                clearTimer(noOnloadTimer);
                all = idoc.getElementsByTagName('*');
                for (i = 0, len = all.length; i < len; i += 1) {
                    el = all[i];
                    src = el.src || el.href;
                    if (src) {
                        el.dataOldSrc = src;
                    }
                }
                addEventListener(iwin, 'DOMSubtreeModified', getTarget);
                addEventListener(iwin, 'DOMNodeInserted', getTarget);
                addEventListener(iwin, 'DOMAttrModified', getTarget);
                timer = setTimer(done, 3000);
                enough = setTimer(done, 10000);
            };

        if (obj) {
            that = YSLOW.ComponentSet.prototype;
            docBody = obj.docBody;
            doc = obj.doc;
            components = obj.components;
            ret = components;
        } else {
            that = this;
            docBody = that.doc_comp && that.doc_comp.body;
            doc = that.root_node;
            components = that.components;
            ret = that;
        }

        // check for mutation event support or anti-iframe option
        if (typeof MutationEvent === 'undefined' || YSLOW.antiIframe) {
            return that.setSimpleAfterOnload(callback, obj);
        }

        // skip testing when doc not found
        if (!docBody) {
            util.dump('doc body is empty');

            return callback(ret);
        }

        // set afteronload properties for all components loaded after window onlod
        done = function () {
            var i, j, len, lenJ, comp, src, cmp;

            // to avoid executing this function twice
            // due to ifrm iwin double listeners
            if (triggered) {
                return;
            }

            // cancel timers
            clearTimer(enough);
            clearTimer(timer);

            // remove listeners
            removeEventListener(iwin, 'DOMSubtreeModified', getTarget);
            removeEventListener(iwin, 'DOMNodeInserted', getTarget);
            removeEventListener(iwin, 'DOMAttrModified', getTarget);
            removeEventListener(ifrm, 'load', iframeOnload);
            removeEventListener(iwin, 'load', iframeOnload);

            // changed components loop
            for (i = 0, len =  comps.length; i < len; i += 1) {
                comp = comps[i];
                src = comp.src || comp.href || (comp.getAttribute &&
                    (comp.getAttribute('src') || comp.getAttribute('href')));
                if (!src) {
                    continue;
                }
                for (j = 0, lenJ = components.length; j < lenJ; j += 1) {
                    cmp = components[j];
                    if (cmp.url === src) {
                        cmp.after_onload = true;
                    }
                }
            }

            // remove temp iframe and invoke callback passing cset
            ifrm.parentNode.removeChild(ifrm);
            triggered = 1;
            callback(ret);
        };

        // create temp iframe with doc html
        ifrm = doc.createElement('iframe');
        ifrm.style.cssText = 'position:absolute;top:-999em;';
        doc.body.appendChild(ifrm);
        iwin = ifrm.contentWindow;

        // set a fallback when onload is not triggered
        noOnloadTimer = setTimer(done, 3000);

        // set onload and ifram content
        if (iwin) {
            idoc = iwin.document;
        } else {
            iwin = idoc = ifrm.contentDocument;
        }
        addEventListener(iwin, 'load', iframeOnload);
        addEventListener(ifrm, 'load', iframeOnload);
        idoc.open().write(docBody);
        idoc.close();
        addEventListener(iwin, 'load', iframeOnload);
    }
};

/*
 * List of valid protocols in component sets.
 */
YSLOW.ComponentSet.validProtocols = ['http', 'https', 'ftp'];

/**
 * @private
 * Check if url has an allowed protocol (no chrome://, about:)
 * @param url
 * @return false if url does not contain hostname.
 */
YSLOW.ComponentSet.isValidProtocol = function (s) {
    var i, index, protocol,
        validProtocols = this.validProtocols,
        len = validProtocols.length;

    s = s.toLowerCase();
    index = s.indexOf(':');
    if (index > 0) {
        protocol = s.substr(0, index);
        for (i = 0; i < len; i += 1) {
            if (protocol === validProtocols[i]) {
                return true;
            }
        }
    }

    return false;
};


/**
 * @private
 * Check if passed url has hostname specified.
 * @param url
 * @return false if url does not contain hostname.
 */
YSLOW.ComponentSet.isValidURL = function (url) {
    var arr, host;

    url = url.toLowerCase();

    // all url is in the format of <protocol>:<the rest of the url>
    arr = url.split(":");

    // for http protocol, we want to make sure there is a host in the url.
    if (arr[0] === "http" || arr[0] === "https") {
        if (arr[1].substr(0, 2) !== "//") {
            return false;
        }
        host = arr[1].substr(2);
        if (host.length === 0 || host.indexOf("/") === 0) {
            // no host specified.
            return false;
        }
    }

    return true;
};
