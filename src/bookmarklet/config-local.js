/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YUI*/

YUI.add('yslow-config', function (Y) {
    Y.namespace('YSLOW').config = {
        /* make sure host has trailing slash */
        host: 'http://localhost:8000/',
        //host: 'http://secondbelong-lm.corp.yahoo.com:8000/',
        /* do no include scheme nor colon and double slashes */
        /* comment out to use the default provided by YUI YQL */
        //yql: 'staging.query.yahooapis.com/v1/public/yql?',
        /* yql opentable url */
        /* comment out to use the default YQL community table data.headers */
        //table: 'http://sandbox.javascriptrules.com/yql/data.headers.xml',
        js: '{{BOOKMARKLET_JS}}',
        css: '{{BOOKMARKLET_CSS}}'
    };
});
