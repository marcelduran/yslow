/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * Parse details (HTTP headers, content, etc) from a
 * given source and set component properties.
 * @param o The object containing component details.
 */
YSLOW.Component.prototype.setComponentDetails = function (o) {
    var comp = this,
        
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

    parseComponent(o.component);
};
