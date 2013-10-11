/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global phantom, YSLOW*/
/*jslint browser: true, evil: true, sloppy: true, regexp: true*/

/**
 * JSLint is tolerating evil because there's a Function constructor needed to
 * inject the content coming from phantom arguments and page resources which is
 * later evaluated into the page in order to run YSlow.
 */

// For using yslow in phantomjs, see instructions @ http://yslow.org/phantomjs/

// parse args
var i, arg, page, urlCount, viewport,
    webpage = require('webpage'),
    args = phantom.args,
    len = args.length,
    urls = [],
    yslowArgs = {
        info: 'all',
        format: 'json',
        ruleset: 'ydefault',
        beacon: false,
        ua: false,
        viewport: false,
        headers: false,
        console: 0,
        threshold: 80,
        cdns: ''
    },
    unaryArgs = {
        help: false,
        version: false,
        dict: false,
        verbose: false
    },
    argsAlias = {
        i: 'info',
        f: 'format',
        r: 'ruleset',
        h: 'help',
        V: 'version',
        d: 'dict',
        u: 'ua',
        vp: 'viewport',
        c: 'console',
        b: 'beacon',
        v: 'verbose',
        t: 'threshold',
        ch: 'headers'
    };

// loop args
for (i = 0; i < len; i += 1) {
    arg = args[i];
    if (arg[0] !== '-') {
        // url, normalize if needed
        if (arg.indexOf('http') !== 0) {
            arg = 'http://' + arg;
        }
        urls.push(arg);
    }
    arg = arg.replace(/^\-\-?/, '');
    if (yslowArgs.hasOwnProperty(arg)) {
        // yslow argument
        i += 1;
        yslowArgs[arg] = args[i];
    } else if (yslowArgs.hasOwnProperty(argsAlias[arg])) {
        // yslow argument alias
        i += 1;
        yslowArgs[argsAlias[arg]] = args[i];
    } else if (unaryArgs.hasOwnProperty(arg)) {
        // unary argument
        unaryArgs[arg] = true;
    } else if (unaryArgs.hasOwnProperty(argsAlias[arg])) {
        // unary argument alias
        unaryArgs[argsAlias[arg]] = true;
    }
}
urlCount = urls.length;

// check for version
if (unaryArgs.version) {
    console.log('{{YSLOW_VERSION}}');
    phantom.exit();
}

// print usage
if (len === 0 || urlCount === 0 || unaryArgs.help) {
    console.log([
        '',
        '  Usage: phantomjs [phantomjs options] ' + phantom.scriptName + ' [yslow options] [url ...]',
        '',
        '  PhantomJS Options:',
        '',
        '    http://y.ahoo.it/phantomjs/options',
        '',
        '  YSlow Options:',
        '',
        '    -h, --help               output usage information',
        '    -V, --version            output the version number',
        '    -i, --info <info>        specify the information to display/log (basic|grade|stats|comps|all) [all]',
        '    -f, --format <format>    specify the output results format (json|xml|plain|tap|junit) [json]',
        '    -r, --ruleset <ruleset>  specify the YSlow performance ruleset to be used (ydefault|yslow1|yblog) [ydefault]',
        '    -b, --beacon <url>       specify an URL to log the results',
        '    -d, --dict               include dictionary of results fields',
        '    -v, --verbose            output beacon response information',
        '    -t, --threshold <score>  for test formats, the threshold to test scores ([0-100]|[A-F]|{JSON}) [80]',
        '                             e.g.: -t B or -t 75 or -t \'{"overall": "B", "ycdn": "F", "yexpires": 85}\'',
        '    -u, --ua "<user agent>"  specify the user agent string sent to server when the page requests resources',
        '    -vp, --viewport <WxH>    specify page viewport size WxY, where W = width and H = height [400x300]',
        '    -ch, --headers <JSON>    specify custom request headers, e.g.: -ch \'{"Cookie": "foo=bar"}\'',
        '    -c, --console <level>    output page console messages (0: none, 1: message, 2: message + line + source) [0]',
        '    --cdns "<list>"          specify comma separated list of additional CDNs',
        '',
        '  Examples:',
        '',
        '    phantomjs ' + phantom.scriptName + ' http://yslow.org',
        '    phantomjs ' + phantom.scriptName + ' -i grade -f xml www.yahoo.com www.cnn.com www.nytimes.com',
        '    phantomjs ' + phantom.scriptName + ' --info all --format plain --ua "MSIE 9.0" http://yslow.org',
        '    phantomjs ' + phantom.scriptName + ' -i basic --rulseset yslow1 -d http://yslow.org',
        '    phantomjs ' + phantom.scriptName + ' -i grade -b http://www.showslow.com/beacon/yslow/ -v yslow.org',
        '    phantomjs --load-plugins=yes ' + phantom.scriptName + ' -vp 800x600 http://www.yahoo.com',
        '    phantomjs ' + phantom.scriptName + ' -i grade -f tap -t 85 http://yslow.org',
        ''
    ].join('\n'));
    phantom.exit();
}

// set yslow unary args
yslowArgs.dict = unaryArgs.dict;
yslowArgs.verbose = unaryArgs.verbose;

// loop through urls
urls.forEach(function (url) {
    var page = webpage.create();

    page.resources = {};

    // allow x-domain requests, used to retrieve components content
    page.settings.webSecurityEnabled = false;

    // request
    page.onResourceRequested = function (req) {
        page.resources[req.url] = {
            request: req
        };
    };

    // response
    page.onResourceReceived = function (res) {
        var info,
            resp = page.resources[res.url].response;

        if (!resp) {
            page.resources[res.url].response = res;
        } else {
            for (info in res) {
                if (res.hasOwnProperty(info)) {
                    resp[info] = res[info];
                }
            }
        }
    };

    // enable console output, useful for debugging
    yslowArgs.console = parseInt(yslowArgs.console, 10) || 0;
    if (yslowArgs.console) {
        if (yslowArgs.console === 1) {
            page.onConsoleMessage = function (msg) {
                console.log(msg);
            };
            page.onError = function (msg) {
                console.error(msg);
            };
        } else {
            page.onConsoleMessage = function (msg, line, source) {
                console.log(JSON.stringify({
                    message: msg,
                    lineNumber: line,
                    source: source
                }, null, 4));
            };
            page.onError = function (msg, trace) {
                console.error(JSON.stringify({
                    message: msg,
                    stacktrace: trace
                }));
            };
        }
    } else {
        page.onError = function () {
            // catch uncaught error from the page
        };
    }

    // set user agent string
    if (yslowArgs.ua) {
        page.settings.userAgent = yslowArgs.ua;
    }

    // set page viewport
    if (yslowArgs.viewport) {
        viewport = yslowArgs.viewport.toLowerCase();
        page.viewportSize = {
            width: parseInt(viewport.slice(0, viewport.indexOf('x')), 10) ||
                page.viewportSize.width,
            height: parseInt(viewport.slice(viewport.indexOf('x') + 1), 10) ||
                page.viewportSize.height
        };
    }

    // set custom headers
    if (yslowArgs.headers) {
        try {
            page.customHeaders = JSON.parse(yslowArgs.headers);
        } catch (err) {
            console.log('Invalid custom headers: ' + err);
        }
    }

    // open page
    page.startTime = new Date();
    page.open(url, function (status) {
        var yslow, ysphantomjs, controller, evalFunc,
            loadTime, url, resp, output,
            exitStatus = 0,
            startTime = page.startTime,
            resources = page.resources;

        if (status !== 'success') {
            console.log('FAIL to load ' + url);
        } else {
            // page load time
            loadTime = new Date() - startTime;

            // set resources response time
            for (url in resources) {
                if (resources.hasOwnProperty(url)) {
                    resp = resources[url].response;
                    if (resp) {
                        resp.time = new Date(resp.time) - startTime;
                    }
                }
            }

            // yslow wrapper to be evaluated by page
            yslow = function () {
                //YSLOW HERE
            };

            // serialize YSlow phantomjs object
            // resources, yslow args and page load time
            ysphantomjs = 'YSLOW.phantomjs = {' +
                'resources: ' + JSON.stringify(resources) + ',' +
                'args: ' + JSON.stringify(yslowArgs) + ',' +
                'loadTime: ' + JSON.stringify(loadTime) + '};';

            // YSlow phantomjs controller
            controller = function () {
                YSLOW.phantomjs.run = function () {
                    try {
                        var results, xhr, output, threshold,
                            doc = document,
                            ys = YSLOW,
                            yscontext = new ys.context(doc),
                            yspeeler = ys.peeler,
                            comps = yspeeler.peel(doc),
                            baseHref = yspeeler.getBaseHref(doc),
                            cset = new ys.ComponentSet(doc),
                            ysphantomjs = ys.phantomjs,
                            resources = ysphantomjs.resources,
                            args = ysphantomjs.args,
                            ysutil = ys.util,
                            preferences,

                            // format out with appropriate content type
                            formatOutput = function (content) {
                                var testResults,
                                    format = (args.format || '').toLowerCase(),
                                    harness = {
                                        'tap': {
                                            func: ysutil.formatAsTAP,
                                            contentType: 'text/plain'
                                        },
                                        'junit': {
                                            func: ysutil.formatAsJUnit,
                                            contentType: 'text/xml'
                                        }
                                    };

                                switch (format) {
                                case 'xml':
                                    return {
                                        content: ysutil.objToXML(content),
                                        contentType: 'text/xml'
                                    };
                                case 'plain':
                                    return {
                                        content: ysutil.prettyPrintResults(
                                            content
                                        ),
                                        contentType: 'text/plain'
                                    };
                                // test formats
                                case 'tap':
                                case 'junit':
                                    try {
                                        threshold = JSON.parse(args.threshold);
                                    } catch (err) {
                                        threshold = args.threshold;
                                    }
                                    testResults = harness[format].func(
                                        ysutil.testResults(
                                            content,
                                            threshold
                                        )
                                    );
                                    return {
                                        content: testResults.content,
                                        contentType: harness[format].contentType,
                                        failures: testResults.failures
                                    };
                                default:
                                    return {
                                        content: JSON.stringify(content),
                                        contentType: 'application/json'
                                    };
                                }
                            },

                            // format raw headers into object
                            formatHeaders = function (headers) {
                                var reHeader = /^([^:]+):\s*([\s\S]+)$/,
                                    reLineBreak = /[\n\r]/g,
                                    header = {};

                                headers.split('\n').forEach(function (h) {
                                    var m = reHeader.exec(
                                            h.replace(reLineBreak, '')
                                        );

                                    if (m) {
                                        header[m[1]] = m[2];
                                    }
                                });

                                return header;
                            };

                        comps.forEach(function (comp) {
                            var res = resources[comp.href] ||
                                resources[ys.util.makeAbsoluteUrl(comp.href, comp.base)] || {};

                            // if the component hasn't been fetched by phantomjs but discovered by yslow
                            if (res.response === undefined) {
                                try {
                                    var headerName, h, i, len, m, startTime, endTime, headers,
                                        reHeader = /^([^:]+):\s*([\s\S]+)$/,
                                        response = {},
                                        request = {};

                                    // fetch the asset
                                    xhr = new XMLHttpRequest();
                                    startTime = new Date().getTime();
                                    xhr.open('GET', ys.util.makeAbsoluteUrl(comp.href, comp.base), false);
                                    xhr.send();
                                    endTime = new Date().getTime();
                                    headers = xhr.getAllResponseHeaders();
                                    h = headers.split('\n');

                                    // fake the request
                                    request.headers = [];
                                    request.url = ys.util.makeAbsoluteUrl(comp.href, comp.base);
                                    request.method = 'GET';
                                    request.time = '2013-05-22T20:40:33.381Z';

                                    // setup the response
                                    // real values will be added to the component
                                    // from the header
                                    response.bodySize = '-1';
                                    response.contentType = '';
                                    response.headers = [];
                                    response.id = '-1';
                                    response.redirectURL = null;
                                    response.stage = 'end';
                                    response.status = xhr.status;
                                    response.time = endTime - startTime;
                                    response.url = ys.util.makeAbsoluteUrl(comp.href, comp.base);

                                    // get the headers
                                    h = headers.split('\n');
                                    for (i = 0, len = h.length; i < len; i += 1) {
                                        m = reHeader.exec(h[i]);
                                        if (m) {
                                            response.headers.push({'name': m[1], 'value': m[2]});
                                        }
                                    }

                                    res.response = response;
                                    res.request = request;

                                } catch (err) {
                                    console.log(err);
                                }
                            }

                            cset.addComponent(
                                comp.href,
                                comp.type,
                                comp.base || baseHref,
                                {
                                    obj: comp.obj,
                                    request: res.request,
                                    response: res.response
                                }
                            );
                        });

                        preferences = new Preferences();
                        preferences.setPref('cdnHostnames', args.cdns);
                        ysutil.Preference.registerNative(preferences);

                        // refinement
                        cset.inline = ysutil.getInlineTags(doc);
                        cset.domElementsCount = ysutil.countDOMElements(doc);
                        cset.cookies = cset.doc_comp.cookie;
                        cset.components = ysutil.setInjected(doc,
                            cset.components, cset.doc_comp.body);

                        // run analysis
                        yscontext.component_set = cset;
                        ys.controller.lint(doc, yscontext, args.ruleset);
                        yscontext.result_set.url = baseHref;
                        yscontext.PAGE.t_done = ysphantomjs.loadTime;
                        yscontext.collectStats();
                        results = ysutil.getResults(yscontext, args.info);

                        // prepare output results
                        if (args.dict && args.format !== 'plain') {
                            results.dictionary = ysutil.getDict(args.info,
                                args.ruleset);
                        }
                        output = formatOutput(results);

                        // send beacon
                        if (args.beacon) {
                            try {
                                xhr = new XMLHttpRequest();
                                xhr.onreadystatechange = function () {
                                    // in verbose mode, include
                                    // beacon response info
                                    if (xhr.readyState === 4 && args.verbose) {
                                        results.beacon = {
                                            status: xhr.status,
                                            headers: formatHeaders(
                                                xhr.getAllResponseHeaders()
                                            ),
                                            body: xhr.responseText
                                        };
                                        output = formatOutput(results);
                                    }
                                };
                                xhr.open('POST', args.beacon, false);
                                xhr.setRequestHeader('Content-Type',
                                    output.contentType);
                                xhr.send(output.content);
                            } catch (xhrerr) {
                                // include error on beacon
                                if (args.verbose) {
                                    results.beacon = {
                                        error: xhrerr
                                    };
                                    output = formatOutput(results);
                                }
                            }
                        }

                        return output;
                    } catch (err) {
                        return err;
                    }
                };

                // Implement a bare minimum preferences object to be able to use custom CDN URLs
                function Preferences() {
                    this.prefs = {};
                }
                Preferences.prototype.getPref = function (name, defaultValue) {
                    return this.prefs.hasOwnProperty(name) ? this.prefs[name] : defaultValue;
                };
                Preferences.prototype.setPref = function (name, value) {
                    this.prefs[name] = value;
                };
                Preferences.prototype.deletePref = function (name) {
                    delete this.prefs[name];
                };
                Preferences.prototype.getPrefList = function (branch_name, default_value) {
                    var values = [], key;
                    for (key in this.prefs) {
                        if (this.prefs.hasOwnProperty(key) && key.indexOf(branch_name) === 0) {
                            values.push({ 'name': key, 'value': this.prefs[key] });
                        }
                    }
                    return values.length === 0 ? default_value : values;
                };

                return YSLOW.phantomjs.run();
            };

            // serialize then combine:
            // YSlow + page resources + args + loadtime + controller
            yslow = yslow.toString();
            yslow = yslow.slice(13, yslow.length - 1);
            // minification removes last ';'
            if (yslow.slice(yslow.length - 1) !== ';') {
                yslow += ';';
            }
            controller = controller.toString();
            controller = controller.slice(13, controller.length - 1);
            evalFunc = new Function(yslow + ysphantomjs + controller);

            // evaluate script and log results
            output = page.evaluate(evalFunc);
            exitStatus += output.failures || 0;
            console.log(output.content);
        }

        // finish phantomjs
        urlCount -= 1;
        if (urlCount === 0) {
            phantom.exit(exitStatus);
        }
    });
});
