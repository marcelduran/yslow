/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * Parse details (HTTP headers, content, etc) from
 * component response and set as properties.
 */
YSLOW.Component.prototype.setComponentDetails = function () {
    var comp = this,
        
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
        };

    YSLOW.net.getInfo(comp.url, parseResponse,
        (comp.type.indexOf('image') > -1));
};
