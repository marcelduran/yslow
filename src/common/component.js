/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, plusplus: true, bitwise: true, browser: true, maxerr: 50, indent: 4 */

/**
 * @namespace YSLOW
 * @class Component
 * @constructor
 */
YSLOW.Component = function (url, type, parent_set, o) {
    var obj = o && o.obj,
        comp = (o && o.comp) || {};

    /**
     * URL of the component
     * @type String
     */
    this.url = url;

    /**
     * Component type, one of the following:
     * <ul>
     *  <li>doc</li>
     *  <li>js</li>
     *  <li>css</li>
     *  <li>...</li>
     * </ul>
     * @type String
     */
    this.type = type;

    /**
     * Parent component set.
     */
    this.parent = parent_set;

    this.headers = {};
    this.raw_headers = '';
    this.req_headers = null;
    this.body = '';
    this.compressed = false;
    this.expires = undefined; // to be replaced by a Date object
    this.size = 0;
    this.status = 0;
    this.is_beacon = false;
    this.method = 'unknown';
    this.cookie = '';
    this.respTime = null;
    this.after_onload = false;

    // component object properties
    // e.g. for image, image element width, image element height, actual width, actual height
    this.object_prop = undefined;

    // construction part
    if (type === undefined) {
        this.type = 'unknown';
    }

    this.get_info_state = 'NONE';

    if (obj && type === 'image' && obj.width && obj.height) {
        this.object_prop = {
            'width': obj.width,
            'height': obj.height
        };
    }

    if (comp.containerNode) {
        this.containerNode = comp.containerNode;
    }

    this.setComponentDetails(o);
};

YSLOW.Component.prototype.setComponentDetails = function (o) {
    var comp = this,
        
        // firefox
        parseResponse = function (response) {
            var headerName;

            // copy from the response object
            comp.status = response.status;
            for (headerName in response.headers) {
                if (response.headers.hasOwnProperty(headerName)) {
                    comp.headers[headerName.toLowerCase()] = response.headers[headerName];
                }
            }
            comp.raw_headers = response.raw_headers;
            if (response.req_headers) {
                comp.req_headers = {};
                for (headerName in response.req_headers) {
                    if (response.req_headers.hasOwnProperty(headerName)) {
                        comp.req_headers[headerName.toLowerCase()] = response.req_headers[headerName];
                    }
                }
            }
            comp.body = (response.body !== null) ? response.body : '';
            if (typeof response.method === 'string') {
                comp.method = response.method;
            }
            if ((comp.type === 'unknown' && response.type !== undefined) || (comp.type === 'doc' && (response.type !== undefined && response.type !== 'unknown'))) {
                comp.type = response.type;
            }
            // for security checking
            comp.response_type = response.type;
            if (typeof response.cookie === 'string') {
                comp.cookie = response.cookie;
            }
            if (typeof response.size === 'number' && response.size > 0) {
                comp.nsize = response.size;
            }
            if (typeof response.respTime !== 'undefined') {
                comp.respTime = response.respTime;
            }
            if (typeof response.startTimestamp !== 'undefined' && comp.parent.onloadTimestamp !== null) {
                comp.after_onload = (response.startTimestamp > comp.parent.onloadTimestamp);
            } else if (typeof response.after_onload !== 'undefined') {
                comp.after_onload = response.after_onload;
            }

            comp.populateProperties(true);

            comp.get_info_state = 'DONE';

            // notify parent ComponentSet that this component has gotten net response.
            comp.parent.onComponentGetInfoStateChange({
                'comp': comp,
                'state': 'DONE'
            });
        },
    
        // parse HAR entry
        parseEntry = function (entry) {
            var i, header, cookie, len,
                response = entry.response,
                request = entry.request;

            // copy from the response object
            comp.status = response.status;
            comp.headers = {};
            comp.raw_headers = '';
            for (i = 0, len = response.headers.length; i < len; i += 1) {
                header = response.headers[i];
                comp.headers[header.name.toLowerCase()] = header.value;
                comp.raw_headers += header.name + ': ' + header.value + '\n';
            }
            comp.req_headers = {};
            for (i = 0, len = request.headers.length; i < len; i += 1) {
                header = request.headers[i];
                comp.req_headers[header.name.toLowerCase()] = header.value;
            }
            comp.method = request.method;
            if (response.content && response.content.text) {
                comp.body = response.content.text;
            } else {
                // no body provided, getting size at least and mocking empty string content
                comp.body = {
                    toString: function () {return '';},
                    length: response.content.size || 0
                };  
            }   
            // for security checking
            comp.response_type = comp.type;
            comp.cookie = (comp.headers['set-cookie'] || '') + (comp.req_headers['cookie'] || '');
            comp.nsize = parseInt(comp.headers['content-length'], 10) ||
                response.bodySize || response.content.size;
            comp.respTime = entry.time;
            comp.after_onload = (new Date(entry.startedDateTime)
                .getTime()) > comp.parent.onloadTimestamp;

            // populate properties ignoring redirect
            // resolution and image request
            comp.populateProperties(false, true);

            comp.get_info_state = 'DONE';

            // notify parent ComponentSet that this component has gotten net response.
            comp.parent.onComponentGetInfoStateChange({
                'comp': comp,
                'state': 'DONE'
            });
        },

        // parse component (chrome and bookmarklet)
        parseComponent = function (component) {
            var headerName, h, i, len, m,
                reHeader = /^([^:]+):\s*([\s\S]+)$/,
                headers = component.rawHeaders;

            // copy from the response object
            comp.status = component.status;
            comp.raw_headers = headers;
            if (component.headers) {
                for (headerName in component.headers) {
                    if (component.headers.hasOwnProperty(headerName)) {
                        comp.headers[headerName.toLowerCase()] = component.headers[headerName];
                    }
                }
            } else if (typeof headers === 'string') {
                h = headers.split('\n');
                for (i = 0, len = h.length; i < len; i += 1) {
                    m = reHeader.exec(h[i]);
                    if (m) {
                        comp.headers[m[1].toLowerCase()] = m[2];
                    }
                }
            }
            comp.req_headers = {};
            comp.method = 'GET';
            comp.body = component.content || component.body || '';
            comp.type = component.type;
            // for security checking
            comp.response_type = comp.type;
            comp.cookie = comp.headers['set-cookie'] || '';
            comp.nsize = parseInt(comp.headers['content-length'], 10) ||
                comp.body.length;
            comp.respTime = 0;
            if (component.after_onload) {
                comp.after_onload = component.after_onload;
            }
            if (typeof component.injected !== 'undefined') {
                comp.injected = component.injected;
            }
            if (typeof component.defer !== 'undefined') {
                comp.defer = component.defer;
            }
            if (typeof component.async !== 'undefined') {
                comp.async = component.async;
            }

            comp.populateProperties();

            comp.get_info_state = 'DONE';

            // notify parent ComponentSet that this
            // component has gotten net response.
            comp.parent.onComponentGetInfoStateChange({
                'comp': comp,
                'state': 'DONE'
            });
        };

    if (o && o.component) {
        // chrome and bookmarklet
        parseComponent(o.component);
    } else if (o && o.entry) {
        // har
        parseEntry(o.entry);
    } else {
        // firefox
        YSLOW.net.getInfo(this.url, parseResponse,
            (this.type.indexOf('image') > -1));
    }
};

/**
 * Return the state of getting detail info from the net.
 */
YSLOW.Component.prototype.getInfoState = function () {
    return this.get_info_state;
};

YSLOW.Component.prototype.populateProperties = function (resolveRedirect, ignoreImgReq) {
    var comp, encoding, expires, content_length, img_src, obj, dataUri,
        that = this,
        NULL = null,
        UNDEF = 'undefined';

    // check location
    // bookmarklet and har already handle redirects
    if (that.headers.location && resolveRedirect) {
        // Add a new component.
        comp = that.parent.addComponentNoDuplicate(that.headers.location,
            (that.type !== 'redirect' ? that.type : 'unknown'), that.url);
        if (comp && that.after_onload) {
            comp.after_onload = true;
        }
        that.type = 'redirect';
    }

    content_length = that.headers['content-length'];

    // gzip, deflate
    encoding = YSLOW.util.trim(that.headers['content-encoding']);
    if (encoding === 'gzip' || encoding === 'deflate') {
        that.compressed = encoding;
        that.size = (that.body.length) ? that.body.length : NULL;
        if (content_length) {
            that.size_compressed = parseInt(content_length, 10) ||
                content_length;
        } else if (typeof that.nsize !== UNDEF) {
            that.size_compressed = that.nsize;
        } else {
            // a hack
            that.size_compressed = that.size / 3;
        }
    } else {
        that.compressed = false;
        that.size_compressed = NULL;
        if (content_length) {
            that.size = parseInt(content_length, 10);
        } else if (typeof that.nsize !== UNDEF) {
            that.size = parseInt(that.nsize, 10);
        } else {
            that.size = that.body.length;
        }
    }

    // size check/correction, @todo be more precise here
    if (!that.size) {
        if (typeof that.nsize !== UNDEF) {
            that.size = that.nsize;
        } else {
            that.size = that.body.length;
        }
    }
    that.uncompressed_size = that.body.length;

    // expiration based on either Expires or Cache-Control headers
    expires = that.headers.expires;
    if (expires && expires.length > 0) {
        // set expires as a JS object
        that.expires = new Date(expires);
        if (that.expires.toString() === 'Invalid Date') {
            that.expires = that.getMaxAge();
        }
    } else {
        that.expires = that.getMaxAge();
    }

    // compare image original dimensions with actual dimensions, data uri is
    // first attempted to get the orginal dimension, if it fails (btoa) then
    // another request to the orginal image is made
    if (that.type === 'image' && !ignoreImgReq) {
        if (typeof Image !== UNDEF) {
            obj = new Image();
        } else {
            obj = document.createElement('img');
        }
        if (that.body.length) {
            img_src = 'data:' + that.headers['content-type'] + ';base64,' +
                YSLOW.util.base64Encode(that.body);
            dataUri = 1;
        } else {
            img_src = that.url;
        }
        obj.onerror = function () {
            obj.onerror = NULL;
            if (dataUri) {
                obj.src = that.url;
            }
        };
        obj.onload = function () {
            obj.onload = NULL;
            if (obj && obj.width && obj.height) {
                if (that.object_prop) {
                    that.object_prop.actual_width = obj.width;
                    that.object_prop.actual_height = obj.height;
                } else {
                    that.object_prop = {
                        'width': obj.width,
                        'height': obj.height,
                        'actual_width': obj.width,
                        'actual_height': obj.height
                    };
                }
                if (obj.width < 2 && obj.height < 2) {
                    that.is_beacon = true;
                }
            }
        };
        obj.src = img_src;
    }
};

/**
 *  Return true if this object has a last-modified date significantly in the past.
 */
YSLOW.Component.prototype.hasOldModifiedDate = function () {
    var now = Number(new Date()),
        modified_date = this.headers['last-modified'];

    if (typeof modified_date !== 'undefined') {
        // at least 1 day in the past
        return ((now - Number(new Date(modified_date))) > (24 * 60 * 60 * 1000));
    }

    return false;
};

/**
 * Return true if this object has a far future Expires.
 * @todo: make the "far" interval configurable
 * @param expires Date object
 * @return true if this object has a far future Expires.
 */
YSLOW.Component.prototype.hasFarFutureExpiresOrMaxAge = function () {
    var expires_in_seconds,
        now = Number(new Date()),
        minSeconds = YSLOW.util.Preference.getPref('minFutureExpiresSeconds', 2 * 24 * 60 * 60),
        minMilliSeconds = minSeconds * 1000;

    if (typeof this.expires === 'object') {
        expires_in_seconds = Number(this.expires);
        if ((expires_in_seconds - now) > minMilliSeconds) {
            return true;
        }
    }

    return false;
};

YSLOW.Component.prototype.getEtag = function () {
    return this.headers.etag || '';
};

YSLOW.Component.prototype.getMaxAge = function () {
    var index, maxage, expires,
        cache_control = this.headers['cache-control'];

    if (cache_control) {
        index = cache_control.indexOf('max-age');
        if (index > -1) {
            maxage = parseInt(cache_control.substring(index + 8), 10);
            if (maxage > 0) {
                expires = YSLOW.util.maxAgeToDate(maxage);
            }
        }
    }

    return expires;
};

/**
 * Return total size of Set-Cookie headers of this component.
 * @return total size of Set-Cookie headers of this component.
 * @type Number
 */
YSLOW.Component.prototype.getSetCookieSize = function () {
    // only return total size of cookie received.
    var aCookies, k,
        size = 0;

    if (this.headers && this.headers['set-cookie']) {
        aCookies = this.headers['set-cookie'].split('\n');
        if (aCookies.length > 0) {
            for (k = 0; k < aCookies.length; k += 1) {
                size += aCookies[k].length;
            }
        }
    }

    return size;
};

/**
 * Return total size of Cookie HTTP Request headers of this component.
 * @return total size of Cookie headers Request of this component.
 * @type Number
 */
YSLOW.Component.prototype.getReceivedCookieSize = function () {
    // only return total size of cookie sent.
    var aCookies, k,
        size = 0;

    if (this.cookie && this.cookie.length > 0) {
        aCookies = this.cookie.split('\n');
        if (aCookies.length > 0) {
            for (k = 0; k < aCookies.length; k += 1) {
                size += aCookies[k].length;
            }
        }
    }

    return size;
};
