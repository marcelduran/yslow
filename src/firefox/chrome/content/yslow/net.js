/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * @namespace YSLOW
 * @class net
 * @static
 */
YSLOW.net = {

    nativePref: null,

    pending_requests: [],

    num_active_requests: 0,

    max_active_requests: 3,

    registerNative: function (o) {
        if (this.nativePref === null) {
            this.nativePref = [];
            this.nativePref.push(o);
        } else {
            this.nativePref.splice(0, 0, o);
        }
    },

    /**
     * Get component info from the net.
     * @param url
     * @param callback function to be called when info is ready, the response hash will be passed to the callback.
     * @param binary, pass true if requesting binary content.
     * <ul>response
     * <li>status</li>
     * <li>header</li>
     * <li>body</li>
     * <li>size</li>
     * <li>expires</li>
     * <li>compressed</li>
     * </ul>
     */
    getInfo: function (url, callback, binary) {
        var i;

        if (this.nativePref) {
            // if native function can't find info of the url, request it using xhr.
            for (i = 0; i < this.nativePref.length; i += 1) {
                if (this.nativePref[i].getInfo(url, callback, binary)) {
                    return;
                }
            }
        }

        // By default, FF3 limits the number of xhr connections per server to 6 (previous versions limit
        // this to 2 per server). Some web sites may keep an XHR connection open, so opening multiple
        // sessions to such sites may result in the browser hanging in such a way that the window no
        // longer repaints and controls don't respond.  Here, we limit the number of xhrs requests by
        // by storing it away and processing 3 at a time.
        this.pending_requests.push({
            'url': url,
            'callback': callback,
            'binary': binary
        });
        YSLOW.util.setTimer(YSLOW.net.servicePendingRequests, 0);
    },

    /**
     * @private
     */
    servicePendingRequests: function () {
        var request,
            net = YSLOW.net;

        if (net.pending_requests.length > 0 &&
                net.num_active_requests < net.max_active_requests) {
            request = net.pending_requests.shift();
            net.num_active_request += 1;
            net.asyncRequest(request.url, request.callback, request.binary);
        }
    },

    /**
     * Get XHR info from net.
     */
    getResponseURLsByType: function (type) {
        var i,
            objs = [];

        if (this.nativePref) {
            for (i = 0; i < this.nativePref.length; i += 1) {
                objs = this.nativePref[i].getResponseURLsByType(type);
                if (objs instanceof Array && objs.length === 0) {
                    break;
                }
            }
        }
        return objs;

    },

    /**
     * Requests a URL using XHR asynchronously.
     *
     * The callback passed to this method will receive a hash, containing:
     * <ul>
     *  <li><code>url</code></li>
     *  <li><code>status</code> - status code, e.g 200 or 404</li>
     *  <li><code>raw_headers</code> - a string of headers, as raw as it gets</li>
     *  <li><code>headers</code> - a hash of name=>value headers</li>
     *  <li><code>body</code> - the raw body of the component</li>
     *  <li><code>respTime</code> - the request time of the component</li>
     * </ul>
     *
     * @param url
     * @param callback to be called when XHR request is done.
     *        a response hash will be passed to the callback,
     *        containing status, headers and others
     * @param binary, pass true if requesting binary content.
     */
    asyncRequest: function (url, callback, binary) {
        var startTimestamp,
            req = YSLOW.util.getXHR();

        try {
            req.open('GET', url, true);
            /**
             * @ignore
             */
            req.onreadystatechange = function (e) {
                var response, headerName, endTimestamp,
                    xhr = (e ? e.target : req);

                if (xhr.readyState === 4) { // DONE
                    response = {};
                    response.url = url;
                    response.status = xhr.status;
                    try {
                        response.raw_headers = xhr.getAllResponseHeaders();
                    } catch (err) {
                        response.raw_headers = '';
                    }
                    response.headers = YSLOW.net.getXHRResponseHeaders(xhr);
                    response.body = xhr.responseText;

                    if (response.headers['content-type']) {
                        response.type = YSLOW.util.getComponentType(response.headers['content-type']);
                    }

                    endTimestamp = (new Date()).getTime();
                    if (startTimestamp !== undefined && startTimestamp !== null && endTimestamp !== null) {
                        response.respTime = endTimestamp - startTimestamp;
                    }

                    callback(response);
                    YSLOW.net.num_active_request -= 1;
                }
            };
            YSLOW.util.setTimer(function () {
                req.abort();
            }, YSLOW.util.Preference.getPref("extensions.yslow.xhrWaitingTime", 120000)); // 2 min timeout
            if (binary) {
                req.overrideMimeType('text/plain; charset=x-user-defined');
            }

            startTimestamp = (new Date()).getTime();
            req.send(null);
        } catch (err) {
            YSLOW.util.dump(err);
        }
    },

    /**
     * Turns response headers string into a hash.
     *
     * Accounts for set-cookie and potentially other duplicate headers.
     *
     * @param {XMLHttpRequest} req The XHR object
     * @return {Object} A hash of headers with the keys in lower case, like {'content-type': 'image/png', 'content-encoding': 'gzip', etc... }
     */
    getXHRResponseHeaders: function (req) {
        var res = {},
            name, nameLowerCased, value, i, hdr;

        try {
            hdr = req.getAllResponseHeaders();
        } catch (err) {
            return res;
        }
        if (hdr) {
            hdr = hdr.split('\n');

            for (i = 0; i < hdr.length; i += 1) {
                name = hdr[i].split(':')[0];
                if (name) {
                    nameLowerCased = name.toLowerCase();
                    value = req.getResponseHeader(name);
                    if (value) {
                        if (nameLowerCased === "set-cookie") {
                            res[nameLowerCased] = value;
                        } else {
                            res[nameLowerCased] = value.replace(/\n/g, ' ');
                        }
                    }
                }
            }
        }

        return res;
    }
};
