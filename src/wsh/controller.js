/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

function readFile(filename) {
    var rline = [],
        fs = new ActiveXObject('Scripting.FileSystemObject'),
        f = fs.GetFile(filename);
        is = f.OpenAsTextStream(1, 0);

    while (!is.AtEndOfStream) {
       rline.push(is.ReadLine());
    }
    is.Close();
    return rline.join('');
}

var i, har, content, res, doc,
    objArgs = WScript.Arguments,
    ie = WScript.CreateObject('InternetExplorer.Application');

ie.Navigate('about:blank');
doc = ie.document;
for (i = 0; i < objArgs.length; i++) {
    content = readFile(objArgs(i));
    har = JSON.parse(content, null);
    res = YSLOW.harImporter.run(doc, har, 'ydefault');
    content = YSLOW.util.getResults(res.context, 'basic');
    WScript.Echo(JSON.stringify(content));
}
ie.Quit();

