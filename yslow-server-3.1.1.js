/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

'use strict';

var express = require('express'),
    YSLOW = require('yslow').YSLOW,
    doc = require('jsdom').jsdom(),
    http = require('http'),
    url = require('url'),
    fs = require('fs'),
    appPort = process.argv[2] || process.env.app_port || 15785,
    app = express.createServer(),

    reTrue = /^(true|1|yes)$/i,

    /**
     * Convert object to string in agiven format with appropriate mime-type.
     * @param {Object} obj Object to be converter into specified format.
     * @param {String} format The format to output string: json, xml, plain.
     * @return {Object} the output in the specified format
     *         param with appropriate mime-type.
     */
    objToStr = function (obj, format) {
        switch (format) {
        case 'xml':
            return {
                content: YSLOW.util.objToXML(obj),
                contentType: 'text/xml'
            };
        case 'plain':
            return {
                content: YSLOW.util.prettyPrintResults(obj),
                contentType: 'text/plain'
            };
        default:
            return {
                content: JSON.stringify(obj),
                contentType: 'application/json'
            };
        }
    },

    /**
     * The send results callback.
     * @param {Object} results The results to be sent,
     *        it should contain the contentType and content.
     * @param {Object} res The response object.
     */
    sendResults = function (results, res) {
        res.contentType(results.contentType);
        res.send(results.content);
    },

    /**
     * Send formatted error.
     * @param {Object} err The error object.
     * @param {Object} req The request that generated error.
     * @param {Object} res The response to send formatted error to.
     */
    sendError = function (err, req, res) {
        var i, output,
            errObj = {error: {}};

        // augment error object with source error info
        for (i in err) {
            if (err.hasOwnProperty(i)) {
                errObj.error[i] = err[i];
            }
        }

        output = objToStr(errObj, req.param('format', req.param('f', 'json')));
        sendResults(output, res);
    },

    /**
     * Send beacon.
     * @param {Object} results The YSlow results to be beaconed.
     * @param {Object} context The req/res context.
     */
    sendBeacon = function (results, context) {
        var options, req, prefix, beaconInfo,
            beacon = context.beacon,

            // request callback (response)
            response = function (res) {
                var info = {
                        'status': res.statusCode,
                        'headers': res.headers,
                        'body': ''
                    };
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    info.body += chunk;
                });
                res.on('end', function () {
                    // augment results with beacon response info
                    results.beacon = info;

                    // format and send results
                    results = objToStr(results, context.format);
                    sendResults(results, context.res);
                });
            };

        // normalize beacon url
        if (beacon.indexOf('http') !== 0) {
            prefix = 'http:';
            if (beacon.indexOf('//') !== 0) {
                prefix += '//';
            }
        }
        beacon = url.parse(prefix + beacon);

        // prepare beacon content
        if (results.hasOwnProperty('contentType')) {
            // already converted to string (fire beacon only)
            beaconInfo = results;
        } else {
            // to be converted into string ()
            beaconInfo = objToStr(results, context.format);
        }

        // set request options
        options = {
            host: beacon.hostname,
            port: beacon.port || 80,
            path: beacon.pathname + (beacon.search || ''),
            method: 'POST',
            headers: {
                'Content-Type': beaconInfo.contentType + '; charset=UTF-8',
                'Content-Length': beaconInfo.content.length
            }
        };

        // build request, in verbose mode, beacon response must be logged
        // then returned, otherwise just fire beacon.
        req = http.request(options, context.verbose ? response : null);

        // report errors
        req.on('error', function (e) {
            if (context.verbose) {
                sendError(new Error('Beacon' + e), context.req, context.res);
            }
        });

        // write data to request body
        req.write(beaconInfo.content);
        req.end();
    },

    /**
     * Run YSlow on HAR
     * @param {Object} har The HAR JSON input.
     * @param {Object} context The req/res context.
     */
    runYSlow = function (har, context) {
        var results;

        if (!har) {
            return;
        }

        try {
            // YSlow analysis
            results = YSLOW.harImporter.run(doc, har, context.ruleset);
            results = YSLOW.util.getResults(results.context, context.info);

            // dictionary
            if (context.dict && context.format !== 'plain') {
                results.dictionary = YSLOW.util.getDict(context.info,
                    context.ruleset);
            }
        } catch (err) {
            sendError(new Error('YSlow' + err), context.req, context.res);
            return;
        }

        // send beacon in verbose mode
        if (context.beacon && context.verbose) {
            sendBeacon(results, context);
        } else {
            results = objToStr(results, context.format);
            // send beacon
            if (context.beacon) {
                sendBeacon(results, context);
            }

            sendResults(results, context.res);
        }
    },

    /**
     * Help.
     * @param {String} url The URL requested.
     * @return {Object} The help info as an object.
     */
    help = function (url) {
        return {
            help: {
                usage: url + '?[options][&har=(<HAR as JSON string> | <URL to fetch HAR from> | <HAR file to upload>)]',
                options: [
                    'h | help:                 output usage information',
                    'V | version:              output the version number',
                    'i | info <info>:          specify the information to display/log (basic|grade|stats|comps|all) [basic]',
                    'f | format <format>:      specify the output results format (json|xml|plain) [json]',
                    'r | ruleset <ruleset>:    specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]',
                    'b | beacon <url>:         specify an URL to log the results',
                    'd | dict <true|false>:    include dictionary of results fields [false]',
                    'v | verbose <true|false>: output beacon response information [false]'
                ],
                examples: [
                    url + '?har=www.example.com/foo.har',
                    'curl \'' + url + '?info=grade&format=plain\' -F \'har=@localfile.har\'',
                    'curl \'' + url + '?ruleset=yblog\' -d \'har={"log":{"version":"1.1", ... }}\'',
                    url + '?info=all&dict=true&beacon=www.beaconserver.com&verbose=true',
                    url + '?har=www.webpagetest.org%2Fexport.php%3Ftest%3DTEST_ID&i=grade&b=www.showslow.com%2Fbeacon%2Fyslow%2F'
                ]
            }
        };
    },

    /**
     * Parse JSON HAR.
     * @param {String} har The HAR string to be parsed.
     * @param {Object} context The req/res context.
     * @param {Function} callback The callback to send parsed har data to.
     */
    parseHAR = function (har, context, callback) {
        try {
            har = JSON.parse(har);
            process.nextTick(function () {
                callback(har, context);
            });
        } catch (parseError) {
            sendError(new Error('HARParser' + parseError),
                context.req, context.res);
        }
    };

// configuration
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.errorHandler());
});

// main route good for POST and GET
app.all('/', function (req, res) {
    var prefix, harReq, output, har, context;

    try {
        har = req.param('har', req.files && req.files.har) || '';
        context = {
            // the req/res
            req: req,
            res: res,
            // yslow options
            info: req.param('info', req.param('i', 'basic')),
            ruleset: req.param('ruleset', req.param('r', 'ydefault')),
            format: req.param('format', req.param('f', 'json')),
            dict: reTrue.test(req.param('dict', req.param('d', ''))),
            beacon: req.param('beacon', req.param('b', false)),
            verbose: reTrue.test(req.param('verbose', req.param('v', '')))
        };

        // help
        if (reTrue.test(req.param('help', req.param('h', '')))) {
            output = objToStr(help('http://' + req.header('host') +
                req.route.path), context.format);
            res.contentType(output.contentType);
            res.send(output.content);
            return;
        }

        // version
        if (reTrue.test(req.param('version', req.param('V', '')))) {
            output = objToStr({version: YSLOW.version}, context.format);
            res.contentType(output.contentType);
            res.send(output.content);
            return;
        }

        if (har.path) {

            // from uploaded file
            fs.readFile(har.path, 'utf8', function (err, data) {
                if (err) {
                    sendError('HARFileReading' + err, req, res);
                    return;
                }
                parseHAR(data.toString(), context, runYSlow);
            });

        } else if (har.slice(0, 1) === '{') {

            // har as literal string
            parseHAR(har, context, runYSlow);

        } else if (har.length > 0) {

            // har from url
            if (har.indexOf('http') !== 0) {
                prefix = 'http:';
                if (har.indexOf('//') !== 0) {
                    prefix += '//';
                }
            }
            har = url.parse(prefix + har);

            // set request options
            harReq = {
                host: har.hostname,
                port: har.port || 80,
                path: har.pathname + (har.search || '')
            };

            // request remote har
            http.get(harReq, function (harRes) {
                var body = '';

                if (harRes.statusCode === 200) {
                    harRes.setEncoding('utf8');
                    harRes.on('data', function (chunk) {
                        body += chunk;
                    });
                    harRes.on('end', function () {
                        parseHAR(body, context, runYSlow);
                    });
                }
            }).on('error', function (reqError) {
                sendError(new Error('HARRequest' + reqError), req, res);
            });

        } else {
            // no har provided, print help and error
            output = help('http://' + req.header('host') +
                req.route.path);
            output.error = new Error('No HAR provided');
            output = objToStr(output, context.format);
            res.contentType(output.contentType);
            res.send(output.content);
        }
    } catch (err) {
        res.send(err);
    }
});

// error handling
app.error(sendError);

// only listen on $ node server.js
if (!module.parent) {
    app.listen(appPort);
    console.log('Express server listening on port %d', app.address().port);
}
