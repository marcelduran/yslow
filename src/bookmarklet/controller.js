/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YUI, YSLOW*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, continue: true, browser: true, maxerr: 50, indent: 4 */

YUI().use(function (iY) {
    var sbY = YUI({
        win: window,
        doc: document
    });

    // sandbox YUI
    iY.Get.script = function () {
        return sbY.Get.script.apply(sbY, arguments);
    };

    iY.use('features', 'node-base', 'node-style', 'yql', 'jsonp-url', 'yslow-config', function (Y) {
        var 
            iwin, idoc, fetchCount, fetchTotal, iframeNode,

            win = Y.config.win,
            doc = Y.config.doc,
            config = Y.namespace('YSLOW').config,
            arrayEach = Y.Array.each,
            objEach = Y.Object.each,
            encode = win.encodeURIComponent,

            URL_MAX_LEN = Y.UA.ie && Y.UA.ie < 7 ? 1800 : 6000,
            YQL_REQ_TABLE = config.table ? 'use "' + config.table + '";' : '',
            YQL_REQ_URL_LEN = 230 + encode(YQL_REQ_TABLE).length,
            YQL_REQ_SEP_LEN = 9, //%22%2C%22 = ","
            YQL_REQ_UA = win.navigator.userAgent,
            YQL_REQ_UA_LEN = encode('"' + YQL_REQ_UA + '"').length,

            yscontext = new YSLOW.context(doc),
            reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i,
            iframe = Y.one('#YSLOW-bookmarklet');

        if (config.yql) {
            Y.YQLRequest.BASE_URL = ':/' + '/' + config.yql;
        }

        // init YSlow iframe
        YSLOW.bookmarklet = true;
        iframeNode = Y.Node.getDOMNode(iframe);
        iframeNode.style.cssText = 'display:block;background:#fff;' +
            'border:1px solid #000;position:fixed;bottom:0;left:0;height:50%;' +
            'width:100%;z-index:2147483647;_position:absolute;_height:350px;';
        iwin = iframeNode.contentWindow;
        idoc = iwin.document;
        idoc.body.innerHTML = '<div style="display:none;" id="yslowDiv"></div>';
        iwin.panelNode = idoc.getElementById('yslowDiv');

        // make mobile viewport wider
        if (Y.one('meta[name=viewport]')) {
            iframe.setStyles({
                position: 'absolute',
                width: '974px'
            });
        }

        // make YSLOW compatible
        YSLOW.controller.init();
        idoc.ysview = new YSLOW.view(iwin, yscontext);
        idoc.yslowContext = yscontext;

        function closeYSlow(e) {
            e.preventDefault();
            try {
                delete win.YSLOW;
            } catch (err) {
                win.YSLOW = null;
            }
            iframe.remove();
        }

        function fullScreen(e) {
            var target = e.target.ancestor('li', true),
                fs = target.hasClass('restore');

            e.preventDefault();
            iframe.setStyle('height', (fs ? 50 : 100) + '%');
            target.toggleClass('restore');
        }

        // YUI control for YSLOW inside an iframe
        YUI({win: iwin, doc: idoc}).use('features', 'node-base', 'node-style', function (iY) {
            var create = iY.Node.create,
                closeBtn = create('<li id="fsClose"><a href="#">' +
                    '<b class="icon">X</b><em>Close</em></a></li>'),
                fsBtn = create('<li id="fsLink"><a href="#">' +
                    '<b class="icon exp">&and;</b><em class="exp">Expand</em>' +
                    '<b class="icon res">&or;</b><em class="res">Restore</em>' +
                    '</a></li>');

            iY.Get.css(config.host + config.css);
            closeBtn.on('click', closeYSlow);
            fsBtn.on('click', fullScreen);
            // start in fullscreen mode on mobile, but ipad
            if (Y.UA.mobile) {
                if (!Y.UA.ipad) {
                    fsBtn.addClass('restore');
                    iframe.setStyle('height', '100%');
                } else {
                    iframe.setStyle('width', '100%');
                }
            }
            iY.one('#tbActions').insert(fsBtn, 1);
            iY.one('#tbActions').append(closeBtn);

            // remove buttons
            // TODO: put them back once tools are working
            iY.one('#ysToolButton').remove();
            iY.one('#printLink').remove();
        });
        
        function buildComponentSet(comps) {
            var i, comp, len,
                baseHref = YSLOW.peeler.getBaseHref(doc),
                cset = new YSLOW.ComponentSet(doc);

            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                cset.addComponent(comp.href, comp.type,
                    comp.base ? comp.base : baseHref, {
                        obj: comp.obj,
                        component: comp,
                        comp: comp
                    });
            }

            return cset;
        }

        function breakDownUrls(urls) {
            var len = YQL_REQ_URL_LEN + YQL_REQ_UA_LEN,
                chunk = [],
                res = [];

            arrayEach(urls, function (url) {
                len += encode(url).length + YQL_REQ_SEP_LEN;
                if (len <= URL_MAX_LEN || !chunk.length) {
                    chunk.push(url);
                } else {
                    res.push('"' + chunk.join('","') + '"');
                    len = YQL_REQ_URL_LEN + YQL_REQ_UA_LEN +
                        encode(url).length + YQL_REQ_SEP_LEN;
                    chunk = [url];
                }
            });
            res.push('"' + chunk.join('","') + '"');

            return res;
        }

        function peelDone(cset) {
            YSLOW.util.event.fire('componentFetchProgress', {
                'total': fetchTotal + 2,
                'current': fetchTotal + 2,
                'last_component_url': 'Done'
            });
            yscontext.component_set = cset;
            YSLOW.util.event.fire('peelComplete', {
                'component_set': cset
            });
            cset.notifyPeelDone();
        }

        // set cookies for components in the same domain as main document
        function setSameDomainCookies(cset) {
            var i, len, comp,
                getHostname = YSLOW.util.getHostname,
                docDomain = getHostname(cset.doc_comp.url),
                comps = cset.components,
                cookies = cset.cookies;

            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                if (getHostname(comp.url) === docDomain &&
                        comp.cookie.length < cookies.length) {
                    comp.cookie = cookies;
                } 
            }
        }

        function showError() {
            idoc.ysview.openDialog(idoc, 400, 150,
                'Ooops! An error occured fetching page components. ' +
                'Plese try again.', null, 'OK', function () {
                    idoc.ysview.setSplashView(true, true, true);
                    idoc.ysview.closeDialog(idoc);
                });
        }

        function parseYQL(r, hash, comps) {
            var cset,
                query = r.query,
                res = query && query.results;

            if (!res || r.error) {
                return showError();
            }

            YSLOW.util.event.fire('componentFetchProgress', {
                'total': fetchTotal + 2,
                'current': fetchTotal - fetchCount,
                'last_component_url': YSLOW.util.plural('%num% component%s% fetched',
                    (query && query.count) || 0)
            });

            res = res && res.resources;
            arrayEach(res, function (v) {
                // find and get comp from comps hash
                var comp,
                    redir = v.redirect,
                    rawHeaders = '';

                // check for redirect
                if (redir) {
                    redir = [].concat(redir);
                    comp = hash[redir[0].url];
                    arrayEach(redir, function (red) {
                        var headers = {};

                        // normalize headers, yql introduced result in response
                        red.headers = red.headers.result || red.headers;

                        objEach(red.headers, function (value, key) {
                            headers[key.toLowerCase()] = value;
                        });
                        comps.push({
                            url: red.url,
                            href: red.url,
                            rawHeaders: 'Location: ' + headers.location + '\n',
                            status: red.status,
                            headers: headers,
                            type: 'redirect'
                        });
                    });
                } else {
                    comp = hash[v.url];
                }
                comp.href = comp.url = v.url;

                // normalize headers, yql introduced result in response
                v.headers = v.headers.result || v.headers;

                // build raw headers
                objEach(v.headers, function (v, k) {
                    rawHeaders += k + ': ' + v + '\n';
                });
                comp.rawHeaders = rawHeaders;

                comp.status = v.status;
                comp.headers = v.headers;
                comp.content = v.content;
            });

            if (!(fetchCount -= 1)) {
                cset = buildComponentSet(comps);
                YSLOW.util.event.fire('componentFetchProgress', {
                    'total': fetchTotal + 2,
                    'current': fetchTotal + 1,
                    'last_component_url': 'Checking post onload components'
                });
                cset.inline = YSLOW.util.getInlineTags(doc);
                cset.domElementsCount = YSLOW.util.countDOMElements(doc);
                cset.cookies = YSLOW.util.getDocCookies(doc);
                setSameDomainCookies(cset);
                cset.components = YSLOW.util.setInjected(doc,
                    cset.components, cset.doc_comp.body);
                cset.setAfterOnload(peelDone);
            }
        }

        function request(hash, comps, urls) {
            urls = breakDownUrls(urls);
            fetchCount = fetchTotal = urls.length;
            
            arrayEach(urls, function (url) {
                Y.YQL(YQL_REQ_TABLE + 
                    'select * from data.headers where url in (' + url + ') and ua="' +
                    YQL_REQ_UA + '";', {
                        on: {
                            success: parseYQL,
                            failure: showError,
                            timeout: showError
                        },
                        args: [hash, comps]
                    });
            });
        }

        function fetchResult(result) {
            var i, comp, url, len,
                hash = {},
                urls = [],
                comps = [];

            for (i = 0, len = result.length; i < len; i += 1) {
                comp = result[i];
                url = comp.href;
                if (url && !reIgnore.test(url)) {
                    hash[url] = comp;
                    comps.push(comp);
                    urls.push(url);
                } else if (!url) {
                    comps.push(comp);
                }
            }

            return request(hash, comps, urls);
        }

        YSLOW.controller.run = function (win, yscontext, autorun) {
            YSLOW.util.event.fire('peelStart');
            fetchResult(YSLOW.peeler.peel(doc));
        };

        YSLOW.util.event.addListener('peelStart', function () {
            idoc.ysview.genProgressView();
        });
        YSLOW.util.event.addListener('peelProgress', function (progress) {
            idoc.ysview.updateProgressView('peel', progress);
        });
        YSLOW.util.event.addListener('componentFetchProgress', function (progress) {
            idoc.ysview.updateProgressView('fetch', progress);
        });
        YSLOW.util.event.addListener('componentFetchDone', function () {
            idoc.ysview.show();
        });
        
        idoc.ysview.setSplashView(true, true, true);
    });
});
