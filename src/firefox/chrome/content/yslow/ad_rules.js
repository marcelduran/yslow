/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

//AD specifc
YSLOW.doc.addRuleInfo('yanumreq', 'Make fewer HTTP requests', 'Decreasing the number of components on an ad reduces the number of HTTP requests the user has to make, resulting in faster page loads. Some ways to reduce the number of components include: caching files, combining files, combining multiple external scripts into one script, using inline scipts instead of external scripts (if they don\'t negatively affect the page in other ways)');

YSLOW.doc.addRuleInfo('yaexpires', 'Add Expires headers', 'By using Expires headers, components become cacheable, which avoids unnecessary HTTP requests on subsequent page views. Advertisements should cache scripts, images, flash, and style sheets.');

YSLOW.doc.addRuleInfo('yacdn', 'Use a Content Delivery Network (CDN)', 'User proximity to web servers impacts response times.  Deploying static content across multiple geographically dispersed servers helps pages load faster.');

YSLOW.doc.addRuleInfo('yacompress', 'Compress components with gzip', 'Compression reduces response times by reducing the size of the HTTP response.  Gzip is the most popular and effective compression method currently available and generally reduces the response size by about 70%.  Approximately 90% of today\'s Internet traffic travels through browsers that claim to support gzip.');

YSLOW.doc.addRuleInfo('yaredirects', 'Avoid redirects', 'URL redirects are made using HTTP status codes 301 and 302.  They tell the browser to go to another location. Each redirect is like a very small HTTP request with all the connection-establishing costs.');

YSLOW.doc.addRuleInfo('yano404', 'Avoid HTTP 404 (Not Found) error', 'Making an HTTP request and receiving a 404 (Not Found) error is expensive and degrades the user experience.');

YSLOW.doc.addRuleInfo('yadns', 'Reduce DNS lookups', 'The Domain Name System (DNS) maps hostnames to IP addresses; typically it takes 20 to 120 milliseconds for it to look up the IP address for a hostname. The browser cannot download anything from the host until the lookup completes. Distributing ad contents accross multiple hostnames increases DNS lookups. Generally, we allow up to 4 domains for a regular page (before penalty), and advertisements\' domains are part of this, so it is best to minimize them. Using IP addresses instead of text urls avoids DNS lookups, but the parallel downloading still occurs.');

YSLOW.doc.addRuleInfo('yaetags', 'Configure entity tags (ETags)', 'Entity tags (ETags) are a mechanism web servers and the browser use to determine whether a component in the browser\'s cache matches one on the origin server.  Since ETags are typically constructed using attributes that make them unique to a specific server hosting a site, the tags will not match when a browser gets the original component from one server and later tries to validate that component on a different server.');

YSLOW.doc.addRuleInfo('yaminify', 'Minify JavaScript and CSS', 'Minification removes unnecessary characters from a file to reduce its size, thereby improving load times.  When a file is minified, comments and unneeded white space characters (space, newline, and tab) are removed.  This improves response time since the size of the download files is reduced.');

YSLOW.doc.addRuleInfo('yadupes', 'Remove duplicate JavaScript and CSS', 'Duplicate JavaScript and CSS files hurt performance by creating unnecessary HTTP requests (IE only) and wasted JavaScript execution (IE and Firefox).  In IE, if an external script is included twice and is not cacheable, it generates two HTTP requests during page loading.  Even if the script is cacheable, extra HTTP requests occur when the user reloads the page.  In both IE and Firefox, duplicate JavaScript scripts cause wasted time evaluating the same scripts more than once.  This redundant script execution happens regardless of whether the script is cacheable.');

YSLOW.doc.addRuleInfo('yabeacons', 'Limit image beacons', 'Image beacons (1x1 images used to track page visitors) are additional HTTP requests. Though the sizes of these requests are small, their costs are still significant and should be avoided in order to improve load times. This rule does not overlap with previous rules. YSlow treats beacons separately.');

YSLOW.doc.addRuleInfo('yaexternal', '(JS/CSS) Inline small; cache large', 'JavaScript and CSS that are inlined in HTML documents get downloaded each time the HTML document is requested. Using external JavaScript and CSS files reduces the size of the HTML document, but increases the number of HTTP requests. However, if the external files are cached by the browser, then the HTML document size is reduced without increasing the number of HTTP requests resulting in faster page loads. If your JavaScript and CSS files are large (over 2.5KB), making them external is advantageous. If they are small (under 2.5KB), then inline them.');

YSLOW.doc.addRuleInfo('yaimgnoscale', 'Do not scale images in HTML', 'Web page designers sometimes set image dimensions by using the width and height attributes of the HTML image element.  Avoid doing this since it can result in images being larger than needed.  For example, if your page requires image myimg.jpg which has dimensions 240x720 but displays it with dimensions 120x360 using the width and height attributes, then the browser will download an image that is larger than necessary.');

YSLOW.doc.addRuleInfo('yaiframes', 'Avoid iframe usage', 'Iframes are the most expensive DOM element and generate additional HTTP requests. They have uses in large web pages, but are not advantageous within typical advertisements. The host probably puts this ad in a frame, but the ad should not request more frames within itself.');

YSLOW.doc.addRuleInfo('yacookies', 'Minimize cookies', 'HTTP cookies are used for authentication, personalization, and other purposes.  Cookie information is exchanged in the HTTP headers between web servers and the browser, so keeping the cookie size small minimizes the impact on response time. Some ways to avoid unnecessary cookires are by using cookie-free domains. When the browser requests a static image and sends cookies with the request, the server ignores the cookies.  These cookies are unnecessary network traffic.  To workaround this problem, make sure that static components are requested with cookie-free requests by creating a subdomain and hosting them there.');

/*YSLOW.doc.addRuleInfo('yaafter_onload', 'Components requested after onload', 'This rule does not imply that you should avoid requesting components after the onload event fires. Such a technique can be good at improving user perception of a page\'s loading time. However, the previous rules only analyze components fetched before onload, so this rule is used to analyze the rest. The penalty for requesting components after onload is generally less than the penalty for requesting before onload');*/


/**
 * AD SPECIFIC STARTS HERE
 */

YSLOW.registerRule({
    id: 'yanumreq',
    url: 'http://developer.yahoo.com/performance/rules.html#num_http',
    category: ['content'],
    config: {
        max_cmp: 1,
        // the number of components allowed before we start penalizing
        points_cmp: 15,
        // penalty points for each component over the maximum
        types: ['js', 'css', 'image', 'cssimage', 'flash', 'doc', 'xhr', 'iframe']
    },

    lint: function (doc, cset, config) {
        var js, css, cssimg,
            comps = cset.getComponentsByType(config.types, true, false),
            cmp = comps.length - config.max_cmp,
            score = 100,
            messages = [];

        messages[messages.length] = 'This ad has ' + YSLOW.util.plural('%num% component%s%', (cmp + config.max_cmp)) + '.';
        score -= cmp * config.points_cmp;

        js = cset.getComponentsByType('js', true, false).length;
        if (js > 1) {
            messages[messages.length] = 'This ad has ' + YSLOW.util.plural('%num% external Javascript script%s%', js) + '.  Try combining them into one.';
        }

        css = cset.getComponentsByType('css', true, false).length;
        if (css > 1) {
            messages[messages.length] = 'This ad has ' + YSLOW.util.plural('%num% external stylesheet%s%', css) + '.  Try combining them into one.';
        }

        cssimg = cset.getComponentsByType('cssimage', true, false).length;
        if (cssimg > 1) {
            messages[messages.length] = 'This ad has ' + YSLOW.util.plural('%num% external background image%s%', cssimg) + '.  Try combining them with CSS sprites.';
        }

        if (score < 0) {
            score = 0;
        }

        return {
            score: score,
            message: messages.join('\n'),
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'yaexpires',
    url: 'http://developer.yahoo.com/performance/rules.html#expires',
    category: ['server'],
    config: {
        points: 20,
        // how many points to take for each component without Expires header
        howfar: 172800,
        // 2 days = 2 * 24 * 60 * 60 seconds, how far is far enough
        types: ['css', 'js', 'image', 'cssimage', 'flash'],
        // component types to be inspected for expires headers
        weight_of_size: 1,
        // how important is the size of components
        weight_of_time: 1 // how important is their closeness to howfar
        // do not make both of these 0
    },

    lint: function (doc, cset, config) {
        var far = parseInt(config.howfar, 10) * 1000,
            // far-ness in milliseconds
            ts, i, offenders = [],
            offenders_times = [],
            offenders_weights = [],
            expiration, score, offenders_time_avg = 0,
            offenders_total_weight = 0,
            offenders_weight_avg = 0,
            offenders_weight_avg_sum = 0,
            offenders_avg = 0,
            success = false,
            expire_time, comps = cset.getComponentsByType(config.types, true, false);

        for (i = 0; i < comps.length; i += 1) {
            expiration = comps[i].expires;

            if (typeof expiration === 'object' && typeof expiration.getTime === 'function') { // looks like a Date object
                ts = new Date().getTime();
                success = false;
                try {
                    expire_time = expiration.getTime();
                    success = true;
                }
                catch (err) {
                    YSLOW.util.dump(comps[i].url + ' threw an error');
                    continue;
                }
                if (success && expire_time > ts + far) {
                    continue;
                }
                if (success && expire_time < ts) {
                    expire_time = ts;
                }
            } else {
                expire_time = ts;
            }

            offenders.push("(" + YSLOW.util.prettyExpiresDate(expiration) + ") " + YSLOW.util.prettyAnchor(comps[i].url, comps[i].url, undefined, true, 120, undefined, comps[i].type));
            offenders_times.push(1 - (expire_time - ts) / far);
            offenders_weights.push(comps[i].size);
        }

        for (i = 0; i < offenders_times.length; i += 1) {
            offenders_time_avg = (offenders_time_avg * i + offenders_times[i]) / (i + 1);
            offenders_weight_avg_sum = offenders_weight_avg_sum + offenders_times[i] * offenders_weights[i];
            offenders_total_weight = offenders_total_weight + offenders_weights[i];
        }

        if (offenders_total_weight > 0) {
            offenders_weight_avg = offenders_weight_avg_sum / offenders_total_weight;
        }

        offenders_avg = (offenders_weight_avg * config.weight_of_size + offenders_time_avg * config.weight_of_time) / (config.weight_of_size + config.weight_of_time);

        score = (comps.length > 0 ? 100 - 100 * offenders.length * offenders_avg / comps.length : 100);

        return {
            score: (comps.length > 0 ? (score >= 0 ? score : 0) : -1),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% static component%s%', offenders.length) + ' without a far-future expiration date.' : '',
            components: offenders
        };

    }
});

YSLOW.registerRule({
    id: 'yacdn',
    url: 'http://developer.yahoo.com/performance/rules.html#cdn',
    category: ['server'],
    config: {
        points: 25,
        // how many points to take out for each component not on CDN
        patterns: [ // array of regexps that match CDN-ed components
            "^http://([^\\.]*)\\.([^\\.]*)\\.yimg\\.com/[^/]*\\.yimg\\.com/.*$", "^http://([^\\.]*)\\.([^\\.]*)\\.yimg\\.com/[^/]*\\.yahoo\\.com/.*$", "^https://sec.yimg.com/", "^https://a248.e.akamai.net/", "^http://[dehlps].yimg.com/", "^http://(ads|cn|mail|maps|s1).yimg.com/", "^http://a.l.yimg.com/", "^http://us.(js|a)2.yimg.com/", "^http://yui.yahooapis.com/", "^http://adz.kr.yahoo.com/", "^http://img.yahoo.co.kr", "^http://img.(shopping|news|srch).yahoo.co.kr", "^http://pimg.kr.yahoo.com/", "^http://kr.img.n2o.yahoo.com/", "^http://s3.amazonaws.com/", "^http://([^\\.]*).([^\\.]*)\\.cloudfront\\.net/.*$"
        ],
        exceptions: [ // array of regexps that will be treated as exception.
            "^http://chart.yahoo.com/", "^http://(a1|f3|f5|f3c|f5c).yahoofs.com/", // Images for 360 and YMDB
            "^http://us.(a1c|f3).yahoofs.com/" // Personals photos
        ],
        types: ['js', 'css', 'image', 'cssimage', 'flash'] // which component types should be on CDN
    },


    lint: function (doc, cset, config) {
        var user_cdns,
            score = 100,
            i, j, url, re, match, offenders = [],
            exceptions = [],
            hostname, message = '',
            comps = cset.getComponentsByType(config.types, true, true);

        for (i = 0; i < comps.length; i += 1) {
            url = comps[i].url;
            hostname = YSLOW.util.getHostname(url);
            match = false;
            for (j = 0; j < config.patterns.length; j += 1) {
                re = new RegExp(config.patterns[j]);
                if (re.test(url) === true) {
                    match = true;
                    break;
                }
            }
            if (!match) {
                for (j = 0; j < config.exceptions.length; j += 1) {
                    re = new RegExp(config.exceptions[j]);
                    if (re.test(url) === true) {
                        exceptions.push(comps[i]);
                        match = true;
                        break;
                    }
                }
                if (!match) {
                    offenders.push(comps[i]);
                }
            }
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);
        offenders.concat(exceptions);

        if (offenders.length > 0) {
            message = YSLOW.util.plural('There %are% %num% static component%s% that %are% not on CDN. ', offenders.length) + '<ul>';
            for (i = 0; i < offenders.length; i += 1) {
                message += '<li>' + YSLOW.util.prettyAnchor(offenders[i].url, offenders[i].url, undefined, true, 120, undefined, offenders[i].type) + '</li>';
            }
            message += '</ul>';
        }
        if (exceptions.length > 0) {
            message += YSLOW.util.plural('There %are% %num% component%s% that %are% not on CDN, but %are% exceptions:', exceptions.length) + '<ul>';
            for (i = 0; i < offenders.length; i += 1) {
                message += '<li>' + YSLOW.util.prettyAnchor(exceptions[i].url, exceptions[i].url, undefined, true, 120, undefined, exceptions[i].type) + '</li>';
            }
            message += '</ul>';
        }

        user_cdns = YSLOW.util.Preference.getPref("cdnHostnames", "");
        if (user_cdns && user_cdns.length > 0) {
            message += '<p>Using these CDN hostnames from your preferences: ' + user_cdns + '</p>';
        } else {
            message += '<p>You can specify CDN hostnames in your preferences. See <a href="javascript:document.ysview.openLink(\'http://developer.yahoo.com/yslow/faq.html#faq_cdn\')">YSlow FAQ</a> for details.</p>';
        }

        return {
            score: (comps.length > 0 ? (score >= 0 ? score : 0) : -1),
            message: message,
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'yacompress',
    url: 'http://developer.yahoo.com/performance/rules.html#gzip',
    category: ['server'],
    config: {
        min_filesize: 500,
        // files below this size are exceptions of the gzip rule
        types: ['doc', 'iframe', 'xhr', 'js', 'css'],
        // file types to inspect
        points: 25 // points to take out for each non-compressed component
    },

    lint: function (doc, cset, config) {
        var i, offenders = [],
            score, comps = cset.getComponentsByType(config.types, true, false);

        for (i = 0; i < comps.length; i += 1) {

            if (comps[i].compressed || comps[i].size < 500) {
                continue;
            }
            offenders.push(comps[i]);
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);

        return {
            score: (comps.length > 0 ? (score >= 0 ? score : 0) : -1),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% plain text component%s%', offenders.length) + ' that should be sent compressed' : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yaredirects',
    url: 'http://developer.yahoo.com/performance/rules.html#redirects',
    category: ['content'],
    config: {
        points: 25 // the penalty for each redirect
    },

    lint: function (doc, cset, config) {

        var i, score, offenders = [],
            comps = cset.getComponentsByType('redirect', true, true);

        for (i = 0; i < comps.length; i += 1) {
            offenders.push(YSLOW.util.briefUrl(comps[i].url, 80) + "<br> redirects to <br>" + YSLOW.util.briefUrl(comps[i].headers.location, 60));
        }
        score = 100 - comps.length * parseInt(config.points, 10);

        return {
            score: (score >= 0 ? score : 0),
            message: (comps.length > 0) ? YSLOW.util.plural('There %are% %num% redirect%s%', comps.length) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yano404',
    url: 'http://developer.yahoo.com/performance/rules.html#no404',
    category: ['content'],
    config: {
        points: 25,
        // points to take out for each 404 response.
        types: ['js', 'css', 'image', 'cssimage', 'flash', 'redirect', 'doc', 'xhr', 'iframe']
    },

    lint: function (doc, cset, config) {
        var i, offenders = [],
            score, comps = cset.getComponentsByType(config.types);

        for (i = 0; i < comps.length; i += 1) {
            if (comps[i].status === 404) {
                offenders.push(comps[i]);
            }
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: (score >= 0 ? score : 0),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% request%s% that %are% 404 Not Found', offenders.length) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yadns',
    url: 'http://developer.yahoo.com/performance/rules.html#dns_lookups',
    category: ['content'],
    config: {
        max_domains: 2,
        // maximum allowed domains
        // 1 for the HTML, 1 for the CDN. should not need more than that
        points_name: 20,
        // the cost of each additional domain accessed by name
        points_ip: 10 // the cost of each additional domain accessed by IP (must be less than points_name)
    },

    lint: function (doc, cset, config) {
        var score, domains = YSLOW.util.getUniqueDomains(cset.components, false),
            domains_name = YSLOW.util.getUniqueDomains(cset.components, true);

        score = 100;
        if (domains.length > config.max_domains) {
            score -= (domains.length - config.max_domains) * config.points_ip;
            if (domains_name.length > config.max_domains) {
                score -= (config.points_name - config.points_ip) * (domains_name.length - config.max_domains);
            }
        }

        return {
            score: (score >= 0 ? score : 0),
            message: (domains.length > config.max_domains) ? YSLOW.util.plural('The components are split over more than %num% domain%s%', config.max_domains) : '',
            components: (domains.length > config.max_domains) ? domains : []
        };
    }
});


YSLOW.registerRule({
    id: 'yaetags',
    url: 'http://developer.yahoo.com/performance/rules.html#etags',
    category: ['server'],
    config: {
        points: 25,
        // points to take out for each misconfigured etag
        types: ['flash', 'js', 'css', 'cssimage', 'image'] // types to inspect for etags
    },

    lint: function (doc, cset, config) {
        var i, score, offenders = [],
            comps = cset.getComponentsByType(config.types, true, false);

        for (i = 0; i < comps.length; i += 1) {
            if (comps[i].headers && comps[i].headers.etag && comps[i].headers.server && !YSLOW.util.isETagGood(comps[i].headers.etag, comps[i].headers.server)) {
                offenders.push(comps[i]);
            }
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);

        return {
            score: (comps.length > 0 ? (score >= 0 ? score : 0) : -1),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% component%s% with misconfigured ETags', offenders.length) : '',
            components: offenders
        };
    }
});


YSLOW.registerRule({
    id: 'yaminify',
    url: 'http://developer.yahoo.com/performance/rules.html#minify',
    category: ['javascript', 'css'],
    config: {
        points: 40,
        // penalty for each unminified component
        types: ['js', 'css'],
        // types of components to inspect for minification
        check_inline: ['style', 'script'] // inlide tags to check for minification
    },

    lint: function (doc, cset, config) {
        var i, j, score, comps = cset.getComponentsByType(config.types, true, false),
            inlines, offenders = [],
            minified, inlines_exist = false;

        // check all peeled components
        for (i = 0; i < comps.length; i += 1) {
            // set/get minified flag
            if (typeof comps[i].minified === 'undefined') {
                minified = YSLOW.util.isMinified(comps[i].body);
                comps[i].minified = minified;
            } else {
                minified = comps[i].minified;
            }

            if (!minified) {
                offenders.push(comps[i]);
            }
        }

        // check inline scripts/styles/whatever
        if (config.check_inline) {
            for (j = 0; j < config.check_inline.length; j += 1) {
                inlines = doc.getElementsByTagName(config.check_inline[j]);
                for (i = 0; i < inlines.length; i += 1) {
                    inlines_exist = true;
                    if (!YSLOW.util.isMinified(inlines[i].innerHTML)) {
                        offenders.push('Inline ' + config.check_inline[j] + ' tag #' + (i + 1));
                    }
                }
            }
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);

        return {
            score: ((comps.length > 0 || inlines_exist) ? (score >= 0 ? score : 0) : -1),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% component%s% that can be minified', offenders.length) : '',
            components: offenders
        };
    }
});


YSLOW.registerRule({
    id: 'yadupes',
    url: 'http://developer.yahoo.com/performance/rules.html#js_dupes',
    category: ['javascript', 'css'],
    config: {
        points: 100,
        // penalty for each duplicate
        types: ['js', 'css'] // component types to check for duplicates
    },

    lint: function (doc, cset, config) {
        var i, url, score, hash = {},
            offenders = [],
            comps = cset.getComponentsByType(config.types, true, false);

        for (i = 0; i < comps.length; i += 1) {
            url = comps[i].url;
            if (typeof hash[url] === 'undefined') {
                hash[url] = {
                    count: 1,
                    compindex: i
                };
            } else {
                hash[url].count += 1;
            }
        }

        for (i in hash) {
            if (hash[i].count > 1) {
                offenders.push(comps[hash[i].compindex]);
            }
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);

        return {
            score: (comps.length > 0 ? (score >= 0 ? score : 0) : -1),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% duplicate component%s%', offenders.length) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yabeacons',
    url: 'http://developer.yahoo.com/performance/rules.html#num_http',
    category: ['content'],
    config: {
        max_cmp: 0,
        // the number of components allowed before we start penalizing
        points_cmp: 20,
        // penalty points for each component over the maximum
        types: ['image']
    },

    lint: function (doc, cset, config) {
        var i, messages, score,
            comps = cset.getComponentsByType(config.types, true, true),
            cmp = 0,
            offenders = [];

        for (i = 0; i < comps.length; i += 1) {
            if (comps[i].is_beacon) {
                cmp += 1;
                offenders.push(comps[i]);
            }
        }
        cmp -= config.max_cmp;

        score = 100;
        messages = [];

        messages[messages.length] = 'This advertisement requests ' + YSLOW.util.plural('%num% beacon%s%', (cmp + config.max_cmp)) + '.';
        score -= cmp * config.points_cmp;

        if (score < 0) {
            score = 0;
        }

        return {
            score: score,
            message: messages.join('\n'),
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yaexternal',
    url: 'http://developer.yahoo.com/performance/rules.html#external',
    category: ['javascript', 'css'],
    config: {
        check_inline: ['style', 'script'],
        // inline tags to check
        types: ['js', 'css'],
        // types of components to inspect
        threshold: 2500 // size in bytes after which components should be external
        // and under which components should be inlined
        // innerHTML.length property == size in bytes if 8bit chars. might be true regardless
    },

    lint: function (doc, cset, config) {
        var message = '',
            score = 100,
            offenders = [],
            i, j, inline_num_invalid = [],
            inline_sum_invalid = 0,
            inline_sum_total = 0,
            inline_weight = 0,
            inline_score = 100,
            inlines, external_score = 100,
            external_comps = cset.getComponentsByType(config.types, true, false),
            external_offenders = 0,
            external_offenders_average_weight = 0;

        // check inline scripts/styles/whatever
        if (config.check_inline) {
            for (j = 0; j < config.check_inline.length; j += 1) {
                inlines = doc.getElementsByTagName(config.check_inline[j]);
                inline_num_invalid[j] = 0;
                if (inlines.length > 0) {
                    for (i = 0; i < inlines.length; i += 1) {
                        if (inlines[i].innerHTML.length > config.threshold) {
                            inline_num_invalid[j] += 1;
                            inline_sum_invalid += 1;
                            inline_weight = (inline_weight * (inline_sum_invalid - 1) + inlines[i].innerHTML.length) / inline_sum_invalid;
                            offenders.push("(" + inlines[i].innerHTML.length + ") " + 'inline ' + config.check_inline[j]);
                        }
                        inline_sum_total += 1;
                    }
                    message += YSLOW.util.plural('There %are% %num% inline ' + (config.check_inline[j] === "style" ? 'css' : 'script%s%') + ' over ' + config.threshold + ' bytes that can be made external.\n', inline_num_invalid[j]);
                }
            }
        }

        inline_weight = (inline_weight > 0 ? 1 - config.threshold / inline_weight : 0);
        inline_score = (inline_sum_total > 0 ? 100 - 100 * inline_weight * inline_sum_invalid / inline_sum_total : 100);

        // check all peeled components
        for (i = 0; i < external_comps.length; i += 1) {
            if (external_comps[i].size < config.threshold) {
                external_offenders_average_weight = (external_offenders_average_weight * external_offenders + 1 - external_comps[i].size / config.threshold) / (external_offenders + 1);
                external_offenders += 1;
                offenders.push("(" + external_comps[i].size + ") " + YSLOW.util.prettyAnchor(external_comps[i].url, external_comps[i].url, undefined, true, 120, undefined, external_comps[i].type));
            }
        }

        external_score = (external_comps.length > 0 ? 100 - 100 * external_offenders_average_weight * external_offenders / external_comps.length : 100);

        message += (external_offenders > 0) ? YSLOW.util.plural('There %are% %num% component%s% under ' + config.threshold + ' bytes that can be inlined', external_offenders) : '';

        score = (inline_sum_total + external_comps.length > 0) ? (inline_score * inline_sum_total + external_score * external_comps.length) / (inline_sum_total + external_comps.length) : -1;

        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yaimgnoscale',
    url: 'http://developer.yahoo.com/performance/rules.html#no_scale',
    category: ['images'],
    config: {
        points: 5 // points to take out for each image that scaled.
    },

    lint: function (doc, cset, config) {
        var i, prop,
            offenders = [],
            score, comps = cset.getComponentsByType('image');

        for (i = 0; i < comps.length; i += 1) {
            if (comps[i].object_prop !== null) {
                prop = comps[i].object_prop;
                if (prop && typeof prop.width !== "undefined" && typeof prop.height !== "undefined" && typeof prop.actual_width !== "undefined" && typeof prop.actual_height !== "undefined") {
                    if (prop.width < prop.actual_width || prop.height < prop.actual_height) {
                        // allow scale up
                        offenders.push(comps[i]);
                    }
                }
            }
        }

        score = (comps.length > 0 ? 100 - 100 * offenders.length / comps.length : 100);

        return {
            score: (score >= 0 ? score : 0),
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% image%s% that %are% scaled down', offenders.length) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yaiframes',
    url: 'http://developer.yahoo.com/performance/rules.html#num_http',
    category: ['content'],

    config: {
        max_cmp: 0,
        // the number of components allowed before we start penalizing
        points_cmp: 25,
        // penalty points for each component over the maximum
        types: ['iframe']
    },

    lint: function (doc, cset, config) {
        var comps = cset.getComponentsByType(config.types, true, false),
            cmp = comps.length - config.max_cmp,
            score = 100,
            messages = [];

        messages[messages.length] = 'This ad has ' + YSLOW.util.plural('%num% iframe%s%', (cmp + config.max_cmp)) + '.';
        score -= cmp * config.points_cmp;

        if (score < 0) {
            score = 0;
        }

        return {
            score: score,
            message: messages.join('\n'),
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'yacookies',
    url: 'http://developer.yahoo.com/performance/rules.html#cookie_size',
    category: ['cookie'],
    config: {
        points: 30,
        // points to take out for every KB of cookie
        types: ['js', 'css', 'image', 'cssimage', 'flash', 'doc', 'xhr', 'iframe']
    },

    lint: function (doc, cset, config) {
        var cookie_size = 0,
            score = 100,
            i, offenders = [],
            comps = cset.getComponentsByType(config.types, true, true);

        for (i = 0; i < comps.length; i += 1) {
            if (typeof comps[i].cookie === 'string' && comps[i].cookie.length > 0) {
                offenders.push("(" + comps[i].cookie.length + ") " + YSLOW.util.prettyAnchor(comps[i].url, comps[i].url, undefined, true, 120, undefined, comps[i].type));
                cookie_size += comps[i].cookie.length;
            }
        }

        score = score - (config.points / 1000) * cookie_size;

        return {
            score: (score >= 0 ? score : 0),
            message: YSLOW.util.plural('There %are% %num% byte%s% of cookies on this ad', cookie_size),
            components: offenders
        };
    }
});

YSLOW.registerRuleset({ // ads
    id: 'yads',
    name: 'Advertisements',
    rules: {
        yanumreq: {},
        yaexpires: {},
        yacdn: {},
        yacompress: {},
        yaredirects: {},
        yano404: {},
        yadns: {},
        yaetags: {},
        yaminify: {},
        yadupes: {},
        yabeacons: {},
        yaimgnoscale: {},
        yaexternal: {},
        yaiframes: {},
        yacookies: {}
    },
    weights: {
        yanumreq: 25,
        yaexpires: 12,
        yacdn: 10,
        yacompress: 8,
        yaredirects: 10,
        yano404: 1,
        //already part of yanumreq?
        yadns: 7,
        yaetags: 2,
        yaminify: 8,
        yadupes: 5,
        yabeacons: 20,
        yaimgnoscale: 2,
        yaexternal: 5,
        yaiframes: 5,
        yacookies: 20
    }
});
