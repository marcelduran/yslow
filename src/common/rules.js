/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, regexp: true, continue: true, plusplus: true, bitwise: true, newcap: true, type: true, unparam: true, maxerr: 50, indent: 4*/

/**
 *
 * Example of a rule object:
 *
 * <pre>
 * YSLOW.registerRule({
 *
 *     id: 'myrule',
 *     name: 'Never say never',
 *     url: 'http://never.never/never.html',
 *     info: 'Short description of the rule',
 *
 *     config: {
 *          when: 'ever'
 *     },
 *
 *     lint: function(doc, components, config) {
 *         return {
 *             score: 100,
 *             message: "Did you just say never?",
 *             components: []
 *         };
 *     }
 * });
  </pre>
 */

//
// 3/2/2009
// Centralize all name and info of builtin tool to YSLOW.doc class.
//
YSLOW.registerRule({
    id: 'ynumreq',
    //name: 'Make fewer HTTP requests',
    url: 'http://developer.yahoo.com/performance/rules.html#num_http',
    category: ['content'],

    config: {
        max_js: 3,
        // the number of scripts allowed before we start penalizing
        points_js: 4,
        // penalty points for each script over the maximum
        max_css: 2,
        // number of external stylesheets allowed before we start penalizing
        points_css: 4,
        // penalty points for each external stylesheet over the maximum
        max_cssimages: 6,
        // // number of background images allowed before we start penalizing
        points_cssimages: 3 // penalty points for each bg image over the maximum
    },

    lint: function (doc, cset, config) {
        var js = cset.getComponentsByType('js').length - config.max_js,
            css = cset.getComponentsByType('css').length - config.max_css,
            cssimg = cset.getComponentsByType('cssimage').length - config.max_cssimages,
            score = 100,
            messages = [];

        if (js > 0) {
            score -= js * config.points_js;
            messages[messages.length] = 'This page has ' + YSLOW.util.plural('%num% external Javascript script%s%', (js + config.max_js)) + '.  Try combining them into one.';
        }
        if (css > 0) {
            score -= css * config.points_css;
            messages[messages.length] = 'This page has ' + YSLOW.util.plural('%num% external stylesheet%s%', (css + config.max_css)) + '.  Try combining them into one.';
        }
        if (cssimg > 0) {
            score -= cssimg * config.points_cssimages;
            messages[messages.length] = 'This page has ' + YSLOW.util.plural('%num% external background image%s%', (cssimg + config.max_cssimages)) + '.  Try combining them with CSS sprites.';
        }

        return {
            score: score,
            message: messages.join('\n'),
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'ycdn',
    //name: 'Use a CDN',
    url: 'http://developer.yahoo.com/performance/rules.html#cdn',
    category: ['server'],

    config: {
        // how many points to take out for each component not on CDN
        points: 10,
        // array of regexps that match CDN-ed components
        patterns: [
            '^([^\\.]*)\\.([^\\.]*)\\.yimg\\.com/[^/]*\\.yimg\\.com/.*$',
            '^([^\\.]*)\\.([^\\.]*)\\.yimg\\.com/[^/]*\\.yahoo\\.com/.*$',
            '^sec.yimg.com/',
            '^a248.e.akamai.net',
            '^[dehlps].yimg.com',
            '^(ads|cn|mail|maps|s1).yimg.com',
            '^[\\d\\w\\.]+.yimg.com',
            '^a.l.yimg.com',
            '^us.(js|a)2.yimg.com',
            '^yui.yahooapis.com',
            '^adz.kr.yahoo.com',
            '^img.yahoo.co.kr',
            '^img.(shopping|news|srch).yahoo.co.kr',
            '^pimg.kr.yahoo.com',
            '^kr.img.n2o.yahoo.com',
            '^s3.amazonaws.com',
            '^(www.)?google-analytics.com',
            '.cloudfront.net', //Amazon CloudFront
            '.ak.fbcdn.net', //Facebook images ebeded
            'platform.twitter.com', //Twitter widget - Always via a CDN
            'cdn.api.twitter.com', //Twitter API calls, served via Akamai
            'apis.google.com', //Google's API Hosting
            '.akamaihd.net', //Akamai - Facebook uses this for SSL assets
            '.rackcdn.com' //Generic RackSpace CloudFiles CDN
        ],
        // array of regexps that will be treated as exception.
        exceptions: [
            '^chart.yahoo.com',
            '^(a1|f3|f5|f3c|f5c).yahoofs.com', // Images for 360 and YMDB
            '^us.(a1c|f3).yahoofs.com' // Personals photos
        ],
        // array of regexps that match CDN Server HTTP headers
        servers: [
            'cloudflare-nginx' // not using ^ and $ due to invisible
        ],
        // which component types should be on CDN
        types: ['js', 'css', 'image', 'cssimage', 'flash', 'favicon']
    },

    lint: function (doc, cset, config) {
        var i, j, url, re, match, hostname,
            offender, len, lenJ, comp, patterns, headers,
            score = 100,
            offenders = [],
            exceptions = [],
            message = '',
            util = YSLOW.util,
            plural = util.plural,
            kbSize = util.kbSize,
            getHostname = util.getHostname,
            docDomain = getHostname(cset.doc_comp.url),
            comps = cset.getComponentsByType(config.types),
            userCdns = util.Preference.getPref('cdnHostnames', ''),
            hasPref = util.Preference.nativePref;

        // array of custom cdns
        if (userCdns) {
            userCdns = userCdns.split(',');
        }

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            url = comp.url;
            hostname = getHostname(url);
            headers = comp.headers;

            // ignore /favicon.ico
            if (comp.type === 'favicon' && hostname === docDomain) {
                continue;
            }

            // experimental custom header, use lowercase
            match = headers['x-cdn'] || headers['x-amz-cf-id'] || headers['x-edge-location'] || headers['powered-by-chinacache'];
            if (match) {
                continue;
            }

            // by hostname
            patterns = config.patterns;
            for (j = 0, lenJ = patterns.length; j < lenJ; j += 1) {
                re = new RegExp(patterns[j]);
                if (re.test(hostname)) {
                    match = 1;
                    break;
                }
            }
            // by custom hostnames
            if (userCdns) {
                for (j = 0, lenJ = userCdns.length; j < lenJ; j += 1) {
                    re = new RegExp(util.trim(userCdns[j]));
                    if (re.test(hostname)) {
                        match = 1;
                        break;
                    }
                }
            }

            if (!match) {
                // by Server HTTP header
                patterns = config.servers;
                for (j = 0, lenJ = patterns.length; j < lenJ; j += 1) {
                    re = new RegExp(patterns[j]);
                    if (re.test(headers.server)) {
                        match = 1;
                        break;
                    }
                }
                if (!match) {
                    // by exception
                    patterns = config.exceptions;
                    for (j = 0, lenJ = patterns.length; j < lenJ; j += 1) {
                        re = new RegExp(patterns[j]);
                        if (re.test(hostname)) {
                            exceptions.push(comp);
                            match = 1;
                            break;
                        }
                    }
                    if (!match) {
                        offenders.push(comp);
                    }
                }
            }
        }

        score -= offenders.length * config.points;

        offenders.concat(exceptions);

        if (offenders.length > 0) {
            message = plural('There %are% %num% static component%s% ' +
                'that %are% not on CDN. ', offenders.length);
        }
        if (exceptions.length > 0) {
            message += plural('There %are% %num% component%s% that %are% not ' +
                'on CDN, but %are% exceptions:', exceptions.length) + '<ul>';
            for (i = 0, len = offenders.length; i < len; i += 1) {
                message += '<li>' + util.prettyAnchor(exceptions[i].url,
                    exceptions[i].url, null, true, 120, null,
                    exceptions[i].type) + '</li>';
            }
            message += '</ul>';
        }

        if (userCdns) {
            message += '<p>Using these CDN hostnames from your preferences: ' +
                userCdns + '</p>';
        } else {
            message += '<p>You can specify CDN hostnames in your ' +
                'preferences. See <a href="javascript:document.ysview.' +
                'openLink(\'https://github.com/marcelduran/yslow/wiki/FAQ#' +
                'wiki-faq_cdn\')">YSlow FAQ</a> for details.</p>';
        }

        // list unique domains only to avoid long list of offenders
        if (offenders.length) {
            offenders = util.summaryByDomain(offenders,
                ['size', 'size_compressed'], true);
            for (i = 0, len = offenders.length; i < len; i += 1) {
                offender = offenders[i];
                offenders[i] = offender.domain + ': ' +
                    plural('%num% component%s%, ', offender.count) +
                    kbSize(offender.sum_size) + (
                        offender.sum_size_compressed > 0 ? ' (' +
                        kbSize(offender.sum_size_compressed) + ' GZip)' : ''
                    ) + (hasPref ? (
                    ' <button onclick="javascript:document.ysview.addCDN(\'' +
                    offender.domain + '\')">Add as CDN</button>') : '');
            }
        }

        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yexpires',
    //name: 'Add an Expires header',
    url: 'http://developer.yahoo.com/performance/rules.html#expires',
    category: ['server'],

    config: {
        // how many points to take for each component without Expires header
        points: 11,
        // 2 days = 2 * 24 * 60 * 60 seconds, how far is far enough
        howfar: 172800,
        // component types to be inspected for expires headers
        types: ['css', 'js', 'image', 'cssimage', 'flash', 'favicon']
    },

    lint: function (doc, cset, config) {
        var ts, i, expiration, score, len,
            // far-ness in milliseconds
            far = parseInt(config.howfar, 10) * 1000,
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            expiration = comps[i].expires;
            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                // looks like a Date object
                ts = new Date().getTime();
                if (expiration.getTime() > ts + far) {
                    continue;
                }
            }
            offenders.push(comps[i]);
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% static component%s%',
                offenders.length
            ) + ' without a far-future expiration date.' : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ycompress',
    //name: 'Compress components',
    url: 'http://developer.yahoo.com/performance/rules.html#gzip',
    category: ['server'],

    config: {
        // files below this size are exceptions of the gzip rule
        min_filesize: 500,
        // file types to inspect
        types: ['doc', 'iframe', 'xhr', 'js', 'css'],
        // points to take out for each non-compressed component
        points: 11
    },

    lint: function (doc, cset, config) {
        var i, len, score, comp,
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (comp.compressed || comp.size < 500) {
                continue;
            }
            offenders.push(comp);
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% plain text component%s%',
                offenders.length
            ) + ' that should be sent compressed' : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ycsstop',
    //name: 'Put CSS at the top',
    url: 'http://developer.yahoo.com/performance/rules.html#css_top',
    category: ['css'],

    config: {
        points: 10
    },

    lint: function (doc, cset, config) {
        var i, len, score, comp,
            comps = cset.getComponentsByType('css'),
            offenders = [];

        // expose all offenders
        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (comp.containerNode === 'body') {
                offenders.push(comp);
            }
        }

        score = 100;
        if (offenders.length > 0) {
            // start at 99 so each ding drops us a grade
            score -= 1 + offenders.length * parseInt(config.points, 10);
        }

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% stylesheet%s%',
                offenders.length
            ) + ' found in the body of the document' : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yjsbottom',
    //name: 'Put Javascript at the bottom',
    url: 'http://developer.yahoo.com/performance/rules.html#js_bottom',
    category: ['javascript'],
    config: {
        points: 5 // how many points for each script in the <head>
    },

    lint: function (doc, cset, config) {
        var i, len, comp, score,
            offenders = [],
            comps = cset.getComponentsByType('js');

        // offenders are components not injected (tag found on document payload)
        // except if they have either defer or async attributes
        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (comp.containerNode === 'head' &&
                    !comp.injected && (!comp.defer || !comp.async)) {
                offenders.push(comp);
            }
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ?
                YSLOW.util.plural(
                    'There %are% %num% JavaScript script%s%',
                    offenders.length
                ) + ' found in the head of the document' : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yexpressions',
    //name: 'Avoid CSS expressions',
    url: 'http://developer.yahoo.com/performance/rules.html#css_expressions',
    category: ['css'],

    config: {
        points: 2 // how many points for each expression
    },

    lint: function (doc, cset, config) {
        var i, len, expr_count, comp,
            instyles = (cset.inline && cset.inline.styles) || [],
            comps = cset.getComponentsByType('css'),
            offenders = [],
            score = 100,
            total = 0;

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (typeof comp.expr_count === 'undefined') {
                expr_count = YSLOW.util.countExpressions(comp.body);
                comp.expr_count = expr_count;
            } else {
                expr_count = comp.expr_count;
            }

            // offence
            if (expr_count > 0) {
                comp.yexpressions = YSLOW.util.plural(
                    '%num% expression%s%',
                    expr_count
                );
                total += expr_count;
                offenders.push(comp);
            }
        }

        for (i = 0, len = instyles.length; i < len; i += 1) {
            expr_count = YSLOW.util.countExpressions(instyles[i].body);
            if (expr_count > 0) {
                offenders.push('inline &lt;style&gt; tag #' + (i + 1) + ' (' +
                    YSLOW.util.plural(
                        '%num% expression%s%',
                        expr_count
                    ) + ')'
                    );
                total += expr_count;
            }
        }

        if (total > 0) {
            score = 90 - total * config.points;
        }

        return {
            score: score,
            message: total > 0 ? 'There is a total of ' +
                YSLOW.util.plural('%num% expression%s%', total) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yexternal',
    //name: 'Make JS and CSS external',
    url: 'http://developer.yahoo.com/performance/rules.html#external',
    category: ['javascript', 'css'],
    config: {},

    lint: function (doc, cset, config) {
        var message,
            inline = cset.inline,
            styles = (inline && inline.styles) || [],
            scripts = (inline && inline.scripts) || [],
            offenders = [];

        if (styles.length) {
            message = YSLOW.util.plural(
                'There is a total of %num% inline css',
                styles.length
            );
            offenders.push(message);
        }

        if (scripts.length) {
            message = YSLOW.util.plural(
                'There is a total of %num% inline script%s%',
                scripts.length
            );
            offenders.push(message);
        }

        return {
            score: 'n/a',
            message: 'Only consider this if your property is a common user home page.',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ydns',
    //name: 'Reduce DNS lookups',
    url: 'http://developer.yahoo.com/performance/rules.html#dns_lookups',
    category: ['content'],

    config: {
        // maximum allowed domains, excluding ports and IP addresses
        max_domains: 4,
        // the cost of each additional domain over the maximum
        points: 5
    },

    lint: function (doc, cset, config) {
        var i, len, domain,
            util = YSLOW.util,
            kbSize = util.kbSize,
            plural = util.plural,
            score = 100,
            domains = util.summaryByDomain(cset.components,
                ['size', 'size_compressed'], true);

        if (domains.length > config.max_domains) {
            score -= (domains.length - config.max_domains) * config.points;
        }

        // list unique domains only to avoid long list of offenders
        if (domains.length) {
            for (i = 0, len = domains.length; i < len; i += 1) {
                domain = domains[i];
                domains[i] = domain.domain + ': ' +
                    plural('%num% component%s%, ', domain.count) +
                    kbSize(domain.sum_size) + (
                        domain.sum_size_compressed > 0 ? ' (' +
                        kbSize(domain.sum_size_compressed) + ' GZip)' : ''
                    );
            }
        }

        return {
            score: score,
            message: (domains.length > config.max_domains) ? plural(
                'The components are split over more than %num% domain%s%',
                config.max_domains
            ) : '',
            components: domains
        };
    }
});

YSLOW.registerRule({
    id: 'yminify',
    //name: 'Minify JS and CSS',
    url: 'http://developer.yahoo.com/performance/rules.html#minify',
    category: ['javascript', 'css'],

    config: {
        // penalty for each unminified component
        points: 10,
        // types of components to inspect for minification
        types: ['js', 'css']
    },

    lint: function (doc, cset, config) {
        var i, len, score, minified, comp,
            inline = cset.inline,
            styles = (inline && inline.styles) || [],
            scripts = (inline && inline.scripts) || [],
            comps = cset.getComponentsByType(config.types),
            offenders = [];

        // check all peeled components
        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            // set/get minified flag
            if (typeof comp.minified === 'undefined') {
                minified = YSLOW.util.isMinified(comp.body);
                comp.minified = minified;
            } else {
                minified = comp.minified;
            }

            if (!minified) {
                offenders.push(comp);
            }
        }

        // check inline scripts/styles/whatever
        for (i = 0, len = styles.length; i < len; i += 1) {
            if (!YSLOW.util.isMinified(styles[i].body)) {
                offenders.push('inline &lt;style&gt; tag #' + (i + 1));
            }
        }
        for (i = 0, len = scripts.length; i < len; i += 1) {
            if (!YSLOW.util.isMinified(scripts[i].body)) {
                offenders.push('inline &lt;script&gt; tag #' + (i + 1));
            }
        }

        score = 100 - offenders.length * config.points;

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural('There %are% %num% component%s% that can be minified', offenders.length) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yredirects',
    //name: 'Avoid redirects',
    url: 'http://developer.yahoo.com/performance/rules.html#redirects',
    category: ['content'],

    config: {
        points: 10 // the penalty for each redirect
    },

    lint: function (doc, cset, config) {
        var i, len, comp, score,
            offenders = [],
            briefUrl = YSLOW.util.briefUrl,
            comps = cset.getComponentsByType('redirect');

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            offenders.push(briefUrl(comp.url, 80) + ' redirects to ' +
                briefUrl(comp.headers.location, 60));
        }
        score = 100 - comps.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (comps.length > 0) ? YSLOW.util.plural(
                'There %are% %num% redirect%s%',
                comps.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ydupes',
    //name: 'Remove duplicate JS and CSS',
    url: 'http://developer.yahoo.com/performance/rules.html#js_dupes',
    category: ['javascript', 'css'],

    config: {
        // penalty for each duplicate
        points: 5,
        // component types to check for duplicates
        types: ['js', 'css']
    },

    lint: function (doc, cset, config) {
        var i, url, score, len,
            hash = {},
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
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
            if (hash.hasOwnProperty(i) && hash[i].count > 1) {
                offenders.push(comps[hash[i].compindex]);
            }
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% duplicate component%s%',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yetags',
    //name: 'Configure ETags',
    url: 'http://developer.yahoo.com/performance/rules.html#etags',
    category: ['server'],

    config: {
        // points to take out for each misconfigured etag
        points: 11,
        // types to inspect for etags
        types: ['flash', 'js', 'css', 'cssimage', 'image', 'favicon']
    },

    lint: function (doc, cset, config) {

        var i, len, score, comp, etag,
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            etag = comp.headers && comp.headers.etag;
            if (etag && !YSLOW.util.isETagGood(etag)) {
                offenders.push(comp);
            }
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% component%s% with misconfigured ETags',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yxhr',
    //name: 'Make Ajax cacheable',
    url: 'http://developer.yahoo.com/performance/rules.html#cacheajax',
    category: ['content'],

    config: {
        // points to take out for each non-cached XHR
        points: 5,
        // at least an hour in cache.
        min_cache_time: 3600
    },

    lint: function (doc, cset, config) {
        var i, expiration, ts, score, cache_control,
            // far-ness in milliseconds
            min = parseInt(config.min_cache_time, 10) * 1000,
            offenders = [],
            comps = cset.getComponentsByType('xhr');

        for (i = 0; i < comps.length; i += 1) {
            // check for cache-control: no-cache and cache-control: no-store
            cache_control = comps[i].headers['cache-control'];
            if (cache_control) {
                if (cache_control.indexOf('no-cache') !== -1 ||
                        cache_control.indexOf('no-store') !== -1) {
                    continue;
                }
            }

            expiration = comps[i].expires;
            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                // looks like a Date object
                ts = new Date().getTime();
                if (expiration.getTime() > ts + min) {
                    continue;
                }
                // expires less than min_cache_time => BAD.
            }
            offenders.push(comps[i]);
        }

        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% XHR component%s% that %are% not cacheable',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yxhrmethod',
    //name: 'Use GET for AJAX Requests',
    url: 'http://developer.yahoo.com/performance/rules.html#ajax_get',
    category: ['server'],

    config: {
        // points to take out for each ajax request
        // that uses http method other than GET.
        points: 5
    },

    lint: function (doc, cset, config) {
        var i, score,
            offenders = [],
            comps = cset.getComponentsByType('xhr');

        for (i = 0; i < comps.length; i += 1) {
            if (typeof comps[i].method === 'string') {
                if (comps[i].method !== 'GET' && comps[i].method !== 'unknown') {
                    offenders.push(comps[i]);
                }
            }
        }
        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% XHR component%s% that %do% not use GET HTTP method',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ymindom',
    //name: 'Reduce the Number of DOM Elements',
    url: 'http://developer.yahoo.com/performance/rules.html#min_dom',
    category: ['content'],

    config: {
        // the range
        range: 250,
        // points to take out for each range of DOM that's more than max.
        points: 10,
        // number of DOM elements are considered too many if exceeds maxdom.
        maxdom: 900
    },

    lint: function (doc, cset, config) {
        var numdom = cset.domElementsCount,
            score = 100;

        if (numdom > config.maxdom) {
            score = 99 - Math.ceil((numdom - parseInt(config.maxdom, 10)) /
                parseInt(config.range, 10)) * parseInt(config.points, 10);
        }

        return {
            score: score,
            message: (numdom > config.maxdom) ? YSLOW.util.plural(
                'There %are% %num% DOM element%s% on the page',
                numdom
            ) : '',
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'yno404',
    //name: 'No 404s',
    url: 'http://developer.yahoo.com/performance/rules.html#no404',
    category: ['content'],

    config: {
        // points to take out for each 404 response.
        points: 5,
        // component types to be inspected for expires headers
        types: ['css', 'js', 'image', 'cssimage', 'flash', 'xhr', 'favicon']
    },

    lint: function (doc, cset, config) {
        var i, len, comp, score,
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (parseInt(comp.status, 10) === 404) {
                offenders.push(comp);
            }
        }
        score = 100 - offenders.length * parseInt(config.points, 10);
        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% request%s% that %are% 404 Not Found',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ymincookie',
    //name: 'Reduce Cookie Size',
    url: 'http://developer.yahoo.com/performance/rules.html#cookie_size',
    category: ['cookie'],

    config: {
        // points to take out if cookie size is more than config.max_cookie_size
        points: 10,
        // 1000 bytes.
        max_cookie_size: 1000
    },

    lint: function (doc, cset, config) {
        var n,
            cookies = cset.cookies,
            cookieSize = (cookies && cookies.length) || 0,
            message = '',
            score = 100;

        if (cookieSize > config.max_cookie_size) {
            n = Math.floor(cookieSize / config.max_cookie_size);
            score -= 1 + n * parseInt(config.points, 10);
            message = YSLOW.util.plural(
                'There %are% %num% byte%s% of cookies on this page',
                cookieSize
            );
        }

        return {
            score: score,
            message: message,
            components: []
        };
    }
});

YSLOW.registerRule({
    id: 'ycookiefree',
    //name: 'Use Cookie-free Domains',
    url: 'http://developer.yahoo.com/performance/rules.html#cookie_free',
    category: ['cookie'],

    config: {
        // points to take out for each component that send cookie.
        points: 5,
        // which component types should be cookie-free
        types: ['js', 'css', 'image', 'cssimage', 'flash', 'favicon']
    },

    lint: function (doc, cset, config) {
        var i, len, score, comp, cookie,
            offenders = [],
            getHostname = YSLOW.util.getHostname,
            docDomain = getHostname(cset.doc_comp.url),
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];

            // ignore /favicon.ico
            if (comp.type === 'favicon' &&
                    getHostname(comp.url) === docDomain) {
                continue;
            }

            cookie = comp.cookie;
            if (typeof cookie === 'string' && cookie.length) {
                offenders.push(comps[i]);
            }
        }
        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% component%s% that %are% not cookie-free',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'ynofilter',
    //name: 'Avoid Filters',
    url: 'http://developer.yahoo.com/performance/rules.html#no_filters',
    category: ['css'],

    config: {
        // points to take out for each AlphaImageLoader filter not using _filter hack.
        points: 5,
        // points to take out for each AlphaImageLoader filter using _filter hack.
        halfpoints: 2
    },

    lint: function (doc, cset, config) {
        var i, len, score, comp, type, count, filter_count,
            instyles = (cset.inline && cset.inline.styles) || [],
            comps = cset.getComponentsByType('css'),
            offenders = [],
            filter_total = 0,
            hack_filter_total = 0;

        for (i = 0, len = comps.length; i < len; i += 1) {
            comp = comps[i];
            if (typeof comp.filter_count === 'undefined') {
                filter_count = YSLOW.util.countAlphaImageLoaderFilter(comp.body);
                comp.filter_count = filter_count;
            } else {
                filter_count = comp.filter_count;
            }

            // offence
            count = 0;
            for (type in filter_count) {
                if (filter_count.hasOwnProperty(type)) {
                    if (type === 'hackFilter') {
                        hack_filter_total += filter_count[type];
                        count += filter_count[type];
                    } else {
                        filter_total += filter_count[type];
                        count += filter_count[type];
                    }
                }
            }
            if (count > 0) {
                comps[i].yfilters = YSLOW.util.plural('%num% filter%s%', count);
                offenders.push(comps[i]);
            }
        }

        for (i = 0, len = instyles.length; i < len; i += 1) {
            filter_count = YSLOW.util.countAlphaImageLoaderFilter(instyles[i].body);
            count = 0;
            for (type in filter_count) {
                if (filter_count.hasOwnProperty(type)) {
                    if (type === 'hackFilter') {
                        hack_filter_total += filter_count[type];
                        count += filter_count[type];
                    } else {
                        filter_total += filter_count[type];
                        count += filter_count[type];
                    }
                }
            }
            if (count > 0) {
                offenders.push('inline &lt;style&gt; tag #' + (i + 1) + ' (' +
                    YSLOW.util.plural('%num% filter%s%', count) + ')');
            }
        }

        score = 100 - (filter_total * config.points + hack_filter_total *
            config.halfpoints);

        return {
            score: score,
            message: (filter_total + hack_filter_total) > 0 ?
                'There is a total of ' + YSLOW.util.plural(
                    '%num% filter%s%',
                    filter_total + hack_filter_total
                ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yimgnoscale',
    //name: 'Don\'t Scale Images in HTML',
    url: 'http://developer.yahoo.com/performance/rules.html#no_scale',
    category: ['images'],

    config: {
        points: 5 // points to take out for each image that scaled.
    },

    lint: function (doc, cset, config) {
        var i, prop, score,
            offenders = [],
            comps = cset.getComponentsByType('image');

        for (i = 0; i < comps.length; i += 1) {
            prop = comps[i].object_prop;
            if (prop && typeof prop.width !== 'undefined' &&
                    typeof prop.height !== 'undefined' &&
                    typeof prop.actual_width !== 'undefined' &&
                    typeof prop.actual_height !== 'undefined') {
                if (prop.width < prop.actual_width ||
                        prop.height < prop.actual_height) {
                    // allow scale up
                    offenders.push(comps[i]);
                }
            }
        }
        score = 100 - offenders.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% image%s% that %are% scaled down',
                offenders.length
            ) : '',
            components: offenders
        };
    }
});

YSLOW.registerRule({
    id: 'yfavicon',
    //name: 'Make favicon Small and Cacheable',
    url: 'http://developer.yahoo.com/performance/rules.html#favicon',
    category: ['images'],

    config: {
        // points to take out for each offend.
        points: 5,
        // deduct point if size of favicon is more than this number.
        size: 2000,
        // at least this amount of seconds in cache to consider cacheable.
        min_cache_time: 3600
    },

    lint: function (doc, cset, config) {
        var ts, expiration, comp, score, cacheable,
            messages = [],
            min = parseInt(config.min_cache_time, 10) * 1000,
            comps = cset.getComponentsByType('favicon');

        if (comps.length) {
            comp = comps[0];

            // check if favicon was found
            if (parseInt(comp.status, 10) === 404) {
                messages.push('Favicon was not found');
            }

            // check size
            if (comp.size > config.size) {
                messages.push(YSLOW.util.plural(
                    'Favicon is more than %num% bytes',
                    config.size
                ));
            }
            // check cacheability
            expiration = comp.expires;

            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                // looks like a Date object
                ts = new Date().getTime();
                cacheable = expiration.getTime() >= ts + min;
            }
            if (!cacheable) {
                messages.push('Favicon is not cacheable');
            }
        }
        score = 100 - messages.length * parseInt(config.points, 10);

        return {
            score: score,
            message: (messages.length > 0) ? messages.join('\n') : '',
            components: []
        };
    }

});

YSLOW.registerRule({
    id: 'yemptysrc',
    // name: 'Avoid empty src or href',
    url: 'http://developer.yahoo.com/performance/rules.html#emptysrc',
    category: ['server'],
    config: {
        points: 100
    },
    lint: function (doc, cset, config) {
        var type, score, count,
            emptyUrl = cset.empty_url,
            offenders = [],
            messages = [],
            msg = '',
            points = parseInt(config.points, 10);

        score = 100;
        if (emptyUrl) {
            for (type in emptyUrl) {
                if (emptyUrl.hasOwnProperty(type)) {
                    count = emptyUrl[type];
                    score -= count * points;
                    messages.push(count + ' ' + type);
                }
            }
            msg = messages.join(', ') + YSLOW.util.plural(
                ' component%s% with empty link were found.',
                messages.length
            );
        }

        return {
            score: score,
            message: msg,
            components: offenders
        };
    }
});

/**
 * YSLOW.registerRuleset({
 *
 *     id: 'myalgo',
 *     name: 'The best algo',
 *     rules: {
 *         myrule: {
 *             ever: 2,
 *         }
 *     }
 *
 * });
 */

YSLOW.registerRuleset({ // yahoo default with default configuration
    id: 'ydefault',
    name: 'YSlow(V2)',
    rules: {
        ynumreq: {},
        //  1
        ycdn: {},
        //  2
        yemptysrc: {},
        yexpires: {},
        //  3
        ycompress: {},
        //  4
        ycsstop: {},
        //  5
        yjsbottom: {},
        //  6
        yexpressions: {},
        //  7
        yexternal: {},
        //  8
        ydns: {},
        //  9
        yminify: {},
        // 10
        yredirects: {},
        // 11
        ydupes: {},
        // 12
        yetags: {},
        // 13
        yxhr: {},
        // 14
        yxhrmethod: {},
        // 16
        ymindom: {},
        // 19
        yno404: {},
        // 22
        ymincookie: {},
        // 23
        ycookiefree: {},
        // 24
        ynofilter: {},
        // 28
        yimgnoscale: {},
        // 31
        yfavicon: {} // 32
    },
    weights: {
        ynumreq: 8,
        ycdn: 6,
        yemptysrc: 30,
        yexpires: 10,
        ycompress: 8,
        ycsstop: 4,
        yjsbottom: 4,
        yexpressions: 3,
        yexternal: 4,
        ydns: 3,
        yminify: 4,
        yredirects: 4,
        ydupes: 4,
        yetags: 2,
        yxhr: 4,
        yxhrmethod: 3,
        ymindom: 3,
        yno404: 4,
        ymincookie: 3,
        ycookiefree: 3,
        ynofilter: 4,
        yimgnoscale: 3,
        yfavicon: 2
    }

});

YSLOW.registerRuleset({

    id: 'yslow1',
    name: 'Classic(V1)',
    rules: {
        ynumreq: {},
        //  1
        ycdn: {},
        //  2
        yexpires: {},
        //  3
        ycompress: {},
        //  4
        ycsstop: {},
        //  5
        yjsbottom: {},
        //  6
        yexpressions: {},
        //  7
        yexternal: {},
        //  8
        ydns: {},
        //  9
        yminify: { // 10
            types: ['js'],
            check_inline: false
        },
        yredirects: {},
        // 11
        ydupes: { // 12
            types: ['js']
        },
        yetags: {} // 13
    },
    weights: {
        ynumreq: 8,
        ycdn: 6,
        yexpires: 10,
        ycompress: 8,
        ycsstop: 4,
        yjsbottom: 4,
        yexpressions: 3,
        yexternal: 4,
        ydns: 3,
        yminify: 4,
        yredirects: 4,
        ydupes: 4,
        yetags: 2
    }

});


YSLOW.registerRuleset({
    id: 'yblog',
    name: 'Small Site or Blog',
    rules: {
        ynumreq: {},
        //  1
        yemptysrc: {},
        ycompress: {},
        //  4
        ycsstop: {},
        //  5
        yjsbottom: {},
        //  6
        yexpressions: {},
        //  7
        ydns: {},
        //  9
        yminify: {},
        // 10
        yredirects: {},
        // 11
        ydupes: {},
        // 12
        ymindom: {},
        // 19
        yno404: {},
        // 22
        ynofilter: {},
        // 28
        yimgnoscale: {},
        // 31
        yfavicon: {} // 32
    },
    weights: {
        ynumreq: 8,
        yemptysrc: 30,
        ycompress: 8,
        ycsstop: 4,
        yjsbottom: 4,
        yexpressions: 3,
        ydns: 3,
        yminify: 4,
        yredirects: 4,
        ydupes: 4,
        ymindom: 3,
        yno404: 4,
        ynofilter: 4,
        yimgnoscale: 3,
        yfavicon: 2
    }
});
