/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var files, dict,
    prefix = '',
    harContent = '',
    stdin = process.stdin,
    fs = require('fs'),
    http = require('http'),
    url = require('url'),
    YSLOW = require('yslow').YSLOW,
    doc = require('jsdom').jsdom(),
    program = require('commander'),
    util = YSLOW.util,

    /**
     * Show error and check for proces exit.
     * @param {Error|String} err The error object or string to be displayed.
     */
    showError = function (err) {
        prettyPrint(err);
        process.exit(1);
    },

    /**
     * Convert object to string.
     * @param {Object} obj Object to be converter into specified format.
     * @return {String} the output in the specified format param.
     */
    objToStr = function (obj) {
        var out = 'invalid output format';

        switch (program.format) {
        case 'json':
            out = JSON.stringify(obj);
            break;
        case 'xml':
            out = util.objToXML(obj);
            break;
        case 'plain':
            out = util.prettyPrintResults(obj);
            break;
        }

        return out;
    },

    /**
     * Pretty print results/info/dictionary in the specified format param.
     * @param {Object|String|Array} contents Results to be printed, it can be
     *        either String or Object or an Array of results.
     */
    prettyPrint = function (contents) {
        [].concat(contents).forEach(function (content) {
            console.log(typeof content === 'string'
                ? content
                : objToStr(content)
            );
        }); 
    },

    /**
     * Send beacon.
     * @param {Object|String} content The YSlow results to be beaconed.
     */
    sendBeacon = function (content) {
        var options, req,
            beacon = program.beacon,
            
            // request callback (response)
            response = function (res) {
                if (program.verbose) {
                    info = {
                        'status': res.statusCode,
                        'headers': res.headers,
                        'body': ''
                    };
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        info.body += chunk;
                    });
                    res.on('end', function () {
                        prettyPrint([content, info]);
                    });
                } else {
                    prettyPrint(content);
                }
            };
        
        // normalize beacon url
        if (beacon.indexOf('http') !== 0) {
            prefix = 'http:';
            if (beacon.indexOf('//') !== 0) {
                prefix += '//';
            }
        }
        beacon = url.parse(prefix + beacon);

        // set request options
        options = {
            host: beacon.hostname, 
            port: beacon.port || 80,
            path: beacon.pathname + (beacon.search || ''),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Content-Length': content.length
            }
        };

        // build request 
        req = http.request(options, response);

        // report errors
        req.on('error', function (e) {
            showError('problem with request: ' + e.message);
        });

        // write data to request body
        req.write(content);
        req.end();
    },

    /* Run YSlow.
     * @param {Object} har
     */
    runYSlow = function (har) {
        var res, content;

        if (!har) {
            return;
        }

        try {
            res = YSLOW.harImporter.run(doc, har, program.ruleset);
            content = util.getResults(res.context, program.info);
            if (dict) {
                content.dictionary = dict;
            }
            
            if (program.beacon) {
                sendBeacon(objToStr(content));
            } else {
                prettyPrint(content);
            }
        } catch (err) {
            showError(err);
        }
    },
    
    /**
     * Read and parse HAR file
     * @param {Error} err
     * @param {String} data
     */
    readFile = function (err, data) {
        var har;

        if (err || !data) {
            return showError(err || 'no data');
        }

        try {
            har = JSON.parse(data);
        } catch (err2) {
            showError(err2);
        }

        runYSlow(har);
    };

// command line
program
    .version(YSLOW.version)
    .usage('[options] [file ...]')
    .option('-i, --info <info>', 'specify the information to display/log (basic|grade|stats|comps|all) [basic]', 'basic')
    .option('-f, --format <format>', 'specify the output results format (json|xml|plain) [json]', 'json')
    .option('-r, --ruleset <ruleset>', 'specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]', 'ydefault')
    .option('-b, --beacon <url>', 'specify an URL to log the results')
    .option('-d, --dict', 'include dictionary of results fields')
    .option('-v, --verbose', 'output beacon response information')
    .on('--help', function () {
        var n = program.name;

        console.log([
            '  Examples:',
            '',
            '    ' + n + ' file.har',
            '    ' + n + ' -i grade -f xml -b http://server.com/beacon file1.har file2.har',
            '    ' + n + ' --info all --format plain /tmp/*.har',
            '    ' + n + ' -i basic --rulseset yslow1 -d < file.har',
            '    curl example.com/file.har | ' + n + ' -i grade -b http://server.com/beacon -v',
            '    curl www.webpagetest.org/export.php?test=ID | ' + n + ' -i grade | curl www.showslow.com/beacon/yslow -d @-',
            '',
            '  More Info:',
            '',
            '     http://wh.yslow.org/yslow_beacon'
        ].join('\n'));
    });
program.parse(process.argv);

// dictionary
if (program.dict && program.format !== 'plain') {
    dict = util.getDict(program.info, program.ruleset);
}

// check for type of input
files = program.args;
if (!files.length) {
    // stdin
    stdin.resume();
    stdin.on('data', function (chunk) {
        harContent += chunk;
    });
    stdin.on('end', function () {
        runYSlow(JSON.parse(harContent));
    });
} else {
    // files loop
    files.forEach(function (filename) {
        fs.readFile(filename, 'utf-8', readFile);
    });
}
