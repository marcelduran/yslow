/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Firebug, Components, ActiveXObject, gBrowser, window, getBrowser*/
/*jslint sloppy: true, bitwise: true, browser: true, regexp: true*/

/**
 * @namespace YSLOW
 * @class util
 * @static
 */
YSLOW.util = {

    /**
     * merges two objects together, the properties of the second
     * overwrite the properties of the first
     *
     * @param {Object} a Object a
     * @param {Object} b Object b
     * @return {Object} A new object, result of the merge
     */
    merge: function (a, b) {
        var i, o = {};

        for (i in a) {
            if (a.hasOwnProperty(i)) {
                o[i] = a[i];
            }
        }
        for (i in b) {
            if (b.hasOwnProperty(i)) {
                o[i] = b[i];
            }
        }
        return o;

    },


    /**
     * Dumps debug information in FB console, Error console or alert
     *
     * @param {Object} what Object to dump
     */
    dump: function () {
        var args;

        // skip when debbuging is disabled
        if (!YSLOW.DEBUG) {
            return;
        }

        // get arguments and normalize single parameter
        args = Array.prototype.slice.apply(arguments);
        args = args && args.length === 1 ? args[0] : args;

        try {
            if (typeof Firebug !== 'undefined' && Firebug.Console
                    && Firebug.Console.log) { // Firebug
                Firebug.Console.log(args);
            } else if (typeof Components !== 'undefined' && Components.classes
                    && Components.interfaces) { // Firefox
                Components.classes['@mozilla.org/consoleservice;1']
                    .getService(Components.interfaces.nsIConsoleService)
                    .logStringMessage(JSON.stringify(args, null, 2));
            }
        } catch (e1) {
            try {
                console.log(args);
            } catch (e2) {
                // alert shouldn't be used due to its annoying modal behavior
            }
        }
    },

    /**
     * Filters an object/hash using a callback
     *
     * The callback function will be passed two params - a key and a value of each element
     * It should return TRUE is the element is to be kept, FALSE otherwise
     *
     * @param {Object} hash Object to be filtered
     * @param {Function} callback A callback function
     * @param {Boolean} rekey TRUE to return a new array, FALSE to return an object and keep the keys/properties
     */
    filter: function (hash, callback, rekey) {
        var i,
            result = rekey ? [] : {};

        for (i in hash) {
            if (hash.hasOwnProperty(i) && callback(i, hash[i])) {
                result[rekey ? result.length : i] = hash[i];
            }
        }

        return result;
    },

    expires_month: {
        Jan: 1,
        Feb: 2,
        Mar: 3,
        Apr: 4,
        May: 5,
        Jun: 6,
        Jul: 7,
        Aug: 8,
        Sep: 9,
        Oct: 10,
        Nov: 11,
        Dec: 12
    },


    /**
     * Make a pretty string out of an Expires object.
     *
     * @todo Remove or replace by a general-purpose date formatting method
     *
     * @param {String} s_expires Datetime string
     * @return {String} Prity date
     */
    prettyExpiresDate: function (expires) {
        var month;

        if (Object.prototype.toString.call(expires) === '[object Date]' && expires.toString() !== 'Invalid Date' && !isNaN(expires)) {
            month = expires.getMonth() + 1;
            return expires.getFullYear() + "/" + month + "/" + expires.getDate();
        } else if (!expires) {
            return 'no expires';
        }
        return 'invalid date object';
    },

    /**
     * Converts cache-control: max-age=? into a JavaScript date
     *
     * @param {Integer} seconds Number of seconds in the cache-control header
     * @return {Date} A date object coresponding to the expiry date
     */
    maxAgeToDate: function (seconds) {
        var d = new Date();

        d = d.getTime() + parseInt(seconds, 10) * 1000;
        return new Date(d);
    },

    /**
     * Produces nicer sentences accounting for single/plural occurences.
     *
     * For example: "There are 3 scripts" vs "There is 1 script".
     * Currently supported tags to be replaced are:
     * %are%, %s% and %num%
     *
     *
     * @param {String} template A template with tags, like "There %are% %num% script%s%"
     * @param {Integer} num An integer value that replaces %num% and also deternmines how the other tags will be replaced
     * @return {String} The text after substitution
     */
    plural: function (template, number) {
        var i,
            res = template,
            repl = {
                are: ['are', 'is'],
                s: ['s', ''],
                'do': ['do', 'does'],
                num: [number, number]
            };


        for (i in repl) {
            if (repl.hasOwnProperty(i)) {
                res = res.replace(new RegExp('%' + i + '%', 'gm'), (number === 1) ? repl[i][1] : repl[i][0]);
            }
        }

        return res;
    },

    /**
     * Counts the number of expression in a given piece of stylesheet.
     *
     * Expressions are identified by the presence of the literal string "expression(".
     * There could be false positives in commented out styles.
     *
     * @param {String} content Text to inspect for the presence of expressions
     * @return {Integer} The number of expressions in the text
     */
    countExpressions: function (content) {
        var num_expr = 0,
            index;

        index = content.indexOf("expression(");
        while (index !== -1) {
            num_expr += 1;
            index = content.indexOf("expression(", index + 1);
        }

        return num_expr;
    },

    /**
     * Counts the number of AlphaImageLoader filter in a given piece of stylesheet.
     *
     * AlphaImageLoader filters are identified by the presence of the literal string "filter:" and
     * "AlphaImageLoader" .
     * There could be false positives in commented out styles.
     *
     * @param {String} content Text to inspect for the presence of filters
     * @return {Hash} 'filter type' => count. For Example, {'_filter' : count }
     */
    countAlphaImageLoaderFilter: function (content) {
        var index, colon, filter_hack, value,
            num_filter = 0,
            num_hack_filter = 0,
            result = {};

        index = content.indexOf("filter:");
        while (index !== -1) {
            filter_hack = false;
            if (index > 0 && content.charAt(index - 1) === '_') {
                // check underscore.
                filter_hack = true;
            }
            // check literal string "AlphaImageLoader"
            colon = content.indexOf(";", index + 7);
            if (colon !== -1) {
                value = content.substring(index + 7, colon);
                if (value.indexOf("AlphaImageLoader") !== -1) {
                    if (filter_hack) {
                        num_hack_filter += 1;
                    } else {
                        num_filter += 1;
                    }
                }
            }
            index = content.indexOf("filter:", index + 1);
        }

        if (num_hack_filter > 0) {
            result.hackFilter = num_hack_filter;
        }
        if (num_filter > 0) {
            result.filter = num_filter;
        }

        return result;
    },

    /**
     * Returns the hostname (domain) for a given URL
     * 
     * @param {String} url The absolute URL to get hostname from
     * @return {String} The hostname
     */
    getHostname: function (url) {
        var hostname = url.split('/')[2];

        return (hostname && hostname.split(':')[0]) || '';
    },

    /**
     * Returns an array of unique domain names, based on a given array of components
     *
     * @param {Array} comps An array of components (not a @see ComponentSet)
     * @param {Boolean} exclude_ips Whether to exclude IP addresses from the list of domains (for DNS check purposes)
     * @return {Array} An array of unique domian names
     */
    getUniqueDomains: function (comps, exclude_ips) {
        var i, len, parts,
            domains = {},
            retval = [];

        for (i = 0, len = comps.length; i < len; i += 1) {
            parts = comps[i].url.split('/');
            if (parts[2]) {
                // add to hash, but remove port number first
                domains[parts[2].split(':')[0]] = 1;
            }
        }

        for (i in domains) {
            if (domains.hasOwnProperty(i)) {
                if (!exclude_ips) {
                    retval.push(i);
                } else {
                    // exclude ips, identify them by the pattern "what.e.v.e.r.[number]"
                    parts = i.split('.');
                    if (isNaN(parseInt(parts[parts.length - 1], 10))) {
                        // the last part is "com" or something that is NaN
                        retval.push(i);
                    }
                }
            }
        }

        return retval;
    },

    summaryByDomain: function (comps, sumFields, excludeIPs) {
        var i, j, len, parts, hostname, domain, comp, sumLen, field, sum,
            domains = {},
            retval = [];

        // normalize sumField to array (makes things easier)
        sumFields = [].concat(sumFields);
        sumLen = sumFields.length;

        // loop components, count and summarize fields
        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            parts = comp.url.split('/');
            if (parts[2]) {
                // add to hash, but remove port number first
                hostname = parts[2].split(':')[0];
                domain = domains[hostname];
                if (!domain) {
                    domain = {
                        domain: hostname,
                        count: 0
                    };
                    domains[hostname] = domain;
                }
                domain.count += 1;
                // fields summary
                for (j = 0; j < sumLen; j += 1) {
                    field = sumFields[j];
                    sum = domain['sum_' + field] || 0;
                    sum += parseInt(comp[field], 10) || 0;
                    domain['sum_' + field] = sum;
                }
            }
        }

        // loop hash of unique domains
        for (domain in domains) {
            if (domains.hasOwnProperty(domain)) {
                if (!excludeIPs) {
                    retval.push(domains[domain]);
                } else {
                    // exclude ips, identify them by the pattern "what.e.v.e.r.[number]"
                    parts = domain.split('.');
                    if (isNaN(parseInt(parts[parts.length - 1], 10))) {
                        // the last part is "com" or something that is NaN
                        retval.push(domains[domain]);
                    }
                }
            }
        }

        return retval;
    },

    /**
     * Checks if a given piece of text (sctipt, stylesheet) is minified.
     *
     * The logic is: we strip consecutive spaces, tabs and new lines and
     * if this improves the size by more that 20%, this means there's room for improvement.
     *
     * @param {String} contents The text to be checked for minification
     * @return {Boolean} TRUE if minified, FALSE otherwise
     */
    isMinified: function (contents) {
        var len = contents.length,
            striplen;

        if (len === 0) { // blank is as minified as can be
            return true;
        }

        // TODO: enhance minifier logic by adding comment checking: \/\/[\w\d \t]*|\/\*[\s\S]*?\*\/
        // even better: add jsmin/cssmin
        striplen = contents.replace(/\n| {2}|\t|\r/g, '').length; // poor man's minifier
        if (((len - striplen) / len) > 0.2) { // we saved 20%, so this component can get some mifinication done
            return false;
        }

        return true;
    },


    /**
     * Inspects the ETag.
     *
     * Returns FALSE (bad ETag) only if the server is Apache or IIS and the ETag format
     * matches the default ETag format for the server. Anything else, including blank etag
     * returns TRUE (good ETag).
     * Default IIS: Filetimestamp:ChangeNumber
     * Default Apache: inode-size-timestamp
     *
     * @param {String} etag ETag response header
     * @return {Boolean} TRUE if ETag is good, FALSE otherwise
     */
    isETagGood: function (etag) {
        var reIIS = /^[0-9a-f]+:([1-9a-f]|[0-9a-f]{2,})$/,
            reApache = /^[0-9a-f]+\-[0-9a-f]+\-[0-9a-f]+$/;

        if (!etag) {
            return true; // no etag is ok etag
        }

        etag = etag.replace(/^["']|["'][\s\S]*$/g, ''); // strip " and '
        return !(reApache.test(etag) || reIIS.test(etag));
    },

    /**
     * Get internal component type from passed mime type.
     * @param {String} content_type mime type of the content.
     * @return yslow internal component type
     * @type String
     */
    getComponentType: function (content_type) {
        var c_type = 'unknown';

        if (content_type && typeof content_type === "string") {
            if (content_type === "text/html" || content_type === "text/plain") {
                c_type = 'doc';
            } else if (content_type === "text/css") {
                c_type = 'css';
            } else if (/javascript/.test(content_type)) {
                c_type = 'js';
            } else if (/flash/.test(content_type)) {
                c_type = 'flash';
            } else if (/image/.test(content_type)) {
                c_type = 'image';
            } else if (/font/.test(content_type)) {
                c_type = 'font';
            }
        }

        return c_type;
    },

    /**
     * base64 encode the data. This works with data that fails win.atob.
     * @param {bytes} data data to be encoded.
     * @return bytes array of data base64 encoded.
     */
    base64Encode: function (data) {
        var i, a, b, c, new_data = '',
            padding = 0,
            arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'];

        for (i = 0; i < data.length; i += 3) {
            a = data.charCodeAt(i);
            if ((i + 1) < data.length) {
                b = data.charCodeAt(i + 1);
            } else {
                b = 0;
                padding += 1;
            }
            if ((i + 2) < data.length) {
                c = data.charCodeAt(i + 2);
            } else {
                c = 0;
                padding += 1;
            }

            new_data += arr[(a & 0xfc) >> 2];
            new_data += arr[((a & 0x03) << 4) | ((b & 0xf0) >> 4)];
            if (padding > 0) {
                new_data += "=";
            } else {
                new_data += arr[((b & 0x0f) << 2) | ((c & 0xc0) >> 6)];
            }
            if (padding > 1) {
                new_data += "=";
            } else {
                new_data += arr[(c & 0x3f)];
            }
        }

        return new_data;
    },

    /**
     * Creates x-browser XHR objects
     *
     * @return {XMLHTTPRequest} A new XHR object
     */
    getXHR: function () {
        var i = 0,
            xhr = null,
            ids = ['MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];


        if (typeof XMLHttpRequest === 'function') {
            return new XMLHttpRequest();
        }

        for (i = 0; i < ids.length; i += 1) {
            try {
                xhr = new ActiveXObject(ids[i]);
                break;
            } catch (e) {}

        }

        return xhr;
    },

    /**
     * Returns the computed style
     *
     * @param {HTMLElement} el A node
     * @param {String} st Style identifier, e.g. "backgroundImage"
     * @param {Boolean} get_url Whether to return a url
     * @return {String|Boolean} The value of the computed style, FALSE if get_url is TRUE and the style is not a URL
     */
    getComputedStyle: function (el, st, get_url) {
        var style, urlMatch,
            res = '';

        if (el.currentStyle) {
            res = el.currentStyle[st];
        }

        if (el.ownerDocument && el.ownerDocument.defaultView && document.defaultView.getComputedStyle) {
            style = el.ownerDocument.defaultView.getComputedStyle(el, '');
            if (style) {
                res = style[st];
            }
        }

        if (!get_url) {
            return res;
        }

        if (typeof res !== 'string') {
            return false;
        }

        urlMatch = res.match(/\burl\((\'|\"|)([^\'\"]+?)\1\)/);
        if (urlMatch) {
            return urlMatch[2];
        } else {
            return false;
        }
    },

    /**
     * escape '<' and '>' in the passed html code.
     * @param {String} html code to be escaped.
     * @return escaped html code
     * @type String
     */
    escapeHtml: function (html) {
        return (html || '').toString()
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },

    /**
     * escape quotes in the passed html code.
     * @param {String} str string to be escaped.
     * @param {String} which type of quote to be escaped. 'single' or 'double'
     * @return escaped string code
     * @type String
     */
    escapeQuotes: function (str, which) {
        if (which === 'single') {
            return str.replace(/\'/g, '\\\''); // '
        }
        if (which === 'double') {
            return str.replace(/\"/g, '\\\"'); // "
        }
        return str.replace(/\'/g, '\\\'').replace(/\"/g, '\\\"'); // ' and "
    },

    /**
     * Convert a HTTP header name to its canonical form,
     * e.g. "content-length" => "Content-Length".
     * @param headerName the header name (case insensitive)
     * @return {String} the formatted header name
     */
    formatHeaderName: (function () {
        var specialCases = {
            'content-md5': 'Content-MD5',
            dnt: 'DNT',
            etag: 'ETag',
            p3p: 'P3P',
            te: 'TE',
            'www-authenticate': 'WWW-Authenticate',
            'x-att-deviceid': 'X-ATT-DeviceId',
            'x-cdn': 'X-CDN',
            'x-ua-compatible': 'X-UA-Compatible',
            'x-xss-protection': 'X-XSS-Protection'
        };
        return function (headerName) {
            var lowerCasedHeaderName = headerName.toLowerCase();
            if (specialCases.hasOwnProperty(lowerCasedHeaderName)) {
                return specialCases[lowerCasedHeaderName];
            } else {
                // Make sure that the first char and all chars following a dash are upper-case:
                return lowerCasedHeaderName.replace(/(^|-)([a-z])/g, function ($0, optionalLeadingDash, ch) {
                    return optionalLeadingDash + ch.toUpperCase();
                });
            }
        };
    }()),

    /**
     * Math mod method.
     * @param {Number} divisee
     * @param {Number} base
     * @return mod result
     * @type Number
     */
    mod: function (divisee, base) {
        return Math.round(divisee - (Math.floor(divisee / base) * base));
    },

    /**
     * Abbreviate the passed url to not exceed maxchars.
     * (Just display the hostname and first few chars after the last slash.
     * @param {String} url originial url
     * @param {Number} maxchars max. number of characters in the result string.
     * @return abbreviated url
     * @type String
     */
    briefUrl: function (url, maxchars) {
        var iDoubleSlash, iQMark, iFirstSlash, iLastSlash;

        maxchars = maxchars || 100; // default 100 characters
        if (url === undefined) {
            return '';
        }

        // We assume it's a full URL.
        iDoubleSlash = url.indexOf("//");
        if (-1 !== iDoubleSlash) {

            // remove query string
            iQMark = url.indexOf("?");
            if (-1 !== iQMark) {
                url = url.substring(0, iQMark) + "?...";
            }

            if (url.length > maxchars) {
                iFirstSlash = url.indexOf("/", iDoubleSlash + 2);
                iLastSlash = url.lastIndexOf("/");
                if (-1 !== iFirstSlash && -1 !== iLastSlash && iFirstSlash !== iLastSlash) {
                    url = url.substring(0, iFirstSlash + 1) + "..." + url.substring(iLastSlash);
                } else {
                    url = url.substring(0, maxchars + 1) + "...";
                }
            }
        }

        return url;
    },

    /**
     * Return a string with an anchor around a long piece of text.
     * (It's confusing, but often the "long piece of text" is the URL itself.)
     * Snip the long text if necessary.
     * Optionally, break the long text across multiple lines.
     * @param {String} text
     * @param {String} url
     * @param {String} sClass class name for the new anchor
     * @param {Boolean} bBriefUrl whether the url should be abbreviated.
     * @param {Number} maxChars max. number of chars allowed for each line.
     * @param {Number} numLines max. number of lines allowed
     * @param {String} rel rel attribute of anchor.
     * @return html code for the anchor.
     * @type String
     */
    prettyAnchor: function (text, url, sClass, bBriefUrl, maxChars, numLines, rel) {
        var escaped_dq_url,
            sTitle = '',
            sResults = '',
            iLines = 0;

        if (typeof url === 'undefined') {
            url = text;
        }
        if (typeof sClass === 'undefined') {
            sClass = '';
        } else {
            sClass = ' class="' + sClass + '"';
        }
        if (typeof maxChars === 'undefined') {
            maxChars = 100;
        }
        if (typeof numLines === 'undefined') {
            numLines = 1;
        }
        rel = (rel) ? ' rel="' + rel + '"' : '';

        url = YSLOW.util.escapeHtml(url);
        text = YSLOW.util.escapeHtml(text);

        escaped_dq_url = YSLOW.util.escapeQuotes(url, 'double');

        if (bBriefUrl) {
            text = YSLOW.util.briefUrl(text, maxChars);
            sTitle = ' title="' + escaped_dq_url + '"';
        }

        while (0 < text.length) {
            sResults += '<a' + rel + sClass + sTitle + ' href="' +
                escaped_dq_url +
                '" onclick="javascript:document.ysview.openLink(\'' +
                YSLOW.util.escapeQuotes(url) +
                '\'); return false;">' + text.substring(0, maxChars);
            text = text.substring(maxChars);
            iLines += 1;
            if (iLines >= numLines) {
                // We've reached the maximum number of lines.
                if (0 < text.length) {
                    // If there's still text leftover, snip it.
                    sResults += "[snip]";
                }
                sResults += "</a>";
                break;
            } else {
                // My (weak) attempt to break long URLs.
                sResults += "</a><font style='font-size: 0px;'> </font>";
            }
        }

        return sResults;
    },

    /**
     * Convert a number of bytes into a readable KB size string.
     * @param {Number} size
     * @return readable KB size string
     * @type String
     */
    kbSize: function (size) {
        var remainder = size % (size > 100 ? 100 : 10);
        size -= remainder;
        return parseFloat(size / 1000) + (0 === (size % 1000) ? ".0" : "") + "K";
    },

    /**
     * @final
     */
    prettyTypes: {
        "image": "Image",
        "doc": "HTML/Text",
        "cssimage": "CSS Image",
        "css": "Stylesheet File",
        "js": "JavaScript File",
        "flash": "Flash Object",
        "iframe": "IFrame",
        "xhr": "XMLHttpRequest",
        "redirect": "Redirect",
        "favicon": "Favicon",
        "unknown": "Unknown"
    },

/*
     *  Convert a type (eg, "cssimage") to a prettier name (eg, "CSS Images").
     * @param {String} sType component type
     * @return display name of component type
     * @type String
     */
    prettyType: function (sType) {
        return YSLOW.util.prettyTypes[sType];
    },

    /**
     *  Return a letter grade for a score.
     * @param {String or Number} iScore
     * @return letter grade for a score
     * @type String
     */
    prettyScore: function (score) {
        var letter = 'F';

        if (!parseInt(score, 10) && score !== 0) {
            return score;
        }
        if (score === -1) {
            return 'N/A';
        }

        if (score >= 90) {
            letter = 'A';
        } else if (score >= 80) {
            letter = 'B';
        } else if (score >= 70) {
            letter = 'C';
        } else if (score >= 60) {
            letter = 'D';
        } else if (score >= 50) {
            letter = 'E';
        }

        return letter;
    },

    /**
     * Returns YSlow results as an Object.
     * @param {YSLOW.context} yscontext yslow context.
     * @param {String|Array} info Information to be shown
     *        (basic|grade|stats|comps|all) [basic].
     * @return {Object} the YSlow results object.
     */
    getResults: function (yscontext, info) {
        var i, l, results, url, type, comps, comp, encoded_url, obj, cr,
            cs, etag, name, len, include_grade, include_comps, include_stats,
            result, len2, spaceid, header, sourceHeaders, targetHeaders,
            reButton = / <button [\s\S]+<\/button>/,
            util = YSLOW.util,
            isArray = util.isArray,
            stats = {},
            stats_c = {},
            comp_objs = [],
            params = {},
            g = {};

        // default
        info = (info || 'basic').split(',');

        for (i = 0, len = info.length; i < len; i += 1) {
            if (info[i] === 'all') {
                include_grade = include_stats = include_comps = true;
                break;
            } else {
                switch (info[i]) {
                case 'grade':
                    include_grade = true;
                    break;
                case 'stats':
                    include_stats = true;
                    break;
                case 'comps':
                    include_comps = true;
                    break;
                }
            }
        }

        params.v = YSLOW.version;
        params.w = parseInt(yscontext.PAGE.totalSize, 10);
        params.o = parseInt(yscontext.PAGE.overallScore, 10);
        params.u = encodeURIComponent(yscontext.result_set.url);
        params.r = parseInt(yscontext.PAGE.totalRequests, 10);
        spaceid = util.getPageSpaceid(yscontext.component_set);
        if (spaceid) {
            params.s = encodeURI(spaceid);
        }
        params.i = yscontext.result_set.getRulesetApplied().id;
        if (yscontext.PAGE.t_done) {
            params.lt = parseInt(yscontext.PAGE.t_done, 10);
        }

        if (include_grade) {
            results = yscontext.result_set.getResults();
            for (i = 0, len = results.length; i < len; i += 1) {
                obj = {};
                result = results[i];
                if (result.hasOwnProperty('score')) {
                    if (result.score >= 0) {
                        obj.score = parseInt(result.score, 10);
                    } else if (result.score === -1) {
                        obj.score = 'n/a';
                    }
                }
                // removing hardcoded open link,
                // TODO: remove those links from original messages
                obj.message = result.message.replace(
                    /javascript:document\.ysview\.openLink\('(.+)'\)/,
                    '$1'
                );
                comps = result.components;
                if (isArray(comps)) {
                    obj.components = [];
                    for (l = 0, len2 = comps.length; l < len2; l += 1) {
                        comp = comps[l];
                        if (typeof comp === 'string') {
                            url = comp;
                        } else if (typeof comp.url === 'string') {
                            url = comp.url;
                        }
                        if (url) {
                            url = encodeURIComponent(url.replace(reButton, ''));
                            obj.components.push(url);
                        }
                    }
                }
                g[result.rule_id] = obj;
            }
            params.g = g;
        }

        if (include_stats) {
            params.w_c = parseInt(yscontext.PAGE.totalSizePrimed, 10);
            params.r_c = parseInt(yscontext.PAGE.totalRequestsPrimed, 10);

            for (type in yscontext.PAGE.totalObjCount) {
                if (yscontext.PAGE.totalObjCount.hasOwnProperty(type)) {
                    stats[type] = {
                        'r': yscontext.PAGE.totalObjCount[type],
                        'w': yscontext.PAGE.totalObjSize[type]
                    };
                }
            }
            params.stats = stats;

            for (type in yscontext.PAGE.totalObjCountPrimed) {
                if (yscontext.PAGE.totalObjCountPrimed.hasOwnProperty(type)) {
                    stats_c[type] = {
                        'r': yscontext.PAGE.totalObjCountPrimed[type],
                        'w': yscontext.PAGE.totalObjSizePrimed[type]
                    };
                }
            }
            params.stats_c = stats_c;
        }

        if (include_comps) {
            comps = yscontext.component_set.components;
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                encoded_url = encodeURIComponent(comp.url);
                obj = {
                    'type': comp.type,
                    'url': encoded_url,
                    'size': comp.size,
                    'resp': comp.respTime
                };
                if (comp.size_compressed) {
                    obj.gzip = comp.size_compressed;
                }
                if (comp.expires && comp.expires instanceof Date) {
                    obj.expires = util.prettyExpiresDate(comp.expires);
                }
                cr = comp.getReceivedCookieSize();
                if (cr > 0) {
                    obj.cr = cr;
                }
                cs = comp.getSetCookieSize();
                if (cs > 0) {
                    obj.cs = cs;
                }
                etag = comp.getEtag();
                if (typeof etag === 'string' && etag.length > 0) {
                    obj.etag = etag;
                }
                // format req/res headers
                obj.headers = {};
                if (comp.req_headers) {
                    sourceHeaders = comp.req_headers;
                    obj.headers.request = {};
                    targetHeaders = obj.headers.request;
                    for (header in sourceHeaders) {
                        if (sourceHeaders.hasOwnProperty(header)) {
                            targetHeaders[util.formatHeaderName(header)] =
                                sourceHeaders[header];
                        }
                    }
                }
                if (comp.headers) {
                    sourceHeaders = comp.headers;
                    obj.headers.response = {};
                    targetHeaders = obj.headers.response;
                    for (header in sourceHeaders) {
                        if (sourceHeaders.hasOwnProperty(header)) {
                            targetHeaders[util.formatHeaderName(header)] =
                                sourceHeaders[header];
                        }
                    }
                }
                comp_objs.push(obj);
            }
            params.comps = comp_objs;
        }

        return params;
    },

    /**
     * Send YSlow beacon.
     * @param {Object} results Results object
     *        generated by {@link YSLOW.util.getResults}.
     * @param {String|Array} info Information to be beaconed
     *        (basic|grade|stats|comps|all).
     * @param {String} url The URL to fire beacon to.
     * @return {String} The beacon content sent.
     */
    sendBeacon: function (results, info, url) {
        var i, len, req, name, img,
            beacon = '',
            util = YSLOW.util,
            pref = util.Preference,
            method = 'get';

        // default
        info = (info || 'basic').split(',');

        for (i = 0, len = info.length; i < len; i += 1) {
            if (info[i] === 'all') {
                method = 'post';
                break;
            } else {
                switch (info[i]) {
                case 'grade':
                    method = 'post';
                    break;
                case 'stats':
                    method = 'post';
                    break;
                case 'comps':
                    method = 'post';
                    break;
                }
            }
        }

        if (method === 'post') {
            beacon = JSON.stringify(results, null);
            req = util.getXHR();
            req.open('POST', url, true);
            req.setRequestHeader('Content-Length', beacon.length);
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(beacon);
        } else {
            for (name in results) {
                if (results.hasOwnProperty(name)) {
                    beacon += name + '=' + results[name] + '&';
                }
            }
            img = new Image();
            img.src = url + '?' + beacon;
        }

        return beacon;
    },

    /**
     * Get the dictionary of params used in results.
     * @param {String|Array} info Results information
     *        (basic|grade|stats|comps|all).
     * @param {String} ruleset The Results ruleset used
     *        (ydefault|yslow1|yblog).
     * @return {Object} The dictionary object {key: value}.
     */
    getDict: function (info, ruleset) {
        var i, len, include_grade, include_stats, include_comps,
            weights, rs,
            yslow = YSLOW,
            controller = yslow.controller,
            rules = yslow.doc.rules,
            dict = {
                v: 'version',
                w: 'size',
                o: 'overall score',
                u: 'url',
                r: 'total number of requests',
                s: 'space id of the page',
                i: 'id of the ruleset used',
                lt: 'page load time',
                grades: '100 >= A >= 90 > B >= 80 > C >= 70 > ' +
                    'D >= 60 > E >= 50 > F >= 0 > N/A = -1'
            };

        // defaults
        info = (info || 'basic').split(',');
        ruleset = ruleset || 'ydefault';
        weights = controller.rulesets[ruleset].weights;

        // check which info will be included
        for (i = 0, len = info.length; i < len; i += 1) {
            if (info[i] === 'all') {
                include_grade = include_stats = include_comps = true;
                break;
            } else {
                switch (info[i]) {
                case 'grade':
                    include_grade = true;
                    break;
                case 'stats':
                    include_stats = true;
                    break;
                case 'comps':
                    include_comps = true;
                    break;
                }
            }
        }

        // include dictionary
        if (include_grade) {
            dict.g = 'scores of all rules in the ruleset';
            dict.rules = {};
            for (rs in weights) {
                if (weights.hasOwnProperty(rs)) {
                    dict.rules[rs] = rules[rs];
                    dict.rules[rs].weight = weights[rs];
                }
            }
        }
        if (include_stats) {
            dict.w_c = 'page weight with primed cache';
            dict.r_c = 'number of requests with primed cache';
            dict.stats = 'number of requests and weight grouped by ' +
                'component type';
            dict.stats_c = 'number of request and weight of ' +
                'components group by component type with primed cache';
        }
        if (include_comps) {
            dict.comps = 'array of all the components found on the page';
        }

        return dict;
    },

    /**
     * Check if input is an Object
     * @param {Object} the input to check wheter it's an object or not
     * @return {Booleam} true for Object
     */
    isObject: function (o) {
        return Object.prototype.toString.call(o).indexOf('Object') > -1;
    },

    /**
     * Check if input is an Array
     * @param {Array} the input to check wheter it's an array or not
     * @return {Booleam} true for Array
     */
    isArray: function (o) {
        if (Array.isArray) {
            return Array.isArray(o);
        } else {
            return Object.prototype.toString.call(o).indexOf('Array') > -1;
        }
    },


    /**
     * Wrapper for decodeURIComponent, try to decode
     * otherwise return the input value.
     * @param {String} value The value to be decoded.
     * @return {String} The decoded value.
     */
    decodeURIComponent: function (value) {
        try {
            return decodeURIComponent(value);
        } catch (err) {
            return value;
        }
    },

    /**
     * Decode html entities. e.g.: &lt; becomes <
     * @param {String} str the html string to decode entities from.
     * @return {String} the input html with entities decoded.
     */
    decodeEntities: function (str) {
        return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');
    },

    safeXML: (function () {
        var decodeComp = this.decodeURIComponent,
            reInvalid = /[<&>]/;

        return function (value, decode) {
            if (decode) {
                value = decodeComp(value);
            }
            if (reInvalid.test(value)) {
                return '<![CDATA[' + value + ']]>';
            }
            return value;
        };
    }()),

    /**
     * convert Object to XML
     * @param {Object} obj the Object to be converted to XML
     * @param {String} root the XML root (default = results)
     * @return {String} the XML
     */
    objToXML: function (obj, root) {
        var toXML,
            util = YSLOW.util,
            safeXML = util.safeXML,
            xml = '<?xml version="1.0" encoding="UTF-8"?>';

        toXML = function (o) {
            var item, value, i, len, val, type;

            for (item in o) {
                if (o.hasOwnProperty(item)) {
                    value = o[item];
                    xml += '<' + item + '>';
                    if (util.isArray(value)) {
                        for (i = 0, len = value.length; i < len; i += 1) {
                            val = value[i];
                            type = typeof val;
                            xml += '<item>';
                            if (type === 'string' || type === 'number') {
                                xml += safeXML(val, item === 'components');
                            } else {
                                toXML(val);
                            }
                            xml += '</item>';
                        }
                    } else if (util.isObject(value)) {
                        toXML(value);
                    } else {
                        xml += safeXML(value, item === 'u' || item === 'url');
                    }
                    xml += '</' + item + '>';
                }
            }
        };

        root = root || 'results';
        xml += '<' + root + '>';
        toXML(obj);
        xml += '</' + root + '>';

        return xml;
    },

    /**
     * Pretty print results
     * @param {Object} obj the Object with YSlow results
     * @return {String} the results in plain text (pretty printed)
     */
    prettyPrintResults: function (obj) {
        var pp,
            util = YSLOW.util,
            str = '',
            mem = {},

            dict = {
                v: 'version',
                w: 'size',
                o: 'overall score',
                u: 'url',
                r: '# of requests',
                s: 'space id',
                i: 'ruleset',
                lt: 'page load time',
                g: 'scores',
                w_c: 'page size (primed cache)',
                r_c: '# of requests (primed cache)',
                stats: 'statistics by component',
                stats_c: 'statistics by component (primed cache)',
                comps: 'components found on the page',
                components: 'offenders',
                cr: 'received cookie size',
                cs: 'set cookie size',
                resp: 'response time'
            },

            indent = function (n) {
                var arr,
                    res = mem[n];

                if (typeof res === 'undefined') {
                    arr = [];
                    arr.length = (4 * n) + 1;
                    mem[n] = res = arr.join(' ');
                }

                return res;
            };

        pp = function (o, level) {
            var item, value, i, len, val, type;

            for (item in o) {
                if (o.hasOwnProperty(item)) {
                    value = o[item];
                    str += indent(level) + (dict[item] || item) + ':';
                    if (util.isArray(value)) {
                        str += '\n';
                        for (i = 0, len = value.length; i < len; i += 1) {
                            val = value[i];
                            type = typeof val;
                            if (type === 'string' || type === 'number') {
                                str += indent(level + 1) +
                                    util.decodeURIComponent(val) + '\n';
                            } else {
                                pp(val, level + 1);
                                if (i < len - 1) {
                                    str += '\n';
                                }
                            }
                        }
                    } else if (util.isObject(value)) {
                        str += '\n';
                        pp(value, level + 1);
                    } else {
                        if (item === 'score' || item === 'o') {
                            value = util.prettyScore(value) + ' (' + value + ')';
                        }
                        if (item === 'w' || item === 'w_c' ||
                                item === 'size' || item === 'gzip' ||
                                item === 'cr' || item === 'cs') {
                            value = util.kbSize(value) + ' (' + value + ' bytes)';
                        }
                        str += ' ' + util.decodeURIComponent(value) + '\n';
                    }
                }
            }
        };

        pp(obj, 0);

        return str;
    },

    /**
     * Test result against a certain threshold for CI
     * @param {Object} obj the Object with YSlow results
     * @param {String|Number|Object} threshold The definition of OK (inclusive)
     *        Anything >= threshold == OK. It can be a number [0-100],
     *        a letter [A-F] as follows:
     *        100 >= A >= 90 > B >= 80 > C >= 70 > D >= 60 > E >= 50 > F >= 0 > N/A = -1
     *        It can also be a specific per rule. e.g:
     *        {overall: 80, ycdn: 65, ynumreq: 'B'}
     *        where overall is the common threshold to be
     *        used by all rules except those listed
     * @return {Array} the test result array containing each test result details:
     */
    testResults: function (obj, threshold) {
        var overall, g, grade, grades, score, commonScore, i, len,
            tests = [],
            scores = {
                a: 90,
                b: 80,
                c: 70,
                d: 60,
                e: 50,
                f: 0,
                'n/a': -1
            },
            yslow = YSLOW,
            util = yslow.util,
            isObj = util.isObject(threshold),
            rules = yslow.doc.rules,

            getScore = function (value) {
                var score = parseInt(value, 10);

                if (isNaN(score) && typeof value === 'string') {
                    score = scores[value.toLowerCase()];
                }

                // edge case for F or 0
                if (score === 0) {
                    return 0;
                }

                return score || overall || scores.b;
            },

            getThreshold = function (name) {
                if (commonScore) {
                    return commonScore;
                }

                if (!isObj) {
                    commonScore = getScore(threshold);
                    return commonScore;
                } else if (threshold.hasOwnProperty(name)) {
                    return getScore(threshold[name]);
                } else {
                    return overall || scores.b;
                }
            },

            test = function (score, ts, name, message, offenders) {
                var desc = rules.hasOwnProperty(name) && rules[name].name;

                tests.push({
                    ok: score >= ts,
                    score: score,
                    grade: util.prettyScore(score),
                    name: name,
                    description: desc || '',
                    message: message,
                    offenders: offenders
                });
            };

        // overall threshold (default b [80])
        overall = getThreshold('overall');

        // overall score
        test(obj.o, overall, 'overall score');

        // grades
        grades = obj.g;
        if (grades) {
            for (grade in grades) {
                if (grades.hasOwnProperty(grade)) {
                    g = grades[grade];
                    score = g.score;
                    if (typeof score === 'undefined') {
                        score = -1;
                    }
                    test(score, getThreshold(grade), grade,
                        g.message, g.components);
                }
            }
        }

        return tests;
    },

    /**
     * Format test results as TAP for CI
     * @see: http://testanything.org/wiki/index.php/TAP_specification
     * @param {Array} tests the arrays containing the test results from testResults.
     * @return {Object}:
     *    failures: {Number} total test failed,
     *    content: {String} the results as TAP plain text
     */
    formatAsTAP: function (results) {
        var i, res, line, offenders, j, lenJ,
            failures = 0,
            len = results.length,
            tap = [],
            util = YSLOW.util,
            decodeURI = util.decodeURIComponent;

        // tap version
        tap.push('TAP version 13');

        // test plan
        tap.push('1..' + len);

        for (i = 0; i < len; i += 1) {
            res = results[i];
            line = res.ok || res.score < 0 ? 'ok' : 'not ok';
            failures += (res.ok || res.score < 0) ? 0 : 1;
            line += ' ' + (i + 1) + ' ' + res.grade +
                ' (' + res.score + ') ' + res.name;
            if (res.description) {
                line += ': ' + res.description;
            }
            if (res.score < 0) {
                line += ' # SKIP score N/A';
            }
            tap.push(line);

            // message
            if (res.message) {
                tap.push('  ---');
                tap.push('  message: ' + res.message);
            }

            // offenders
            offenders = res.offenders;
            if (offenders) {
                lenJ = offenders.length;
                if (lenJ > 0) {
                    if (!res.message) {
                        tap.push('  ---');
                    }
                    tap.push('  offenders:');
                    for (j = 0; j < lenJ; j += 1) {
                        tap.push('    - "' +
                            decodeURI(offenders[j]) + '"');
                    }
                }
            }

            if (res.message || lenJ > 0) {
                tap.push('  ...');
            }
        }

        return {
          failures: failures,
          content: tap.join('\n')
        };
    },

    /**
     * Format test results as JUnit XML for CI
     * @see: http://www.junit.org/
     * @param {Array} tests the arrays containing the test results from testResults.
     * @return {Object}:
     *    failures: {Number} total test failed,
     *    content: {String} the results as JUnit XML text
     */
    formatAsJUnit: function (results) {
        var i, res, line, offenders, j, lenJ,
            len = results.length,
            skipped = 0,
            failures = 0,
            junit = [],
            cases = [],
            util = YSLOW.util,
            decodeURI = util.decodeURIComponent,
            safeXML = util.safeXML,

            safeAttr = function (str) {
                return str
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            };

        for (i = 0; i < len; i += 1) {
            res = results[i];
            line = '    <testcase name="' + safeAttr(res.name +
                (res.description ? ': ' + res.description : '')) + '"';
            line += ' status="' + res.grade +
                ' (' + res.score + ')';
            if (res.ok) {
                cases.push(line + '"/>');
            } else {
                cases.push(line + '">');

                // skipped
                if (res.score < 0) {
                    skipped += 1;
                    cases.push('      <skipped>score N/A</skipped>');
                } else {
                  failures += 1;
                }

                line = '      <failure';
                if (res.message) {
                    line += ' message="' + safeAttr(res.message) + '"';
                }

                // offenders
                offenders = res.offenders;
                if (offenders) {
                    cases.push(line + '>');
                    lenJ = offenders.length;
                    for (j = 0; j < lenJ; j += 1) {
                        cases.push('        ' + safeXML(decodeURI(offenders[j])));
                    }
                    cases.push('      </failure>');
                } else {
                    cases.push(line + '/>');
                }

                cases.push('    </testcase>');
            }
        }

        // xml
        junit.push('<?xml version="1.0" encoding="UTF-8" ?>');

        // open test suites wrapper
        junit.push('<testsuites>');

        // open test suite w/ summary
        line = '  <testsuite name="YSlow" tests="' + len + '"';
        if (failures) {
            line += ' failures="' + failures + '"';
        }
        if (skipped) {
            line += ' skipped="' + skipped + '"';
        }
        line += '>';
        junit.push(line);

        // concat test cases
        junit = junit.concat(cases);

        // close test suite
        junit.push('  </testsuite>');

        // close test suites wrapper
        junit.push('</testsuites>');

        return {
            failures: failures,
            content: junit.join('\n')
        };
    },

    /**
     *  Try to find a spaceid in the HTML document source.
     * @param {YSLOW.ComponentSet} cset Component set.
     * @return spaceID string
     * @type string
     */
    getPageSpaceid: function (cset) {
        var sHtml, aDelims, aTerminators, i, sDelim, i1, i2, spaceid,
            reDigits = /^\d+$/,
            aComponents = cset.getComponentsByType('doc');

        if (aComponents[0] && typeof aComponents[0].body === 'string' && aComponents[0].body.length > 0) {
            sHtml = aComponents[0].body; // assume the first "doc" is the original HTML doc
            aDelims = ["%2fE%3d", "/S=", "SpaceID=", "?f=", " sid="]; // the beginning delimiter
            aTerminators = ["%2fR%3d", ":", " ", "&", " "]; // the terminating delimiter
            // Client-side counting (yzq) puts the spaceid in it as "/E=95810469/R=" but it's escaped!
            for (i = 0; i < aDelims.length; i += 1) {
                sDelim = aDelims[i];
                if (-1 !== sHtml.indexOf(sDelim)) { // if the delimiter is present
                    i1 = sHtml.indexOf(sDelim) + sDelim.length; // skip over the delimiter
                    i2 = sHtml.indexOf(aTerminators[i], i1); // find the terminator
                    if (-1 !== i2 && (i2 - i1) < 15) { // if the spaceid is < 15 digits
                        spaceid = sHtml.substring(i1, i2);
                        if (reDigits.test(spaceid)) { // make sure it's all digits
                            return spaceid;
                        }
                    }
                }
            }
        }

        return "";
    },

    /**
     *  Dynamically add a stylesheet to the document.
     * @param {String} url URL of the css file
     * @param {Document} doc Documnet object
     * @return CSS element
     * @type HTMLElement
     */
    loadCSS: function (url, doc) {
        var newCss;

        if (!doc) {
            YSLOW.util.dump('YSLOW.util.loadCSS: doc is not specified');
            return '';
        }

        newCss = doc.createElement("link");
        newCss.rel = "stylesheet";
        newCss.type = "text\/css";
        newCss.href = url;
        doc.body.appendChild(newCss);

        return newCss;
    },

    /**
     * Open a link.
     * @param {String} url URL of page to be opened.
     */
    openLink: function (url) {
        if (YSLOW.util.Preference.getPref("browser.link.open_external") === 3) {
            gBrowser.selectedTab = gBrowser.addTab(url);
        } else {
            window.open(url, " blank");
        }
    },

    /**
     * Sends a URL to smush.it for optimization
     * Example usage:
     * <code>YSLOW.util.smushIt('http://smush.it/css/skin/screenshot.png', function(resp){alert(resp.dest)});</code>
     * This code alerts the path to the optimized result image.
     *
     * @param {String} imgurl URL of the image to optimize
     * @param {Function} callback Callback function that accepts an object returned from smush.it
     */
    smushIt: function (imgurl, callback) {
        var xhr,
            smushurl = this.getSmushUrl(),
            url = smushurl + '/ws.php?img=' + encodeURIComponent(imgurl),
            req = YSLOW.util.getXHR();

        req.open('GET', url, true);
        req.onreadystatechange = function (e) {
            xhr = (e ? e.target : req);
            if (xhr.readyState === 4) {
                callback(JSON.parse(xhr.responseText));
            }
        };
        req.send(null);
    },

    /**
     * Get SmushIt server URL.
     * @return URL of SmushIt server.
     * @type String
     */
    getSmushUrl: function () {
        var g_default_smushit_url = 'http://www.smushit.com/ysmush.it';

        return YSLOW.util.Preference.getPref('smushItURL', g_default_smushit_url) + '/';
    },

    /**
     * Create new tab and return its document object
     * @return document object of the new tab content.
     * @type Document
     */
    getNewDoc: function () {
        var generatedPage = null,
            request = new XMLHttpRequest();

        getBrowser().selectedTab = getBrowser().addTab('about:blank');
        generatedPage = window;
        request.open("get", "about:blank", false);
        request.overrideMimeType('text/html');
        request.send(null);

        return generatedPage.content.document;
    },

    /**
     * Make absolute url.
     * @param url
     * @param base href
     * @return absolute url built with base href.
     */
    makeAbsoluteUrl: function (url, baseHref) {
        var hostIndex, path, lpath, protocol;

        if (typeof url === 'string' && baseHref) {
            hostIndex = baseHref.indexOf('://');
            protocol = baseHref.slice(0, 4);
            if (url.indexOf('://') < 0 && (protocol === 'http' ||
                    protocol === 'file')) {
                // This is a relative url
                if (url.slice(0, 1) === '/') {
                    // absolute path
                    path = baseHref.indexOf('/', hostIndex + 3);
                    if (path > -1) {
                        url = baseHref.slice(0, path) + url;
                    } else {
                        url = baseHref + url;
                    }
                } else {
                    // relative path
                    lpath = baseHref.lastIndexOf('/');
                    if (lpath > hostIndex + 3) {
                        url = baseHref.slice(0, lpath + 1) + url;
                    } else {
                        url = baseHref + '/' + url;
                    }
                }
            }
        }

        return url;
    },

    /**
     * Prevent event default action
     * @param {Object} event the event to prevent default action from
     */
    preventDefault: function (event) {
        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },

    /**
     * String Trim
     * @param string s the string to remove trail and header spaces
     */
    trim: function (s) {
        try {
            return (s && s.trim) ? s.trim() : s.replace(/^\s+|\s+$/g, '');
        } catch (e) {
            return s;
        }
    },

    /**
     * Add Event Listener
     * @param HTMLElement el the element to add an event listener
     * @param string ev the event name to be added
     * @param function fn the function to be invoked by event listener
     */
    addEventListener: function (el, ev, fn) {
        var util = YSLOW.util;

        if (el.addEventListener) {
            util.addEventListener = function (el, ev, fn) {
                el.addEventListener(ev, fn, false);
            };
        } else if (el.attachEvent) {
            util.addEventListener = function (el, ev, fn) {
                el.attachEvent('on' + ev, fn);
            };
        } else {
            util.addEventListener = function (el, ev, fn) {
                el['on' + ev] = fn;
            };
        }
        util.addEventListener(el, ev, fn);
    },

    /**
     * Remove Event Listener
     * @param HTMLElement el the element to remove event listener from
     * @param string ev the event name to be removed
     * @param function fn the function invoked by the removed listener
     */
    removeEventListener: function (el, ev, fn) {
        var util = YSLOW.util;

        if (el.removeEventListener) {
            util.removeEventListener = function (el, ev, fn) {
                el.removeEventListener(ev, fn, false);
            };
        } else if (el.detachEvent) {
            util.removeEventListener = function (el, ev, fn) {
                el.detachEvent('on' + ev, fn);
            };
        } else {
            util.removeEventListener = function (el, ev, fn) {
                delete el['on' + ev];
            };
        }
        util.removeEventListener(el, ev, fn);
    },

    /**
     * Normalize currentTarget
     * @param evt the event received
     * @return HTMLElement the normilized currentTarget
     */
    getCurrentTarget: function (evt) {
        return evt.currentTarget || evt.srcElement;
    },

    /**
     * Normalize target
     * @param evt the event received
     * @return HTMLElement the normilized target
     */
    getTarget: function (evt) {
        return evt.target || evt.srcElement;
    },

    /**
     * Get all inline elements (style and script) from a document
     * @param doc (optional) the document to get all inline elements
     * @param head (optional) the head node to get inline elements, ignores doc
     * @param body (optional) the body node to get inline elements, ignores doc
     * @return object with scripts and styles arrays with the following info:
     * containerNode: either head or body
     * body: the innerHTML content
     */
    getInlineTags: function (doc, head, body) {
        var styles, scripts,

            loop = function (node, tag, contentNode) {
                var i, len, els, el,
                    objs = [];

                if (!node) {
                    return objs;
                }

                els = node.getElementsByTagName(tag);
                for (i = 0, len = els.length; i < len; i += 1) {
                    el = els[i];
                    if (!el.src) {
                        objs.push({
                            contentNode: contentNode,
                            body: el.innerHTML
                        });
                    }
                }

                return objs;
            };

        head = head || (doc && doc.getElementsByTagName('head')[0]);
        body = body || (doc && doc.getElementsByTagName('body')[0]);

        styles = loop(head, 'style', 'head');
        styles = styles.concat(loop(body, 'style', 'body'));
        scripts = loop(head, 'script', 'head');
        scripts = scripts.concat(loop(body, 'script', 'body'));

        return {
            styles: styles,
            scripts: scripts
        };
    },

    /**
     * Count all DOM elements from a node
     * @param node the root node to count all DOM elements from
     * @return number of DOM elements found on given node
     */
    countDOMElements: function (node) {
        return (node && node.getElementsByTagName('*').length) || 0;
    },

    /**
     * Get cookies from a document
     * @param doc the document to get the cookies from
     * @return the cookies string
     */
    getDocCookies: function (doc) {
        return (doc && doc.cookie) || '';
    },

    /**
     * identifies injected elements (js, css, iframe, flash, image)
     * @param doc the document to create/manipulate dom elements 
     * @param comps the component set components
     * @param body the root (raw) document body (html)
     * @return the same components with injected info
     */
    setInjected: function (doc, comps, body) {
        var i, len, els, el, src, comp, found, div,
            nodes = {};

        if (!body) {
            return comps;
        }

        // har uses a temp div already, reuse it
        if (typeof doc.createElement === 'function') {
            div = doc.createElement('div');
            div.innerHTML = body;
        } else {
            div = doc;
        }

        // js
        els = div.getElementsByTagName('script');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.src || el.getAttribute('src');
            if (src) {
                nodes[src] = {
                    defer: el.defer || el.getAttribute('defer'),
                    async: el.async || el.getAttribute('async')
                };
            }
        }

        // css
        els = div.getElementsByTagName('link');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.href || el.getAttribute('href');
            if (src && (el.rel === 'stylesheet' || el.type === 'text/css')) {
                nodes[src] = 1;
            }
        }

        // iframe
        els = div.getElementsByTagName('iframe');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.src || el.getAttribute('src');
            if (src) {
                nodes[src] = 1;
            }
        }

        // flash
        els = div.getElementsByTagName('embed');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.src || el.getAttribute('src');
            if (src) {
                nodes[src] = 1;
            }
        }
        els = div.getElementsByTagName('param');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.value || el.getAttribute('value');
            if (src) {
                nodes[src] = 1;
            }
        }

        // image
        els = div.getElementsByTagName('img');
        for (i = 0, len = els.length; i < len; i += 1) {
            el = els[i];
            src = el.src || el.getAttribute('src');
            if (src) {
                nodes[src] = 1;
            }
        }

        // loop components and look it up on nodes
        // if not found then component was injected
        // for js, set defer and async attributes
        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (comp.type === 'js' || comp.type === 'css' ||
                    comp.type === 'flash' || comp.type === 'flash' ||
                    comp.type === 'image') {
                found = nodes[comp.url];
                comp.injected = !found;
                if (comp.type === 'js' && found) {
                    comp.defer = found.defer;
                    comp.async = found.async;
                }
            }
        }

        return comps;
    },

    // default setTimeout, FF overrides this with proprietary Mozilla timer
    setTimer: function (callback, delay) {
        setTimeout(callback, delay);
    }
};

/**
 * Class that implements the observer pattern.
 *
 * Oversimplified usage:
 * <pre>
 * // subscribe
 * YSLOW.util.event.addListener('martiansAttack', alert);
 * // fire the event
 * YSLOW.util.event.fire('martiansAttack', 'panic!');
 * </pre>
 *
 * More real life usage
 * <pre>
 * var myobj = {
 *   default_action: alert,
 *   panic: function(event) {
 *     this.default_action.call(null, event.message);
 *   }
 * };
 *
 * // subscribe
 * YSLOW.util.event.addListener('martiansAttack', myobj.panic, myobj);
 * // somewhere someone fires the event
 * YSLOW.util.event.fire('martiansAttack', {date: new Date(), message: 'panic!'});
 *
 *
 * @namespace YSLOW.util
 * @class event
 * @static
 */
YSLOW.util.event = {
    /**
     * Hash of subscribers where the key is the event name and the value is an array of callbacks-type objects
     * The callback objects have keys "callback" which is the function to be called and "that" which is the value
     * to be assigned to the "this" object when the function is called
     */
    subscribers: {},

    /**
     * Adds a new listener
     *
     * @param {String} event_name Name of the event
     * @param {Function} callback A function to be called when the event fires
     * @param {Object} that Object to be assigned to the "this" value of the callback function
     */
    addListener: function (eventName, callback, that) {
        var subs = this.subscribers,
            subscribers = subs[eventName];

        if (!subscribers) {
            subscribers = subs[eventName] = [];
        }
        subscribers.push({
            callback: callback,
            that: that
        });
    },

    /**
     * Removes a listener
     *
     * @param {String} event_name Name of the event
     * @param {Function} callback The callback function that was added as a listener
     * @return {Boolean} TRUE is the listener was removed successfully, FALSE otherwise (for example in cases when the listener doesn't exist)
     */
    removeListener: function (eventName, callback) {
        var i,
            subscribers = this.subscribers[eventName],
            len = (subscribers && subscribers.length) || 0;

        for (i = 0; i < len; i += 1) {
            if (subscribers[i].callback === callback) {
                subscribers.splice(i, 1);
                return true;
            }
        }

        return false;
    },

    /**
     * Fires the event
     *
     * @param {String} event_nama Name of the event
     * @param {Object} event_object Any object that will be passed to the subscribers, can be anything
     */
    fire: function (event_name, event_object) {
        var i, listener;

        if (typeof this.subscribers[event_name] === 'undefined') {
            return false;
        }

        for (i = 0; i < this.subscribers[event_name].length; i += 1) {
            listener = this.subscribers[event_name][i];
            try {
                listener.callback.call(listener.that, event_object);
            } catch (e) {}
        }

        return true;
    }

};

/**
 * Class that implements setting and unsetting preferences
 *
 * @namespace YSLOW.util
 * @class Preference
 * @static
 *
 */
YSLOW.util.Preference = {

    /**
     * @private
     */
    nativePref: null,

    /**
     * Register native preference mechanism.
     */
    registerNative: function (o) {
        this.nativePref = o;
    },

    /**
     * Get Preference with default value.  If the preference does not exist,
     * return the passed default_value.
     * @param {String} name name of preference
     * @return preference value or default value.
     */
    getPref: function (name, default_value) {
        if (this.nativePref) {
            return this.nativePref.getPref(name, default_value);
        }
        return default_value;
    },

    /**
     * Get child preference list in branch.
     * @param {String} branch_name
     * @return array of preference values.
     * @type Array
     */
    getPrefList: function (branch_name, default_value) {
        if (this.nativePref) {
            return this.nativePref.getPrefList(branch_name, default_value);
        }
        return default_value;
    },

    /**
     * Set Preference with passed value.
     * @param {String} name name of preference
     * @param {value type} value value to be used to set the preference
     */
    setPref: function (name, value) {
        if (this.nativePref) {
            this.nativePref.setPref(name, value);
        }
    },

    /**
     * Delete Preference with passed name.
     * @param {String} name name of preference to be deleted
     */
    deletePref: function (name) {
        if (this.nativePref) {
            this.nativePref.deletePref(name);
        }
    }
};
