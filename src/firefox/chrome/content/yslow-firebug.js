/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Firebug, FBL, FirebugContext, content, TabWatcher*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * Firebug integration
 * @class
 * @static
 */

YSLOW.FBYSlow = {
    /**
     * Initialize YSlowModule and YSlowPanel.
     */
    init: function () {
        /**
         * @class Firebug
         */
        Firebug.YSlow = FBL.extend(Firebug.Module, {
            initialize: function (prefDomain, prefNames) {
                // nasty hack to workaround FB init issues
                YSLOW.FBModInitialized = true;

                YSLOW.net.registerNative(YSLOW.FBYSlow.net);
                YSLOW.controller.init();

                // add yslow event listeners.
                YSLOW.util.event.addListener("peelStart", this.ysOnPeelStart, this);
                YSLOW.util.event.addListener("peelProgress", this.ysShowPeelProgress, this);
                YSLOW.util.event.addListener("componentFetchProgress", this.ysShowFetchProgress, this);
                YSLOW.util.event.addListener("componentFetchDone", this.ysOnFetchDone, this);

                YSLOW.view.toggleStatusBar(YSLOW.util.Preference.getPref("extensions.yslow.hidestatusbar"));
            },

            showContext: function (browser, context) {
                YSLOW.view.clearStatusBar();
                if (context && context.yslowContext) {
                    YSLOW.view.restoreStatusBar(context.yslowContext);
                }
            },

            loadedContext: function (context) {
                if (!context.yslowContext) {
                    context.yslowContext = YSLOW.latest_yslowContext;
                }
            },

            reattachContext: function (context) {
                var panel,
                    fbCtx = typeof FirebugContext !== 'undefined' ?
                        FirebugContext : Firebug.currentContext;

                if (fbCtx && !fbCtx.getPanel('YSlow').document.yslowContext) {
                    // Save a pointer back to this object from the iframe's document:
                    panel = fbCtx.getPanel('YSlow');
                    panel.document.yslow_panel = panel;
                    panel.document.yslowContext = fbCtx.yslowContext;

                    var doc = FBL.getContentView(panel.document);
                    doc.ysview = panel.ysview;
                    // update the document object we store in ysview
                    panel.ysview.setDocument(panel.document);
                    // reload all css.
                    panel.ysview.loadCSS(panel.document);
                }
            },

            destroyContext: function (context) {
                delete YSLOW.latest_yslowContext;
            },

            shutdown: function () {
                if (Firebug.getPref('defaultPanelName') === 'YSlow') { /* optional */
                    Firebug.setPref('defaultPanelname', 'console');
                }
            },

            showPanel: function (browser, panel) {
                var isYSlow = panel && panel.name === "YSlow",
                    YSlowButtons = Firebug.chrome.$("fbYSlowButtons");

                FBL.collapse(YSlowButtons, !isYSlow);
            },

            watchWindow: function (context, win) {
                if (win === win.top) {
                    // for some really fast pages, the onload attachement occursi
                    // after the onload actually fires, hence force loading
                    if (context.window.document.readyState === 'complete') {
                        this.yslowOnDOMContentLoaded({currentTarget: win});   
                        this.yslowOnload({currentTarget: win});
                    } else {
                        context.window.addEventListener("load", this.yslowOnload, false);
                        context.window.addEventListener("DOMContentLoaded", this.yslowOnDOMContentLoaded, false);
                    }
                    context.window.addEventListener("beforeunload", this.yslowUnload, false);
                }
            },

            unwatchWindow: function (context, win) {
                if (win === win.top) {
                    content.window.removeEventListener("load", this.yslowOnload, false);
                    context.window.removeEventListener("beforeunload", this.yslowUnload, false);
                    context.window.removeEventListener("DOMContentLoaded", this.yslowOnDOMContentLoaded, false);
                }
            },

            yslowOnload: function (event) {
                var t_start, fbcontext,
                    fbCtx = typeof FirebugContext !== 'undefined' ?
                        FirebugContext : Firebug.currentContext,
                    now = Number(new Date()),
                    win = event.currentTarget;

                // onload event from another browser tab.
                // don't peel or update status bar, just save the page load time and return.
                if (win !== fbCtx.window) {
                    fbcontext = TabWatcher.getContextByWindow(win);
                } else {
                    fbcontext = fbCtx;
                }
                // This cause initialNode to be called, thus creating fbCtx.yslowContext.
                t_start = fbcontext.browser.t_start;
                fbcontext.getPanel('YSlow');
                fbcontext.yslowContext.PAGE.loaded = true;

                // Display the page load time
                if (t_start !== undefined) {
                    fbcontext.yslowContext.PAGE.t_done = now - t_start;
                    fbcontext.browser.t_start = undefined;
                }
                // fire onload event.
                YSLOW.util.event.fire('onload', {
                    'time': now,
                    'window': win
                });

                if (fbcontext !== fbCtx) {
                    return;
                }
                if (fbcontext.yslowContext.PAGE.t_done) {
                    YSLOW.view.setStatusBar(fbcontext.yslowContext.PAGE.t_done / 1000 + "s", "yslow_status_time");
                }

                if (YSLOW.util.Preference.getPref("extensions.yslow.autorun", false)) {
                    YSLOW.controller.run(win, fbcontext.yslowContext, true);
                }
            },

            yslowUnload: function (event) {
                var fbcontext,
                    fbCtx = typeof FirebugContext !== 'undefined' ?
                        FirebugContext : Firebug.currentContext,
                    win = event.currentTarget,
                    now = Number(new Date());

                // fire onUnload event.
                // unload event from another browser tab.
                // don't peel or update status bar, just save the page load time and return.
                if (win !== fbCtx.window) {
                    fbcontext = TabWatcher.getContextByWindow(win);
                } else {
                    fbcontext = fbCtx;
                }
                // Save the time this page UNloads, so we can determine the total load time of the NEXT page.
                // We save it in the browser object so that it is persistant ACROSS page loads, but separated
                // from one browser tab to another.
                fbcontext.browser.t_start = now;
                YSLOW.util.event.fire('onUnload', {
                    'time': now,
                    'window': win
                });

                if (fbcontext !== fbCtx) {
                    return;
                }

                // Clear status bar
                YSLOW.view.clearStatusBar();
            },

            yslowOnDOMContentLoaded: function (event) {
                var win = event.currentTarget,
                    now = Number(new Date());

                YSLOW.util.event.fire('onDOMContentLoaded', {
                    'time': now,
                    'window': win
                });
            },

            ysOnPeelStart: function (event_object) {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                fbCtx.getPanel('YSlow').createProgressBar();
            },

            ysOnFetchDone: function (event_object) {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                fbCtx.getPanel("YSlow").removeProgressBar();
                fbCtx.getPanel("YSlow").doView();
            },

            ysShowPeelProgress: function (event_object) {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                fbCtx.getPanel("YSlow").setPeelProgress(event_object);
            },

            ysShowFetchProgress: function (event_object) {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                fbCtx.getPanel("YSlow").setFetchProgress(event_object);
            },

            run: function (autorun) {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                YSLOW.controller.run(fbCtx.window, fbCtx.yslowContext, false);
            },

            onClickStatusIcon: function () {
                Firebug.toggleBar(undefined, "YSlow");
            },

            onClickStatusSize: function () {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                Firebug.toggleBar(true, "YSlow");
                fbCtx.getPanel("YSlow").doView("ysStatsButton");
            },

            onClickStatusGrade: function () {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                Firebug.toggleBar(true, "YSlow");
                fbCtx.getPanel("YSlow").doView("ysPerfButton");
            }

        });

        function YSlowFBPanel() {}
        YSlowFBPanel.prototype = FBL.extend(Firebug.Panel, {

            name: "YSlow",
            title: "YSlow",
            searchable: true,
            editable: false,

            initialize: function (context, doc) {
                // nasty hack to workaround FB init issues
                if (!YSLOW.FBModInitialized) {
                    Firebug.YSlow.initialize();
                }

                this.context = context;
                this.document = doc;
                this.panelNode = doc.createElement("div");
                this.panelNode.ownerPanel = this;
                this.panelNode.id = "yslowDiv";
                FBL.setClass(this.panelNode, "panelNode panelNode-" + this.name);
                doc.body.appendChild(this.panelNode);

                this.initializeNode(this.panelNode);
            },

            initializeNode: function () {
                this.context.yslowContext = new YSLOW.context(this.context.window.document);

                // Save a pointer back to this object from the iframe's document.
                this.document.yslow_panel = this;
                this.document.yslowContext = this.context.yslowContext;

                this.ysview = new YSLOW.view(this, this.context.yslowContext);
                YSLOW.ysview = this.ysview;

                var doc = FBL.getContentView(this.document);
                doc.ysview = this.ysview;

                this.ysview.setSplashView();
            },

            show: function () {
                var fbCtx = typeof FirebugContext !== 'undefined' ?
                    FirebugContext : Firebug.currentContext;

                YSLOW.latest_yslowContext = fbCtx.yslowContext;

                // There is only ONE DOCUMENT shared by all browser tabs. So if the user opens two
                // browser tabs, we have to restore the appropriate yslowContext when switching between tabs.
                this.document.yslowContext = fbCtx.yslowContext;

                var doc = FBL.getContentView(this.document);
                doc.ysview = this.ysview;
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
            },

            // tooltip
            showInfoTip: function (infoTip, target, x, y) {
                if (target.nodeName === "A" && target.rel && (target.rel === 'image' || target.rel === 'cssimage')) {
                    return Firebug.InfoTip.populateImageInfoTip(infoTip, target.href);
                }
                return false;
            },

            /**
             * Global Search
             */
            search: function (text) {
                var row, sel;

                if (!text) {
                    delete this.currentSearch;
                    return false;
                }

                if (this.currentSearch && text === this.currentSearch.text) {
                    row = this.currentSearch.findNext(true);
                } else {
                    this.currentSearch = new FBL.TextSearch(this.panelNode, function (node) {
                        return node.parentNode;
                    });
                    row = this.currentSearch.find(text);
                }

                if (row) {
                    sel = this.document.defaultView.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(this.currentSearch.range);
                    FBL.scrollIntoCenterView(row, this.panelNode);
                    return true;
                }

                return false;
            }

        });

        Firebug.registerModule(Firebug.YSlow);
        Firebug.registerPanel(YSlowFBPanel);
    }
};
