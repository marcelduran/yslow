/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components, gBrowser, window, Firebug, FBL, FirebugContext*/
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * This class implements Firefox's nsIWebProgressListener.
 * It listens to tab progress, especially onLocationChange.
 *
 * @class
 */
var tabProgressListener = {
    QueryInterface: function (iid) {
        if (iid.equals(Components.interfaces.nsIWebProgressListener) || iid.equals(Components.interfaces.nsISupportsWeakReference) || iid.equals(Components.interfaces.nsISupports)) {
            return this;
        }

        throw Components.results.NS_NOINTERFACE;
    },

    stateIsRequest: false,
    onLocationChange: function (progress, request, uri) {
        // Only watch windows that are their own parent - e.g. not frames
        if (progress.DOMWindow.parent === progress.DOMWindow) {
            YSLOW.firefox.watchTopWindow(progress.DOMWindow);
        }
    },
    onStateChange: function () {},
    onProgressChange: function () {},
    onStatusChange: function () {},
    onSecurityChange: function () {},
    onLinkIconAvailable: function () {}
};


/**
 * Firefox integration
 *
 * @namespace YSLOW
 * @class firefox
 * @static
 */

YSLOW.firefox = {

    http_observer: null,

    panel: null,

    init: function () {

        // register networking support from Firefox
        YSLOW.net.registerNative(YSLOW.firefox.net);

        if (YSLOW.util.Preference.getPref("extensions.yslow.observeNetwork", true) && !this.http_observer) {
            this.http_observer = new YSLOW.firefox.observer();
        }

        window.addEventListener("load", function (event) {
            gBrowser.addProgressListener(tabProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
        }, false);

        YSLOW.controller.init();

        // add yslow event listeners.
        YSLOW.util.event.addListener("peelStart", this.onPeelStart, this);
        YSLOW.util.event.addListener("peelProgress", this.showPeelProgress, this);
        YSLOW.util.event.addListener("componentFetchProgress", this.showFetchProgress, this);
        YSLOW.util.event.addListener("componentFetchDone", this.onFetchDone, this);

        YSLOW.view.toggleStatusBar(YSLOW.util.Preference.getPref("extensions.yslow.hidestatusbar"));
    },

    startup: function (wmode) {
        this.windowMode = wmode;

        if (typeof Firebug !== 'undefined') {
            if (typeof FBL === 'undefined' || (typeof FBL !== 'undefined' &&
                    typeof FBL.extend !== 'function')) {
                YSLOW.util.setTimer(function() {
                    YSLOW.firefox.startup(wmode);
                }, 10);
                return;
            }

            try {
                if (Firebug === null) {
                    FBL.ns(function () {
                        YSLOW.FBYSlow.init();
                    });
                } else {
                    YSLOW.FBYSlow.init();
                }
            } catch (err) {
                YSLOW.util.dump("YSLOW.firefox.startup():" + err);
            }
            return;
        } else {
            YSLOW.util.setTimer(function() {
                YSLOW.firefox.startup(wmode);
            }, 10);
            return;
        }

        YSLOW.firefox.init();
    },

    shutdown: function () {
        var i, browser,
            observer = this.http_observer;

        if (observer && typeof observer.unregister === 'function') {
            observer.unregister();
            delete this.http_observer;
        }

        gBrowser.removeProgressListener(tabProgressListener);
        for (i = 0; i < gBrowser.browsers.length; i += 1) {
            browser = gBrowser.browsers[i];
            YSLOW.firefox.unwatchTopWindow(browser.contentWindow);
        }
    },

    close: function () {
        var panel = document.getElementById("yslow-content-box"),
            splitter = document.getElementById("yslow-content-splitter");

        splitter.collapsed = panel.collapsed = true;
    },

    run: function (autorun) {
        var context;

        if (typeof FirebugContext !== 'undefined' ||
                typeof Firebug.currentContext !== 'undefined') {
            Firebug.YSlow.run(autorun);
            return;
        }

        if (this.panel && this.panel.yslowContext) {
            this.panel.getPanel();
            context = this.panel.yslowContext;
        } else {
            context = new YSLOW.context(window.top.content.document);
        }
        YSLOW.controller.run(this.win, context, autorun);
    },

    watchBrowser: function (browser) {
        return this.watchTopWindow(browser.contentWindow);
    },

    unwatchBrowser: function (browser) {
        return this.unwatchTopWindow(browser.contentWindow);
    },

    watchLoadedTopWindow: function (win) {
        var t_start, yslow_context,
            now = Number(new Date());

        YSLOW.view.clearStatusBar();

        if (this.panel) {
            t_start = this.panel.browser.t_start;
            this.panel.getPanel();
            if (this.panel.yslowContext) {
                yslow_context = this.panel.yslowContext;
            } else {
                yslow_context = new YSLOW.context(window.top.content.document);
            }
            yslow_context.PAGE.loaded = true;

            if (t_start !== undefined && yslow_context) {
                yslow_context.PAGE.t_done = now - t_start;
                YSLOW.view.setStatusBar(yslow_context.PAGE.t_done / 1000 + "s", "yslow_status_time");
                this.panel.browser.t_start = undefined;
            }
        }

        // fire onload event.
        YSLOW.util.event.fire('onload', {
            'time': now,
            'window': win
        });
        if (YSLOW.util.Preference.getPref("extensions.yslow.autorun", false)) {
            YSLOW.controller.run(win, yslow_context, true);
        }
    },

    watchTopWindow: function (win) {
        win.addEventListener("pageshow", YSLOW.firefox.onPageShow, true);
        win.addEventListener("pagehide", YSLOW.firefox.onPageHide, true);
        win.addEventListener("DOMContentLoaded", YSLOW.firefox.onDOMContentLoaded, true);

        this.win = win;
        if (typeof FirebugContext !== 'undefined' ||
                typeof Firebug.currentContext !== 'undefined') {
            if (this.panel === null) {
                this.panel = new YSLOW.firefox.Panel();
            }
        }
    },

    unwatchTopWindow: function (win) {
        if (this.panel) {
            this.panel.destroy();
        }
    },

    onPageShow: function (event) {
        var win = event.currentTarget;

        win.removeEventListener("pageshow", YSLOW.firefox.onPageShow, true);
        YSLOW.util.setTimer(function () {
            YSLOW.firefox.watchLoadedTopWindow(win);
        });
    },

    onPageHide: function (event) {
        var win = event.currentTarget;

        win.removeEventListener("pagehide", YSLOW.firefox.onPageHide, true);
        if (event.persisted) {
            YSLOW.firefox.unwatchTopWindow(win);
        } else {
            win.addEventListener("unload", YSLOW.firefox.onUnload, true);
        }
    },

    onDOMContentLoaded: function (event) {
        var win = event.currentTarget,
            now = Number(new Date());

        YSLOW.util.setTimer(function () {
            YSLOW.util.event.fire('onDOMContentLoaded', {
                'time': now,
                'window': win
            });
        });
    },

    onUnload: function (event) {
        var win = event.currentTarget,
            now = Number(new Date());

        win.removeEventListener("unload", YSLOW.firefox.onUnload, true);
        YSLOW.firefox.unwatchTopWindow(win);

        // fire onUnload event.
        YSLOW.util.event.fire('onUnload', {
            'time': now,
            'window': win
        });

        // Clear status bar
        YSLOW.view.clearStatusBar();

        // Save the time this page UNloads, so we can determine the total load time of the NEXT page.
        // We save it in the browser object so that it is persistant ACROSS page loads, but separated
        // from one browser tab to another.
        if (YSLOW.firefox.panel) {
            YSLOW.firefox.panel.browser.t_start = now;
        }
    },

    onClickStatusIcon: function () {
        if (typeof FirebugContext !== 'undefined' ||
                typeof Firebug.currentContext !== 'undefined') {
            Firebug.YSlow.onClickStatusIcon();
            return;
        }

        // toggle panel
        this.togglePanel();
    },

    onClickStatusSize: function () {
        if (typeof FirebugContext !== 'undefined' ||
                typeof Firebug.currentContext !== 'undefined') {
            Firebug.YSlow.onClickStatusSize();
            return;
        }

        // toggle panel
        this.togglePanel(true);
        this.panel.doView("ysStatsButton");
    },

    onClickStatusGrade: function () {
        if (typeof FirebugContext !== 'undefined' ||
                typeof Firebug.currentContext !== 'undefined') {
            Firebug.YSlow.onClickStatusGrade();
            return;
        }

        // toggle panel
        this.togglePanel(true);
        this.panel.doView("ysPerfButton");
    },

    togglePanel: function (forceOpen) {
        var panel = document.getElementById("yslow-content-box"),
            splitter = document.getElementById("yslow-content-splitter");

        splitter.collapsed = panel.collapsed = (forceOpen === undefined) ? !panel.collapsed : !forceOpen;
    },

    /**
     * Called from .xul
     */
    onToggleOption: function (menuitem) {
        var option = menuitem.getAttribute("option"),
            checked = menuitem.getAttribute("checked") === 'true';

        YSLOW.util.Preference.setPref("extensions." + option, checked);
        if (option === "yslow.hidestatusbar") {
            document.getElementById("yslow-status-bar").hidden = checked;
        }
    },

    /**
     * Called from .xul
     */
    onOptionsShowing: function (popup) {
        var child, option, checked;

        for (child = popup.firstChild; child; child = child.nextSibling) {
            if (child.localName === "menuitem") {
                option = child.getAttribute("option");
                if (option) {
                    checked = YSLOW.util.Preference.getPref("extensions." + option);

                    child.setAttribute("checked", checked);
                }
            }
        }
    },

    gotoYSlowHome: function () {
        gBrowser.selectedTab = gBrowser.addTab("http://developer.yahoo.com/yslow");
    },

    onPeelStart: function (event_object) {
        this.panel.createProgressBar();
    },

    onFetchDone: function (event_object) {
        this.panel.removeProgressBar();
        this.panel.doView();
    },

    showPeelProgress: function (event_object) {
        this.panel.setPeelProgress(event_object);
    },

    showFetchProgress: function (event_object) {
        this.panel.setFetchProgress(event_object);
    }

};

YSLOW.firefox.Panel = function () {
    var panel = document.getElementById("yslow-Output"),
        doc = panel.contentDocument;

    this.document = doc;
    if (panel) {
        this.initialize();
    }
};

YSLOW.firefox.Panel.prototype = {

    browser: {
        t_start: undefined
    },

    initialize: function () {
        this.panelNode = this.document.createElement("div");
        this.panelNode.ownerPanel = this;
        this.panelNode.id = "yslowDiv";
        this.panelNode.className = "panelNode panelNode-YSlow2";
        this.document.body.appendChild(this.panelNode);

        this.initializeNode();
    },

    initializeNode: function () {

        this.yslowContext = this.document.yslowContext = new YSLOW.context(window.top.content.document);

        this.ysview = new YSLOW.view(this, this.document.yslowContext);
        YSLOW.ysview = this.ysview;
        this.document.ysview = this.ysview;

        this.ysview.setSplashView();

    },

    destroy: function () {
        if (this.panelNode) {
            this.document.body.removeChild(this.panelNode);
            this.panelNode = undefined;
        }
    },

    getPanel: function () {
        if (this.panelNode) {
            this.destroy();
        }
        if (this.panelNode === undefined) {
            this.initialize();
        }
        return this;
    },

    createProgressBar: function () {
        this.ysview.genProgressView();
    },

    removeProgressBar: function () {},

    setPeelProgress: function (progress) {
        this.ysview.updateProgressView('peel', progress);
    },

    setFetchProgress: function (progress) {
        this.ysview.updateProgressView('fetch', progress);
    },

    doView: function (sView) {
        this.ysview.show(sView);
    }

};
