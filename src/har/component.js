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
        };

    parseEntry(o.entry);
};
