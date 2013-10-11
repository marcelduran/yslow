/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

load('lib/yslow.js');
load('lib/env.rhino.1.2.js');

var content, har, res, doc,
    args = arguments;

window.onload = function () {
    doc = document;
    content = readFile(args[0]),
    har = JSON.parse(content, null);
    res = YSLOW.harImporter.run(doc, har, 'ydefault');
    content = YSLOW.util.getResults(res.context, 'basic');
    print(JSON.stringify(content));
};
window.location = 'lib/blank.html';
