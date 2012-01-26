/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, chrome, window*/
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, browser: true, maxerr: 50, indent: 4 */
(function () {
    var comps, baseHref, fetchCount, reqCount, el, currentTab, docBody,
        doc = document,
        yscontext = new YSLOW.context(doc),
        windowId = parseInt(location.hash.slice(1), 10),
        reIgnore = /^(chrome\-extension|data|chrome|javascript|about|resource|jar|file):/i;

    YSLOW.view.prototype.loadCSS = function () {};
    window.panelNode = doc.getElementById('yslowDiv');
    YSLOW.controller.init();
    doc.ysview = new YSLOW.view(window, yscontext);
    doc.yslowContext = yscontext;

    // remove buttons
    // TODO: put them back once tools are working
    el = doc.getElementById('ysToolButton');
    if (el) {
        el.parentNode.removeChild(el);
    }
    el = doc.getElementById('printLink');
    if (el) {
        el.parentNode.removeChild(el);
    }

    function peelDone() {
        var cset = yscontext.component_set;

        YSLOW.util.event.fire('componentFetchProgress', {
            'total': fetchCount + 2,
            'current': fetchCount + 2,
            'last_component_url': 'Done'
        });
        YSLOW.util.event.fire('peelComplete', {
            'component_set': cset
        });
        cset.notifyPeelDone();
    }

    function getCookies(comp, last) {
        chrome.cookies.getAll({url: comp.url}, function (cookies) {
            var i, len, cookie,
                cookieStr = '';

            for (i = 0, len = cookies.length; i < len; i += 1) {
                cookie = cookies[i];
                cookieStr += cookie.name + '=' + cookie.value + '; ';
            }
            comp.cookie = cookieStr;

            if (last) {
                peelDone();
            }
        });
    }

    function getDocCookies(cookies) {
        var i, len,
            cset = yscontext.component_set,
            comps = cset.components;
        
        cset.cookies = cookies;

        for (i = 0, len = comps.length; i < len; i += 1) {
            getCookies(comps[i], i === len - 1);
        }
    }

    function domElementsCount(count) {
        yscontext.component_set.domElementsCount = count;

        chrome.tabs.sendRequest(currentTab.id, {
            action: 'getDocCookies'
        }, getDocCookies);
    }
    
    function inlineTags(inline) {
        yscontext.component_set.inline = inline;

        chrome.tabs.sendRequest(currentTab.id, {
            action: 'domElementsCount'
        }, domElementsCount);
    }

    function buildComponentSet(comps) {
        var i, comp, len,
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
        yscontext.component_set = cset;

        chrome.tabs.sendRequest(currentTab.id, {
            action: 'inlineTags'
        }, inlineTags);
    }

    function setInjected(comps) {
        chrome.tabs.sendRequest(currentTab.id, {
            action: 'injected',
            docBody: docBody,
            components: comps
        }, buildComponentSet);
    }

    function checkRender(url) {
        var i, len, comp;

        reqCount += 1;
        YSLOW.util.event.fire('componentFetchProgress', {
            'total': fetchCount + 2,
            'current': reqCount,
            'last_component_url': url
        });
        if (reqCount === fetchCount) {
            YSLOW.util.event.fire('componentFetchProgress', {
                'total': fetchCount + 2,
                'current': fetchCount + 1,
                'last_component_url': 'Checking post onload components'
            });
            docBody = '';
            for (i = 0, len = comps.length; i < len; i += 1) {
                comp = comps[i];
                if (comp.type === 'doc') {
                    docBody = comp.content;
                    break;
                }
            }
            chrome.tabs.sendRequest(currentTab.id, {
                action: 'afterOnload',
                docBody: docBody,
                components: comps
            }, setInjected);
        }
    }

    function request(comp) {
        var xhr;

        if (!comp.href || reIgnore.test(comp.href)) {
            if (!comp.href) {
                comps.push(comp);
            }
            return checkRender();
        }

        comp.url = comp.href;
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                comp.status = xhr.status;
                comp.content = xhr.responseText;
                comp.rawHeaders = xhr.getAllResponseHeaders() || '';
                comps.push(comp);
                checkRender(comp.href);
            }
        };
        xhr.open('GET', comp.href, true);
        xhr.send();
    }

    function fetchResult(result) {
        var i,
            len = result.length;

        comps = [];
        fetchCount = len;
        reqCount = 0;
        for (i = 0; i < len; i += 1) {
            request(result[i]);
        }
    }

    function peel(base) {
        baseHref = base;
        chrome.tabs.sendRequest(currentTab.id, {action: 'peel'}, fetchResult);
    }

    function run() {
        chrome.tabs.getSelected(windowId, function (tab) {
            if (tab.status === 'complete') {
                currentTab = tab;
                chrome.tabs.sendRequest(tab.id, {action: 'run'}, peel);
            } else {
                doc.ysview.updateProgressView('message',
                    'page still loading, waiting...');
                setTimeout(run, 250);    
            }
        });
    }

    YSLOW.controller.run = function () {
        chrome.tabs.getSelected(windowId, function (tab) {
            if (!tab.url.indexOf('https://chrome.google.com/') ||
                    !tab.url.indexOf('chrome://') ||
                    !tab.url.indexOf('about:') ||
                    !tab.url.indexOf('chrome-extension://')) {
                doc.ysview.openDialog(doc, 400, 150,
                    'For security reasons Chrome extensions cannot run ' +
                    'content scripts at this page.', null, 'OK');
                
                return;
            } else {
                yscontext.result_set = null;
                doc.ysview.clearAllButtonView();
                YSLOW.util.event.fire('peelStart');
                run();
            }
        });
    };

    YSLOW.util.event.addListener('peelStart', function () {
        doc.ysview.genProgressView();
    });
    YSLOW.util.event.addListener('peelProgress', function (progress) {
        doc.ysview.updateProgressView('peel', progress);
    });
    YSLOW.util.event.addListener('componentFetchProgress', function (progress) {
        doc.ysview.updateProgressView('fetch', progress);
    });
    YSLOW.util.event.addListener('componentFetchDone', function () {
        doc.ysview.show();
    });

    doc.ysview.setSplashView(true, true, true);
}());
