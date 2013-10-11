/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, FirebugContext*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * Use Firebug's net panel
 *
 * @namespace YSLOW.FBYSlow
 * @class net
 * @static
 */
YSLOW.FBYSlow.net = {

    /**
     * Get detail info of the passed url gathered network response from http observation notification.
     * The callback is called with an info object that includes
     * <ul>
     * <li>url</li>
     * <li>status</li>
     * <li>headers</li>
     * <li>raw_headers</li>
     * <li>body</li>
     * <li>method</li>
     * <li>type</li>
     * <li>cookie</li>
     * <li>size</li>
     * <li>respTime</li>
     * <li>startTimestamp</li>
     * </ul>
     * The callback may be called before this function returns.
     *
     * @param {String} url URL of request
     * @param {Function} callback function to callback with the response.
     * @param {Boolean} binary pass true if requesting binary content.
     * @return true if info is found, otherwise returns false.
     * @type Boolean
     */
    getInfo: function (url, callback, binary) {
        var i, file, response,
            fbCtx = typeof FirebugContext !== 'undefined' ?
                FirebugContext : Firebug.currentContext;

        if (typeof fbCtx !== 'undefined' &&
            !fbCtx.netProgress) { /* Net Panel is disabled */
            return false;
        }

        for (i = 0; (file = fbCtx.netProgress.files[i]); i += 1) {
            if (file.href === url) { /* found it */
                //If the component is cached or not modified, Net panel won't store the headers for it.
                if (file.status && parseInt(file.status, 10) !== 304) {
                    response = this.getComponentDetails(file);
                    if (response.size === -1 && response.body.length === 0) {
                        return false;
                    }
                    callback(response);
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Get url of requests identified by type.
     * @param {String|Array} type The type of component to get, e.g. "js" or ['js', 'css']
     * @return array of url
     */
    getResponseURLsByType: function (type) {
        var i, file,
            urls = [],
            types = {},
            fbCtx = typeof FirebugContext !== 'undefined' ?
                FirebugContext : Firebug.currentContext;

        if (typeof fbCtx.netProgress !== 'undefined' && fbCtx.netProgress.files.length > 0) {

            if (typeof type === 'string') {
                types[type] = 1;
            } else {
                for (i in type) {
                    if (type.hasOwnProperty(i) && type[i]) {
                        types[type[i]] = 1;
                    }
                }
            }

            for (i = 0; i < fbCtx.netProgress.files.length; i += 1) {
                file = fbCtx.netProgress.files[i];
                if (typeof types[this.getType(file)] !== 'undefined') {
                    urls.push(file.href);
                } else if (file.isXHR && typeof types.xhr !== 'undefined') {
                    urls.push(file.href);
                }
            }
        }

        return urls;
    },

    /**
     * @private
     * Set response object with info found in Firebug fle object.
     * @param {Object} file
     */
    getComponentDetails: function (file) {
        var respHeaders,
            response = {};

        response.url = file.href;
        response.status = file.status;
        response.respTime = file.endTime - file.startTime;
        response.startTimestamp = file.startTime;
        response.size = file.size;

        respHeaders = this.getResponseHeaders(file);
        response.raw_headers = respHeaders.raw_headers;
        response.headers = respHeaders.headers;

        response.body = this.getResponseText(file, response.headers);
        response.method = file.method;
        response.type = this.getType(file);
        response.cookie = this.getCookie(file);

        response.req_headers = this.getRequestHeaders(file);

        // check if loaded after onload event.
        if (file.phase) {
            if (file.phase.windowLoadTime < file.startTime) {
                response.after_onload = true;
            }
            response.startTimestamp = file.startTime;
        }

        return response;
    },

    /**
     * @private
     */
    getResponseHeaders: function (file) {
        var i,
            headers = {},
            raw_headers = '';

        if (typeof file.responseHeaders !== "undefined" && typeof file.responseHeaders.length !== "undefined") {
            for (i = 0; i < file.responseHeaders.length; i += 1) {
                headers[file.responseHeaders[i].name] = file.responseHeaders[i].value;
                raw_headers += file.responseHeaders[i].name + ": " + file.responseHeaders[i].value + "\n";
            }
        }

        return {
            'headers': headers,
            'raw_headers': raw_headers
        };
    },

    /**
     * @private
     */
    getRequestHeaders: function (file) {
        var i,
            headers = {};

        if (typeof file.requestHeaders !== "undefined" && typeof file.requestHeaders.length !== "undefined") {
            if (file.requestHeaders.length > 0) {
                for (i = 0; i < file.requestHeaders.length; i += 1) {
                    headers[file.requestHeaders[i].name] = file.requestHeaders[i].value;
                }
            }
            return headers;
        }

        return undefined;
    },

    /**
     * @private
     */
    getResponseText: function (file, headers) {
        if (typeof file.responseText !== "undefined") {
            return file.responseText;
        }
        return '';
    },

    /**
     * @private
     */
    getCookie: function (file) {
        var i,
            cookie = '';

        if (typeof file.requestHeaders !== "undefined" && typeof file.requestHeaders.length !== "undefined") {
            for (i = 0; i < file.requestHeaders.length; i += 1) {
                if (file.requestHeaders[i].name === "Cookie") {
                    if (cookie.length > 0) {
                        cookie += '\n';
                    }
                    cookie += file.requestHeaders[i].value;
                }
            }
        }

        return cookie;
    },

    /**
     * @private
     */
    getType: function (file) {
        var type;

        if (file.status === "302") {
            type = "redirect";
        } else if (typeof file.mimeType !== "undefined") {
            type = YSLOW.util.getComponentType(file.mimeType);
        }

        return type;
    }
};
