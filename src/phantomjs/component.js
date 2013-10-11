/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint browser: true, sloppy: true*/

/**
 * Parse details (HTTP headers, content, etc) from a
 * given source and set component properties.
 * @param o The object containing component details.
 */
YSLOW.Component.prototype.setComponentDetails = function (o) {
    var comp = this,

        parse = function (request, response) {
            var xhr;

            // copy from the response object
            comp.status = response.status;
            comp.headers = {};
            comp.raw_headers = '';
            response.headers.forEach(function (header) {
                comp.headers[header.name.toLowerCase()] = header.value;
                comp.raw_headers += header.name + ': ' + header.value + '\n';
            });
            comp.req_headers = {};
            request.headers.forEach(function (header) {
                comp.req_headers[header.name.toLowerCase()] = header.value;
            });
            comp.method = request.method;
            if (response.contentText) {
                comp.body = response.contentText;
            } else {
                // try to fetch component again using sync xhr while
                // content is not available through phantomjs.
                // see: http://code.google.com/p/phantomjs/issues/detail?id=158
                // and http://code.google.com/p/phantomjs/issues/detail?id=156
                try {
                    xhr = new XMLHttpRequest();
                    xhr.open('GET', comp.url, false);
                    xhr.send();
                    comp.body = xhr.responseText;
                } catch (err) {
                    comp.body = {
                        toString: function () {
                            return '';
                        },
                        length: response.bodySize || 0
                    };
                }
            }
            // for security checking
            comp.response_type = comp.type;
            comp.cookie = (comp.headers['set-cookie'] || '') +
                (comp.req_headers.cookie || '');
            comp.nsize = parseInt(comp.headers['content-length'], 10) ||
                response.bodySize;
            comp.respTime = response.time;
            comp.after_onload = (new Date(request.time)
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

    if (o.request && o.response) {
        parse(o.request, o.response);
    }
};
