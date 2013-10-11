/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, window*/
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * YSLOW.view manages the YSlow UI.
 * @class
 * @constructor
 * @param {Object} panel This panel object can be YSLOW.firefox.Panel or FirebugPanel.
 * @param {YSLOW.context} yscontext YSlow context to associated with this view.
 */
YSLOW.view = function (panel, yscontext) {
    var toolbar, elem, dialogHtml, modaldlg, copyright;

    this.panel_doc = panel.document;
    this.buttonViews = {};
    this.curButtonId = "";
    this.panelNode = panel.panelNode;

    this.loadCSS(this.panel_doc);

    toolbar = this.panel_doc.createElement("div");
    toolbar.id = "toolbarDiv";
    toolbar.innerHTML = this.getToolbarSource();
    toolbar.style.display = "block";

    elem = this.panel_doc.createElement("div");
    elem.style.display = "block";

    // create modal dialog.
    dialogHtml = '<div class="dialog-box"><h1><div class="dialog-text">text</div></h1><div class="dialog-more-text"></div><div class="buttons"><input class="dialog-left-button" type="button" value="Ok" onclick="javascript:document.ysview.closeDialog(document)"><input class="dialog-right-button" type="button" value="Cancel" onclick="javascript:document.ysview.closeDialog(document)"></div></div><div class="dialog-mask"></div>';

    modaldlg = this.panel_doc.createElement('div');
    modaldlg.id = "dialogDiv";
    modaldlg.innerHTML = dialogHtml;
    modaldlg.style.display = "none";
    // save modaldlg in view, make look up easier.
    this.modaldlg = modaldlg;

    this.tooltip = new YSLOW.view.Tooltip(this.panel_doc, panel.panelNode);

    copyright = this.panel_doc.createElement('div');
    copyright.id = "copyrightDiv";
    copyright.innerHTML = YSLOW.doc.copyright;
    this.copyright = copyright;

    if (panel.panelNode) {
        panel.panelNode.id = "yslowDiv";
        panel.panelNode.appendChild(modaldlg);
        panel.panelNode.appendChild(toolbar);
        panel.panelNode.appendChild(elem);
        panel.panelNode.appendChild(copyright);
    }
    this.viewNode = elem;
    this.viewNode.id = "viewDiv";
    this.viewNode.className = "yui-skin-sam";

    this.yscontext = yscontext;

    YSLOW.util.addEventListener(this.panelNode, 'click', function (e) {
        var help, helplink, x, y, parent;
        var doc = FBL.getContentView(panel.document);
        var toolbar = doc.ysview.getElementByTagNameAndId(panel.panelNode, "div", "toolbarDiv");

        // In order to support YSlow running on mutli-tab,
        // we need to look up helpDiv using panelNode.
        // panel_doc.getElementById('helpDiv') will always find
        // helpDiv of YSlow running on the first browser tab.
        if (toolbar) {
            helplink = doc.ysview.getElementByTagNameAndId(toolbar, "li", "helpLink");
            if (helplink) {
                x = helplink.offsetLeft;
                y = helplink.offsetTop;
                parent = helplink.offsetParent;
                while (parent) {
                    x += parent.offsetLeft;
                    y += parent.offsetTop;
                    parent = parent.offsetParent;
                }
                if (e.clientX >= x && e.clientY >= y && e.clientX < x + helplink.offsetWidth && e.clientY < y + helplink.offsetHeight) { /* clicking on help link, do nothing */
                    return;
                }
            }
            help = doc.ysview.getElementByTagNameAndId(toolbar, "div", "helpDiv");
        }
        if (help && help.style.visibility === "visible") {
            help.style.visibility = "hidden";
        }
    });

    YSLOW.util.addEventListener(this.panelNode, 'scroll', function (e) {
        var doc = FBL.getContentView(panel.document);
        var overlay = doc.ysview.modaldlg;

        if (overlay && overlay.style.display === "block") {
            overlay.style.top = panel.panelNode.scrollTop + 'px';
            overlay.style.left = panel.panelNode.scrollLeft + 'px';
        }
    });

    YSLOW.util.addEventListener(this.panelNode, 'mouseover', function (e) {
        var rule;

        if (e.target && typeof e.target === "object") {
            if (e.target.nodeName === "LABEL" && e.target.className === "rules") {
                if (e.target.firstChild && e.target.firstChild.nodeName === "INPUT" && e.target.firstChild.type === "checkbox") {
                    rule = YSLOW.controller.getRule(e.target.firstChild.value);
                    var doc = FBL.getContentView(panel.document);
                    doc.ysview.tooltip.show('<b>' + rule.name + '</b><br><br>' + rule.info, e.target);
                }
            }
        }
    });

    YSLOW.util.addEventListener(this.panelNode, 'mouseout', function (e) {
        var doc = FBL.getContentView(panel.document);
        doc.ysview.tooltip.hide();
    });

    YSLOW.util.addEventListener(this.panel_doc.defaultView ||
        this.panel_doc.parentWindow, 'resize', function (e) {
        var doc = FBL.getContentView(panel.document);
        var overlay = doc.ysview.modaldlg;

        if (overlay && overlay.style.display === "block") {
            overlay.style.display = "none";
        }
    });

};

YSLOW.view.prototype = {

    /**
     * Update the document object store in View object.
     * @param {Document} doc New Document object to be store in View.
     */
    setDocument: function (doc) {
        this.panel_doc = doc;
    },

    /**
     * Platform independent implementation (optional)
     */
    loadCSS: function () {},

    /**
     * @private
     */
    addButtonView: function (sButtonId, sHtml) {
        var btnView = this.getButtonView(sButtonId);

        if (!btnView) {
            btnView = this.panel_doc.createElement("div");
            btnView.style.display = "none";
            this.viewNode.appendChild(btnView);
            this.buttonViews[sButtonId] = btnView;
        }

        btnView.innerHTML = sHtml;
        this.showButtonView(sButtonId);
    },

    /**
     * Clear all (changeable) views
     */
    clearAllButtonView: function () {
        var views = this.buttonViews,
            node = this.viewNode,

            remove = function (v) {
                if (views.hasOwnProperty(v)) {
                    node.removeChild(views[v]);
                    delete views[v];
                }
            };

        remove('ysPerfButton');
        remove('ysCompsButton');
        remove('ysStatsButton');
    },

    /**
     * @private
     */
    showButtonView: function (sButtonId) {
        var sId,
            btnView = this.getButtonView(sButtonId);

        if (!btnView) {
            YSLOW.util.dump("ERROR: YSLOW.view.showButtonView: Couldn't find ButtonView '" + sButtonId + "'.");
            return;
        }

        // Hide all the other button views.
        for (sId in this.buttonViews) {
            if (this.buttonViews.hasOwnProperty(sId) && sId !== sButtonId) {
                this.buttonViews[sId].style.display = "none";
            }
        }

        // special handling for copyright text in grade view
        if (sButtonId === "ysPerfButton") {
            // hide the main copyright text
            if (this.copyright) {
                this.copyright.style.display = "none";
            }
        } else if (this.curButtonId === "ysPerfButton") {
            // show the main copyright text
            if (this.copyright) {
                this.copyright.style.display = "block";
            }
        }

        btnView.style.display = "block";
        this.curButtonId = sButtonId;
    },

    /**
     * @private
     */
    getButtonView: function (sButtonId) {
        return (this.buttonViews.hasOwnProperty(sButtonId) ? this.buttonViews[sButtonId] : undefined);
    },

    /**
     * @private
     */
    setButtonView: function (sButtonId, sHtml) {
        var btnView = this.getButtonView(sButtonId);

        if (!btnView) {
            YSLOW.util.dump("ERROR: YSLOW.view.setButtonView: Couldn't find ButtonView '" + sButtonId + "'.");
            return;
        }

        btnView.innerHTML = sHtml;
        this.showButtonView(sButtonId);
    },

    /**
     * Show landing page.
     */
    setSplashView: function (hideAutoRun, showAntiIframe, hideToolsInfo /*TODO: remove once tools are working*/) {
        var sHtml,
            title = 'Grade your web pages with YSlow',
            header = 'YSlow gives you:',
            text = '<li>Grade based on the performance (you can define your own rules)</li><li>Summary of the Components in the page</li><li>Chart with statistics</li><li>Tools including Smush.It and JSLint</li>',
            more_info_text = 'Learn more about YSlow and YDN';

        if (YSLOW.doc.splash) {
            if (YSLOW.doc.splash.title) {
                title = YSLOW.doc.splash.title;
            }
            if (YSLOW.doc.splash.content) {
                if (YSLOW.doc.splash.content.header) {
                    header = YSLOW.doc.splash.content.header;
                }
                if (YSLOW.doc.splash.content.text) {
                    text = YSLOW.doc.splash.content.text;
                }
            }
            if (YSLOW.doc.splash.more_info) {
                more_info_text = YSLOW.doc.splash.more_info;
            }
        }

        /* TODO: remove once tools are working */
        if (typeof hideToolsInfo !== 'undefined') {
            YSLOW.hideToolsInfo = hideToolsInfo;
        } else {
            hideToolsInfo = YSLOW.hideToolsInfo;
        }
        if (hideToolsInfo) {
            // nasty :-P
            text = text.replace(/<li>Tools[^<]+<\/li>/, '');
        }
        
        sHtml = '<div id="splashDiv">' + '<div id="splashDivCenter">' + '<b id="splashImg" width="250" height="150" alt="splash image" ></b>' + '<div id="left"><h2>' + title + '</h2>' + '<div id="content" class="padding50"><h3>' + header + '</h3><ul id="splashBullets">' + text + '</ul>';
        
        if (typeof hideAutoRun !== 'undefined') {
            YSLOW.hideAutoRun = hideAutoRun;
        } else {
            hideAutoRun = YSLOW.hideAutoRun;
        }
        if (!hideAutoRun) {
            sHtml += '<label><input type="checkbox" name="autorun" onclick="javascript:document.ysview.setAutorun(this.checked)" ';
            if (YSLOW.util.Preference.getPref("extensions.yslow.autorun", false)) {
                sHtml += 'checked';
            }
            sHtml += '> Autorun YSlow each time a web page is loaded</label>';
        }
        
        if (typeof showAntiIframe !== 'undefined') {
            YSLOW.showAntiIframe = showAntiIframe;
        } else {
            showAntiIframe = YSLOW.showAntiIframe;
        }
        if (showAntiIframe) {
            sHtml += '<label><input type="checkbox" onclick="javascript:document.ysview.setAntiIframe(this.checked)"> Check here if the current page prevents itself from being embedded/iframed. A simpler post onload detection will be used instead.</label>';
        }
        
        sHtml += '<div id="runtestDiv"><button id="runtest-btn" onclick="javascript:document.ysview.runTest()">Run Test</button></div></div><div class="footer"><div class="moreinfo">' + '<a href="javascript:document.ysview.openLink(\'https://yslow.org/\');"><b>&#187;</b>' + more_info_text + '</a></div></div></div></div></div>';

        this.addButtonView('panel_about', sHtml);
    },

    /**
     * Show progress bar.
     */
    genProgressView: function () {
        var sBody = '<div id="progressDiv"><div id="peel"><p>Finding components in the page:</p>' + '<div id="peelprogress"><div id="progbar"></div></div><div id="progtext"></div></div>' + '<div id="fetch"><p>Getting component information:</p>' + '<div id="fetchprogress"><div id="progbar2"></div></div><div id="progtext2">start...</div></div></div>';

        this.setButtonView('panel_about', sBody);
    },

    /**
     * Update progress bar with passed info.
     * @param {String} progress_type Type of progress info: either 'peel' or 'fetch'.
     * @param {Object} progress_info
     * <ul>For peel:
     * <li><code>current_step</code> - {Number} current phase of peeling</li>
     * <li><code>total_step</code> - {Number} total number peeling phases</li>
     * <li><code>message</code> - {String} Progress message</li>
     * </ul>
     * <ul>For fetch:
     * <li><code>current</code> - {Number} Number of components already downloaded </li>
     * <li><code>total</code> - {Number} Total number of componetns to be downloaded </li>
     * <li><code>last_component_url</code> - {String} URL of the last downloaded component.</li>
     * </ul>
     */
    updateProgressView: function (progress_type, progress_info) {
        var outerbar, progbar, progtext, percent, view, maxwidth, width, left,
            message = '';

        if (this.curButtonId === 'panel_about') {
            view = this.getButtonView(this.curButtonId);

            if (progress_type === 'peel') {
                outerbar = this.getElementByTagNameAndId(view, 'div', 'peelprogress');
                progbar = this.getElementByTagNameAndId(view, 'div', 'progbar');
                progtext = this.getElementByTagNameAndId(view, 'div', 'progtext');
                message = progress_info.message;
                percent = (progress_info.current_step * 100) / progress_info.total_step;
            } else if (progress_type === 'fetch') {
                outerbar = this.getElementByTagNameAndId(view, 'div', 'fetchprogress');
                progbar = this.getElementByTagNameAndId(view, 'div', 'progbar2');
                progtext = this.getElementByTagNameAndId(view, 'div', 'progtext2');
                message = progress_info.last_component_url;
                percent = (progress_info.current * 100) / progress_info.total;
            } else if (progress_type === 'message') {
                progtext = this.getElementByTagNameAndId(view, 'div', 'progtext2');
                if (progtext) {
                    progtext.innerHTML = progress_info;
                }

                return;
            } else {
                return;
            }
        }

        if (outerbar && progbar && progtext) {
            maxwidth = outerbar.clientWidth;

            if (percent < 0) {
                percent = 0;
            }
            if (percent > 100) {
                percent = 100;
            }

            percent = 100 - percent;
            width = (maxwidth * percent) / 100;
            if (width > maxwidth) {
                width = maxwidth;
            }
            left = maxwidth - parseInt(width, 10);
            progbar.style.width = parseInt(width, 10) + "px";
            progbar.style.left = parseInt(left, 10) + "px";

            progtext.innerHTML = message;
        }
    },

    /**
     * @private
     */
    updateStatusBar: function (doc) {
        var size, grade, result, info, url,
            yslow = YSLOW,
            util = yslow.util,
            view = yslow.view,
            pref = util.Preference,
            yscontext = this.yscontext;

        if (!yscontext.PAGE.statusbar) {
            // only set the bar once
            yscontext.PAGE.statusbar = true;

            // If some of the info isn't available, we have to run some code.
            if (!yscontext.PAGE.overallScore) {
                // run lint
                yslow.controller.lint(doc, yscontext);
            }
            if (!yscontext.PAGE.totalSize) {
                // collect stats
                yscontext.collectStats();
            }

            size = util.kbSize(yscontext.PAGE.totalSize);
            grade = util.prettyScore(yscontext.PAGE.overallScore);

            view.setStatusBar(grade, 'yslow_status_grade');
            view.setStatusBar(size, 'yslow_status_size');

            // Send a beacon.
            if (pref.getPref('optinBeacon', false)) {
                info = pref.getPref('beaconInfo', 'basic'),
                url = pref.getPref('beaconUrl',
                    'http://rtblab.pclick.yahoo.com/images/ysb.gif');
                result = util.getResults(yscontext, info);
                util.sendBeacon(result, info, url);
            }
        }
    },

    /**
     * @private
     */
    getRulesetListSource: function (rulesets) {
        var id, custom,
            sHtml = '',
            defaultRulesetId = YSLOW.controller.getDefaultRulesetId();

        for (id in rulesets) {
            if (rulesets[id]) {
                sHtml += '<option value="' + rulesets[id].id + '" ';
                if (!custom && rulesets[id].hasOwnProperty('custom') && rulesets[id].custom) {
                    custom = true;
                    sHtml += 'class="firstInGroup" ';
                }

                if (defaultRulesetId !== undefined && id === defaultRulesetId) {
                    sHtml += 'selected';
                }
                sHtml += '>' + rulesets[id].name + '</option>';
            }
        }
        return sHtml;
    },

    /**
     * Refresh the Ruleset Dropdown list.  This is usually called after a ruleset is created or deleted.
     */
    updateRulesetList: function () {
        var i, div, new_select,
            selects = this.panel_doc.getElementsByTagName('select'),
            rulesets = YSLOW.controller.getRegisteredRuleset(),
            sText = this.getRulesetListSource(rulesets),

            onchangeFunc = function (event) {
                var doc = FBL.getContentView(this.ownerDocument);
                doc.ysview.onChangeRuleset(event);
            };

        for (i = 0; i < selects.length; i += 1) {
            if (selects[i].id === "toolbar-rulesetList") {
                div = selects[i].parentNode;
                if (div && div.id === "toolbar-ruleset") {
                    new_select = this.panel_doc.createElement('select');
                    if (new_select) {
                        new_select.id = 'toolbar-rulesetList';
                        new_select.name = 'rulesets';
                        new_select.onchange = onchangeFunc;
                        new_select.innerHTML = sText;
                    }

                    div.replaceChild(new_select, selects[i]);
                }
            }
        }
    },

    /**
     * @private
     */
    getToolbarSource: function () {
        var view, rulesets,
            sHtml = '<div id="menu">',
            titles = {
                home: 'Home',
                grade: 'Grade',
                components: 'Components',
                stats: 'Statistics',
                tools: 'Tools'
            };

        if (YSLOW.doc && YSLOW.doc.view_names) {
            for (view in titles) {
                if (titles.hasOwnProperty(view) &&
                        YSLOW.doc.view_names[view]) {
                    titles[view] = YSLOW.doc.view_names[view];
                }
            }
        }

        rulesets = YSLOW.controller.getRegisteredRuleset();

        sHtml = '<div id="toolbar-ruleset" class="floatRight">Rulesets <select id="toolbar-rulesetList" name="rulesets" onchange="javascript:document.ysview.onChangeRuleset(event)">' + this.getRulesetListSource(rulesets) + '</select>';

        sHtml += '<button onclick="javascript:document.ysview.showRuleSettings()">Edit</button><ul id="tbActions"><li id="printLink" class="first"><a href="javascript:document.ysview.openPrintableDialog(document)"><b class="icon">&asymp;</b><em>Printable View</em></a></li><li id="helpLink"><a href="javascript:document.ysview.showHideHelp()"><b class="icon">?</b><em>Help &darr;</em></a></li></ul></div>';

        // help menu
        sHtml += '<div id="helpDiv" class="help" style="visibility: hidden">' + '<div><a href="javascript:document.ysview.openLink(\'http://yslow.org/user-guide/\')">YSlow Help</a></div>' + '<div><a href="javascript:document.ysview.openLink(\'http://yslow.org/faq/\')">YSlow FAQ</a></div>' + '<div class="new-section"><a href="javascript:document.ysview.openLink(\'http://yslow.org/blog/\')">YSlow Blog</a></div>' + '<div><a href="javascript:document.ysview.openLink(\'http://tech.groups.yahoo.com/group/exceptional-performance/\')">YSlow Community</a></div>' + '<div class="new-section"><a href="javascript:document.ysview.openLink(\'https://github.com/marcelduran/yslow/issues\')">YSlow Issues</a></div>' + '<div class="new-section"><div><a class="social yslow" href="javascript:document.ysview.openLink(\'http://yslow.org/\')">YSlow Home</a></div><div><a class="social facebook" href="javascript:document.ysview.openLink(\'http://www.facebook.com/getyslow\')">Like YSlow</a></div><div><a class="social twitter" href="javascript:document.ysview.openLink(\'http://twitter.com/yslow\')">Follow YSlow</a></div></div><div class="new-section" id="help-version">Version ' + YSLOW.version + '</div></div>';

        // toolbar nav menu
        sHtml += '<div id="nav-menu"><ul class="yui-nav" id="toolbarLinks">' +
            '<li class="first selected off" id="ysHomeButton"><a href="javascript:document.ysview.setSplashView()" onclick="javascript:document.ysview.onclickToolbarMenu(event)"><em>' + titles.home + '</em><span class="pipe"/></a></li>' +
            '<li id="ysPerfButton"><a href="javascript:document.ysview.showPerformance()" onclick="javascript:document.ysview.onclickToolbarMenu(event)"><em>' + titles.grade + '</em><span class="pipe"/></a></li>' +
            '<li id="ysCompsButton"><a href="javascript:document.ysview.showComponents()" onclick="javascript:document.ysview.onclickToolbarMenu(event)"><em>' + titles.components + '</em><span class="pipe"/></a></li>' +
            '<li id="ysStatsButton"><a href="javascript:document.ysview.showStats()" onclick="javascript:document.ysview.onclickToolbarMenu(event)"><em>' + titles.stats + '</em><span class="pipe"/></a></li>' +
            '<li id="ysToolButton"><a href="javascript:document.ysview.showTools()" onclick="javascript:document.ysview.onclickToolbarMenu(event)"><em>' + titles.tools + '</em></a></li></ul></div>';

        sHtml += '</div>';

        return sHtml;
    },

    /**
     * Show the passed view.  If nothing is passed, default view "Grade" will be shown.
     * Possible sView values are: "ysCompsButton", "ysStatsButton", "ysToolButton", "ysRuleEditButton" and "ysPerfButton".
     * If the page has not been peeled before this function is called, peeler will be run first and sView will not be displayed until
     * peeler is done.
     * @param {String} sView The view to be displayed.
     */
    show: function (sView) {
        var format = 'html',
            stext = "";

        sView = sView || this.yscontext.defaultview;

        if (this.yscontext.component_set === null) {
            // need to run peeler first.
            YSLOW.controller.run(window.top.content, this.yscontext, false);
            this.yscontext.defaultview = sView;
        } else {
            if (this.getButtonView(sView)) {
                // This view already exists, just toggle to it.
                this.showButtonView(sView);
            }
            else if ("ysCompsButton" === sView) {
                stext += this.yscontext.genComponents(format);
                this.addButtonView("ysCompsButton", stext);
            }
            else if ("ysStatsButton" === sView) {
                stext += this.yscontext.genStats(format);
                this.addButtonView("ysStatsButton", stext);
                YSLOW.renderer.plotComponents(this.getButtonView("ysStatsButton"), this.yscontext);
            }
            else if ("ysToolButton" === sView) {
                stext += this.yscontext.genToolsView(format);
                this.addButtonView("ysToolButton", stext);
            }
            else {
                // Default is Performance.
                stext += this.yscontext.genPerformance(format);
                this.addButtonView("ysPerfButton", stext);
            }

            this.panelNode.scrollTop = 0;
            this.panelNode.scrollLeft = 0;

            this.updateStatusBar(this.yscontext.document);

            // update toolbar selected tab.
            this.updateToolbarSelection();
        }
    },

    /**
     * @private
     */
    updateToolbarSelection: function () {
        var elem, ul_elem, child;

        switch (this.curButtonId) {
        case "ysCompsButton":
        case "ysPerfButton":
        case "ysStatsButton":
        case "ysToolButton":
            elem = this.getElementByTagNameAndId(this.panelNode, 'li', this.curButtonId);
            if (elem) {
                if (elem.className.indexOf("selected") !== -1) {
                    // no need to do anything.
                    return;
                } else {
                    elem.className += " selected";
                    if (elem.previousSibling) {
                        elem.previousSibling.className += " off";
                    }
                }
            }
            break;
        default:
            break;
        }

        ul_elem = this.getElementByTagNameAndId(this.panelNode, 'ul', 'toolbarLinks');
        child = ul_elem.firstChild;
        while (child) {
            if (child.id !== this.curButtonId && child.className.indexOf("selected") !== -1) {
                this.unselect(child);
                if (child.previousSibling) {
                    YSLOW.view.removeClassName(child.previousSibling, 'off');
                }
            }
            child = child.nextSibling;
        }
    },

    /**
     * Show Grade screen. Use YSLOW.view.show(). Called from UI.
     */
    showPerformance: function () {
        this.show('ysPerfButton');
    },

    /**
     * Show Stats screen. Use YSLOW.view.show(). Called from UI.
     */
    showStats: function () {
        this.show('ysStatsButton');
    },

    /**
     * Show Components screen. Use YSLOW.view.show(). Called from UI.
     */
    showComponents: function () {
        this.show('ysCompsButton');
    },

    /**
     * Show Tools screen. Use YSLOW.view.show(). Called from UI.
     */
    showTools: function () {
        this.show('ysToolButton');
    },

    /**
     * Show Rule Settings screen. Use YSLOW.view.show(). Called from UI.
     */
    showRuleSettings: function () {
        var stext = this.yscontext.genRulesetEditView('html');

        this.addButtonView("ysRuleEditButton", stext);

        this.panelNode.scrollTop = 0;
        this.panelNode.scrollLeft = 0;

        // update toolbar selected tab.
        this.updateToolbarSelection();
    },

    /**
     * Run YSlow. Called from UI.
     */
    runTest: function () {
        YSLOW.controller.run(window.top.content, this.yscontext, false);
    },

    /**
     * Set autorun preference. Called from UI.
     * @param {boolean} set Pass true to turn autorun on, false otherwise.
     */
    setAutorun: function (set) {
        YSLOW.util.Preference.setPref("extensions.yslow.autorun", set);
    },

    /**
     * Set antiiframe preference. Called from UI.
     * @param {boolean} set Pass true to use simple afterOnload verification, false otherwise.
     */
    setAntiIframe: function (set) {
        YSLOW.antiIframe = set;
    },

    /**
     * Add a custom CDN to custom CDN preference list
     * @param {string} the CDN to be added
     */
    addCDN: function (cdn) {
        var i, id,
            that = this,
            doc = document,
            ctx = that.yscontext,
            pref = YSLOW.util.Preference,
            cdns = pref.getPref('cdnHostnames', ''),
            panel = that.panel_doc,
            el = panel.getElementById('tab-label-list'),
            lis = el.getElementsByTagName('li'),
            len = lis.length;
        
        if (cdns) {
            cdns = cdns.replace(/\s+/g, '').split(',');
            cdns.push(cdn);
            cdns = cdns.join();
        } else {
            cdns = cdn;
        }
        pref.setPref('extensions.yslow.cdnHostnames', cdns);

        // get selected tab
        for (i = 0; i < len; i+= 1) {
            el = lis[i];
            if (el.className.indexOf('selected') > -1) {
                id = el.id;
                break;
            }
        }
        // re-run analysis
        YSLOW.controller.lint(ctx.document, ctx);
        that.addButtonView('ysPerfButton', ctx.genPerformance('html'));
        // update score in status bar.
        YSLOW.view.restoreStatusBar(ctx);
        that.updateToolbarSelection();
        // move tab
        el = panel.getElementById(id);
        that.onclickTabLabel({currentTarget: el}, true);
    },

    /**
     * Handle Ruleset drop down list selection change. Update default ruleset and display
     * dialog to ask users if they want to run new ruleset at once.
     * @param {DOMEvent} event onchange event of Ruleset drop down list.
     */
    onChangeRuleset: function (event) {
        var doc, line1, left_button_label, left_button_func,
            select = YSLOW.util.getCurrentTarget(event),
            option = select.options[select.selectedIndex];

        YSLOW.controller.setDefaultRuleset(option.value);

        // ask if want to rerun test with the selected ruleset.
        doc = select.ownerDocument;
        line1 = 'Do you want to run the selected ruleset now?';
        left_button_label = 'Run Test';
        left_button_func = function (e) {
            var stext;

            doc.ysview.closeDialog(doc);
            if (doc.yslowContext.component_set === null) {
                YSLOW.controller.run(doc.yslowContext.document.defaultView ||
                doc.yslowContext.document.parentWindow, doc.yslowContext, false);
            } else {
                // page peeled, just run lint.
                YSLOW.controller.lint(doc.yslowContext.document, doc.yslowContext);
            }

            stext = doc.yslowContext.genPerformance('html');
            doc.ysview.addButtonView("ysPerfButton", stext);
            doc.ysview.panelNode.scrollTop = 0;
            doc.ysview.panelNode.scrollLeft = 0;
            // update score in status bar.
            YSLOW.view.restoreStatusBar(doc.yslowContext);
            doc.ysview.updateToolbarSelection();
        };
        this.openDialog(doc, 389, 150, line1, undefined, left_button_label, left_button_func);
    },

    /**
     * @private
     * Implemented for handling onclick event of TabLabel in TabView.
     * Hide current tab content and make content associated with the newly selected tab visible.
     */
    onclickTabLabel: function (event, move_tab) {
        var child, hide_tab_id, show_tab_id, hide, show, show_tab, id_substring,
            li_elem = YSLOW.util.getCurrentTarget(event),
            ul_elem = li_elem.parentNode,
            div_elem = ul_elem.nextSibling; // yui-content div

        if (li_elem.className.indexOf('selected') !== -1 || li_elem.id.indexOf('label') === -1) {
            return false;
        }
        if (ul_elem) {
            child = ul_elem.firstChild;

            while (child) {
                if (this.unselect(child)) {
                    hide_tab_id = child.id.substring(5);
                    break;
                }
                child = child.nextSibling;
            }

            // select new tab selected.
            li_elem.className += ' selected';
            show_tab_id = li_elem.id.substring(5);

            // Go through all the tabs in yui-content to hide the old tab and show the new tab.
            child = div_elem.firstChild;
            while (child) {
                id_substring = child.id.substring(3);
                if (!hide && hide_tab_id && id_substring === hide_tab_id) {
                    if (child.className.indexOf("yui-hidden") === -1) {
                        //set yui-hidden
                        child.className += " yui-hidden";
                    }
                    hide = true;
                }
                if (!show && show_tab_id && id_substring === show_tab_id) {
                    YSLOW.view.removeClassName(child, "yui-hidden");
                    show = true;
                    show_tab = child;
                }
                if ((hide || !hide_tab_id) && (show || !show_tab_id)) {
                    break;
                }
                child = child.nextSibling;
            }

            if (move_tab === true && show === true && show_tab) {
                this.positionResultTab(show_tab, div_elem, li_elem);
            }
        }
        return false;
    },

    positionResultTab: function (tab, container, label) {
        var y, parent, delta,
            padding = 5,
            doc = this.panel_doc,
            win = doc.defaultView || doc.parentWindow,
            pageHeight = win.offsetHeight ? win.offsetHeight : win.innerHeight,
            height = label.offsetTop + tab.offsetHeight;

        container.style.height = height + 'px';
        tab.style.position = "absolute";
        tab.style.left = label.offsetLeft + label.offsetWidth + "px";
        tab.style.top = label.offsetTop + "px";

        /* now make sure tab is visible */
        y = tab.offsetTop;
        parent = tab.offsetParent;
        while (parent !== null) {
            y += parent.offsetTop;
            parent = parent.offsetParent;
        }

        if (y < this.panelNode.scrollTop || y + tab.offsetHeight > this.panelNode.scrollTop + pageHeight) {

            if (y < this.panelNode.scrollTop) {
                // scroll up
                this.panelNode.scrollTop = y - padding;
            } else {
                // scroll down
                delta = y + tab.offsetHeight - this.panelNode.scrollTop - pageHeight + padding;
                if (delta > y - this.panelNode.scrollTop) {
                    delta = y - this.panelNode.scrollTop;
                }
                this.panelNode.scrollTop += delta;
            }
        }
    },

    /**
     * Event handling for onclick event on result tab (Grade screen). Called from UI.
     * @param {DOMEevent} event onclick event
     */
    onclickResult: function (event) {
        YSLOW.util.preventDefault(event);

        return this.onclickTabLabel(event, true);
    },

    /**
     * @private
     * Helper function to unselect element.
     */
    unselect: function (elem) {
        return YSLOW.view.removeClassName(elem, "selected");
    },

    /**
     * @private
     * Helper function to filter result based on its category. (Grade Screen)
     */
    filterResult: function (doc, category) {
        var ul_elem, showAll, child, firstTab, tab, firstChild, div_elem,
            view = this.getButtonView('ysPerfButton');

        if (category === "all") {
            showAll = true;
        }

        /* go through tab-label to re-adjust hidden state */
        if (view) {
            ul_elem = this.getElementByTagNameAndId(view, "ul", "tab-label-list");
        }
        if (ul_elem) {
            child = ul_elem.firstChild;
            div_elem = ul_elem.nextSibling; // yui-content div
            tab = div_elem.firstChild;

            while (child) {
                YSLOW.view.removeClassName(child, 'first');
                if (showAll || child.className.indexOf(category) !== -1) {
                    child.style.display = "block";
                    if (firstTab === undefined) {
                        firstTab = tab;
                        firstChild = child;
                        YSLOW.view.removeClassName(tab, "yui-hidden");
                        child.className += ' first';
                        if (child.className.indexOf("selected") === -1) { /* set selected class */
                            child.className += " selected";
                        }
                        child = child.nextSibling;
                        tab = tab.nextSibling;
                        continue;
                    }
                } else {
                    child.style.display = "none";
                }

                /* hide non-first tab */
                if (tab.className.indexOf("yui-hidden") === -1) {
                    tab.className += " yui-hidden";
                }

                /* remove selected from class */
                this.unselect(child);

                child = child.nextSibling;
                tab = tab.nextSibling;
            }

            if (firstTab) { /* tab back to top position */
                this.positionResultTab(firstTab, div_elem, firstChild);
            }
        }
    },

    /**
     * Event handler of onclick event of category filter (Grade screen).  Called from UI.
     * @param {DOMEvent} event onclick event
     */
    updateFilterSelection: function (event) {
        var li,
            elem = YSLOW.util.getCurrentTarget(event);

        YSLOW.util.preventDefault(event);

        if (elem.className.indexOf("selected") !== -1) {
            return; /* click on something already selected */
        }
        elem.className += " selected";

        li = elem.parentNode.firstChild;
        while (li) {
            if (li !== elem && this.unselect(li)) {
                break;
            }
            li = li.nextSibling;
        }
        this.filterResult(elem.ownerDocument, elem.id);
    },

    /**
     * Event handler of toolbar menu.
     * @param {DOMEvent} event onclick event
     */
    onclickToolbarMenu: function (event) {
        var child,
            a_elem = YSLOW.util.getCurrentTarget(event),
            li_elem = a_elem.parentNode,
            ul_elem = li_elem.parentNode;

        if (li_elem.className.indexOf("selected") !== -1) { /* selecting an already selected target, do nothing. */
            return;
        }
        li_elem.className += " selected";

        if (li_elem.previousSibling) {
            li_elem.previousSibling.className += " off";
        }

        if (ul_elem) {
            child = ul_elem.firstChild;
            while (child) {
                if (child !== li_elem && this.unselect(child)) {
                    if (child.previousSibling) {
                        YSLOW.view.removeClassName(child.previousSibling, 'off');
                    }
                    break;
                }
                child = child.nextSibling;
            }
        }
    },

    /**
     * Expand components with the passed type. (Components Screen)
     * @param {Document} doc Document object of the YSlow Chrome window.
     * @param {String} type Component type.
     */
    expandCollapseComponentType: function (doc, type) {
        var table,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysCompsButton');

        if (view) {
            table = this.getElementByTagNameAndId(view, 'table', 'components-table');
            renderer.expandCollapseComponentType(doc, table, type);
        }
    },

    /**
     * Expand all components. (Components Screen)
     * @param {Document} doc Document object of the YSlow Chrome window.
     */
    expandAll: function (doc) {
        var table,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysCompsButton');

        if (view) {
            table = this.getElementByTagNameAndId(view, 'table', 'components-table');
            renderer.expandAllComponentType(doc, table);
        }
    },

    /**
     * Regenerate the components table. (Components Screen)
     * @param {Document} doc Document object of the YSlow Chrome window.
     * @param {String} column_name The column to sort by.
     * @param {boolean} sortDesc true if to Sort descending order, false otherwise.
     */
    regenComponentsTable: function (doc, column_name, sortDesc) {
        var table,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysCompsButton');

        if (view) {
            table = this.getElementByTagNameAndId(view, 'table', 'components-table');
            renderer.regenComponentsTable(doc, table, column_name, sortDesc, this.yscontext.component_set);
        }
    },

    /**
     * Show Component header row. (Component Screen)
     * @param {String} headersDivId id of the HTML TR element containing the component header.
     */
    showComponentHeaders: function (headersDivId) {
        var elem, td,
            view = this.getButtonView('ysCompsButton');

        if (view) {
            elem = this.getElementByTagNameAndId(view, "tr", headersDivId);
            if (elem) {
                td = elem.firstChild;
                if (elem.style.display === "none") {
                    elem.style.display = "table-row";
                } else {
                    elem.style.display = "none";
                }
            }
        }
    },

    /**
     * Open link in new tab.
     * @param {String} url URL of the page to be opened.
     */
    openLink: function (url) {
        YSLOW.util.openLink(url);
    },

    /**
     * Open link in a popup window
     * @param {String} url URL of the page to be opened.
     * @param {String} name (optional) the window name.
     * @param {Number} width (optional) the popup window width. 
     * @param {Number} height (optional) the popup window height. 
     */
    openPopup: function (url, name, width, height, features) {
        window.open(url, name || '_blank', 'width=' + (width || 626) +
            ',height=' + (height || 436) + ',' + (features ||
            'toolbar=0,status=1,location=1,resizable=1'));
    },

    /**
     * Launch tool.
     * @param {String} tool_id
     * @param {Object} param to be passed to tool's run method.
     */
    runTool: function (tool_id, param) {
        YSLOW.controller.runTool(tool_id, this.yscontext, param);
    },

    /**
     * Onclick event handler of Ruleset tab in Rule Settings screen.
     * @param {DOMEvent} event onclick event
     */
    onclickRuleset: function (event) {
        var ruleset_id, end, view, form,
            li_elem = YSLOW.util.getCurrentTarget(event),
            index = li_elem.className.indexOf('ruleset-');

        YSLOW.util.preventDefault(event);
        if (index !== -1) {
            end = li_elem.className.indexOf(' ', index + 8);
            if (end !== -1) {
                ruleset_id = li_elem.className.substring(index + 8, end);
            } else {
                ruleset_id = li_elem.className.substring(index + 8);
            }
            view = this.getButtonView('ysRuleEditButton');
            if (view) {
                form = this.getElementByTagNameAndId(view, 'form', 'edit-form');
                YSLOW.renderer.initRulesetEditForm(li_elem.ownerDocument, form, YSLOW.controller.getRuleset(ruleset_id));
            }
        }

        return this.onclickTabLabel(event, false);
    },

    /**
     * Display Save As Dialog
     * @param {Document} doc Document object of YSlow Chrome window.
     * @param {String} form_id id of the HTML form element that contains the ruleset settings to be submit (or saved).
     */
    openSaveAsDialog: function (doc, form_id) {
        var line1 = '<label>Save ruleset as: <input type="text" id="saveas-name" class="text-input" name="saveas-name" length="100" maxlength="100"></label>',
            left_button_label = 'Save',

            left_button_func = function (e) {
                var textbox, line, view, form, input,
                    doc = YSLOW.util.getCurrentTarget(e).ownerDocument;

                if (doc.ysview.modaldlg) {
                    textbox = doc.ysview.getElementByTagNameAndId(doc.ysview.modaldlg, 'input', 'saveas-name');
                }
                if (textbox) {
                    if (YSLOW.controller.checkRulesetName(textbox.value) === true) {
                        line = line1 + '<div class="error">' + textbox.value + ' ruleset already exists.</div>';
                        doc.ysview.closeDialog(doc);
                        doc.ysview.openDialog(doc, 389, 150, line, '', left_button_label, left_button_func);
                    } else {
                        view = doc.ysview.getButtonView('ysRuleEditButton');
                        if (view) {
                            form = doc.ysview.getElementByTagNameAndId(view, 'form', form_id);
                            input = doc.createElement('input');
                            input.type = 'hidden';
                            input.name = 'saveas-name';
                            input.value = textbox.value;
                            form.appendChild(input);
                            form.submit();
                        }
                        doc.ysview.closeDialog(doc);
                    }
                }

            };

        this.openDialog(doc, 389, 150, line1, undefined, left_button_label, left_button_func);
    },

    /**
     * Display Printable View Dialog
     * @param {Document} doc Document object of YSlow Chrome window.
     */
    openPrintableDialog: function (doc) {
        var line = 'Please run YSlow first before using Printable View.',
            line1 = 'Check which information you want to view or print<br>',
            line2 = '<div id="printOptions">' + '<label><input type="checkbox" name="print-type" value="grade" checked>Grade</label>' + '<label><input type="checkbox" name="print-type" value="components" checked>Components</label>' + '<label><input type="checkbox" name="print-type" value="stats" checked>Statistics</label></div>',
            left_button_label = 'Ok',

            left_button_func = function (e) {
                var i,
                    doc = YSLOW.util.getCurrentTarget(e).ownerDocument,
                    doc = FBL.getContentView(doc);

                    aInputs = doc.getElementsByName('print-type'),
                    print_type = {};

                for (i = 0; i < aInputs.length; i += 1) {
                    if (aInputs[i].checked) {
                        print_type[aInputs[i].value] = 1;
                    }
                }
                doc.ysview.closeDialog(doc);
                doc.ysview.runTool('printableview', {
                    'options': print_type,
                    'yscontext': doc.yslowContext
                });
            };

        if (doc.yslowContext.component_set === null) {
            this.openDialog(doc, 389, 150, line, '', 'Ok');
            return;
        }

        this.openDialog(doc, 389, 150, line1, line2, left_button_label, left_button_func);
    },

    /**
     * @private
     * helper function to get element with id and tagname in node.
     */
    getElementByTagNameAndId: function (node, tagname, id) {
        var i, arrElements;

        if (node) {
            arrElements = node.getElementsByTagName(tagname);
            if (arrElements.length > 0) {
                for (i = 0; i < arrElements.length; i += 1) {
                    if (arrElements[i].id === id) {
                        return arrElements[i];
                    }
                }
            }
        }

        return null;
    },

    /**
     * Helper function for displaying dialog.
     * @param {Document} doc Document object of YSlow Chrome window
     * @param {Number} width desired width of the dialog
     * @param {Number} height desired height of the dialog
     * @param {String} text1 first line of text
     * @param {String} text2 second line fo text
     * @param {String} left_button_label left button label
     * @param {Function} left_button_func onclick function of left button
     */
    openDialog: function (doc, width, height, text1, text2, left_button_label, left_button_func) {
        var i, j, dialog, text, more_text, button, inputs, win, pageWidth, pageHeight, left, top,
            overlay = this.modaldlg,
            elems = overlay.getElementsByTagName('div');

        for (i = 0; i < elems.length; i += 1) {
            if (elems[i].className && elems[i].className.length > 0) {
                if (elems[i].className === "dialog-box") {
                    dialog = elems[i];
                } else if (elems[i].className === "dialog-text") {
                    text = elems[i];
                } else if (elems[i].className === "dialog-more-text") {
                    more_text = elems[i];
                }
            }
        }

        if (overlay && dialog && text && more_text) {
            text.innerHTML = (text1 ? text1 : '');
            more_text.innerHTML = (text2 ? text2 : '');

            inputs = overlay.getElementsByTagName('input');
            for (j = 0; j < inputs.length; j += 1) {
                if (inputs[j].className === "dialog-left-button") {
                    button = inputs[j];
                }
            }
            if (button) {
                button.value = left_button_label;
                button.onclick = left_button_func || function (e) {
                    doc = FBL.getContentView(doc);
                    doc.ysview.closeDialog(doc);
                };
            }

            // position dialog to center of panel.
            win = doc.defaultView || doc.parentWindow;
            pageWidth = win.innerWidth;
            pageHeight = win.innerHeight;

            left = Math.floor((pageWidth - width) / 2);
            top = Math.floor((pageHeight - height) / 2);
            dialog.style.left = ((left && left > 0) ? left : 225) + 'px';
            dialog.style.top = ((top && top > 0) ? top : 80) + 'px';

            overlay.style.left = this.panelNode.scrollLeft + 'px';
            overlay.style.top = this.panelNode.scrollTop + 'px';
            overlay.style.display = 'block';

            // put focus on the first input.
            if (inputs.length > 0) {
                inputs[0].focus();
            }
        }

    },

    /**
     * Close the dialog.
     * @param {Document} doc Document object of YSlow Chrome window
     */
    closeDialog: function (doc) {
        var dialog = this.modaldlg;

        dialog.style.display = "none";
    },

    /**
     * Save the modified changes in the selected ruleset in Rule settings screen.
     * @param {Document} doc Document object of YSlow Chrome window
     * @param {String} form_id ID of Form element
     */
    saveRuleset: function (doc, form_id) {
        var form,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysRuleEditButton');

        if (view) {
            form = this.getElementByTagNameAndId(view, 'form', form_id);
            renderer.saveRuleset(doc, form);
        }
    },

    /**
     * Delete the selected ruleset in Rule Settings screen.
     * @param {Document} doc Document object of YSlow Chrome window
     * @param {String} form_id ID of Form element
     */
    deleteRuleset: function (doc, form_id) {
        var form,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysRuleEditButton');

        if (view) {
            form = this.getElementByTagNameAndId(view, 'form', form_id);
            renderer.deleteRuleset(doc, form);
        }
    },

    /**
     * Share the selected ruleset in Rule Settings screen.  Create a .XPI file on Desktop.
     * @param {Document} doc Document object of YSlow Chrome window
     * @param {String} form_id ID of Form element
     */
    shareRuleset: function (doc, form_id) {
        var form, ruleset_id, ruleset, result, line1,
            renderer = YSLOW.controller.getRenderer('html'),
            view = this.getButtonView('ysRuleEditButton');

        if (view) {
            form = this.getElementByTagNameAndId(view, 'form', form_id);
            ruleset_id = renderer.getEditFormRulesetId(form);
            ruleset = YSLOW.controller.getRuleset(ruleset_id);

            if (ruleset) {
                result = YSLOW.Exporter.exportRuleset(ruleset);

                if (result) {
                    line1 = '<label>' + result.message + '</label>';
                    this.openDialog(doc, 389, 150, line1, '', "Ok");
                }
            }
        }
    },

    /**
     * Reset the form selection for creating a new ruleset.
     * @param {HTMLElement} button New Set button
     * @param {String} form_id ID of Form element
     */
    createRuleset: function (button, form_id) {
        var view, form,
            li_elem = button.parentNode,
            ul_elem = li_elem.parentNode,
            child = ul_elem.firstChild;

        // unselect ruleset
        while (child) {
            this.unselect(child);
            child = child.nextSibling;
        }

        view = this.getButtonView('ysRuleEditButton');
        if (view) {
            form = this.getElementByTagNameAndId(view, 'form', form_id);
            YSLOW.renderer.initRulesetEditForm(this.panel_doc, form);
        }
    },

    /**
     * Show/Hide the help menu.
     */
    showHideHelp: function () {
        var help,
            toolbar = this.getElementByTagNameAndId(this.panelNode, "div", "toolbarDiv");

        // In order to support YSlow running on mutli-tab,
        // we need to look up helpDiv using panelNode.
        // panel_doc.getElementById('helpDiv') will always find
        // helpDiv of YSlow running on the first browser tab.
        if (toolbar) {
            help = this.getElementByTagNameAndId(toolbar, "div", "helpDiv");
        }
        if (help) {
            if (help.style.visibility === "visible") {
                help.style.visibility = "hidden";
            } else {
                help.style.visibility = "visible";
            }
        }
    },

    /**
     * Run smushIt.
     * @param {Document} doc Document object of YSlow Chrome window
     * @param {String} url URL of the image to be smushed.
     */
    smushIt: function (doc, url) {
        YSLOW.util.smushIt(url,
            function (resp) {
                var line1, line2, smushurl, dest_url,
                    txt = '';

                if (resp.error) {
                    txt += '<br><div>' + resp.error + '</div>';
                } else {
                    smushurl = YSLOW.util.getSmushUrl();
                    dest_url = YSLOW.util.makeAbsoluteUrl(resp.dest, smushurl);
                    txt += '<div>Original size: ' + resp.src_size + ' bytes</div>' + '<div>Result size: ' + resp.dest_size + ' bytes</div>' + '<div>% Savings: ' + resp.percent + '%</div>' + '<div><a href="javascript:document.ysview.openLink(\'' + dest_url + '\')">Click here to view or save the result image.</a></div>';
                }

                line1 = '<div class="smushItResult"><div>Image: ' + YSLOW.util.briefUrl(url, 250) + '</div></div>';
                line2 = txt;
                doc.ysview.openDialog(doc, 389, 150, line1, line2, "Ok");
            }
        );
    },

    checkAllRules: function (doc, form_id, check) {
        var i, view, form, aElements;

        if (typeof check !== "boolean") {
            return;
        }
        view = this.getButtonView('ysRuleEditButton');
        if (view) {
            form = this.getElementByTagNameAndId(view, 'form', form_id);
            aElements = form.elements;
            for (i = 0; i < aElements.length; i += 1) {
                if (aElements[i].type === "checkbox") {
                    aElements[i].checked = check;
                }
            }
        }
    },

    // exposed for access from content scope (Firebug UI, panel.html)
    // See: https://blog.mozilla.org/addons/2012/08/20/exposing-objects-to-content-safely/
    __exposedProps__: {
        "openLink": "rw",
        "showComponentHeaders": "rw",
        "smushIt": "rw",
        "saveRuleset": "rw",
        "regenComponentsTable": "rw",
        "expandCollapseComponentType": "rw",
        "expandAll": "rw",
        "updateFilterSelection": "rw",
        "openPopup": "rw",
        "runTool": "rw",
        "onclickRuleset": "rw",
        "createRuleset": "rw",
        "addCDN": "rw",
        "closeDialog": "rw",
        "setAutorun": "rw",
        "setAntiIframe": "rw",
        "runTest": "rw",
        "onChangeRuleset": "rw",
        "showRuleSettings": "rw",
        "openPrintableDialog": "rw",
        "showHideHelp": "rw",
        "setSplashView": "rw",
        "onclickToolbarMenu": "rw",
        "showPerformance": "rw",
        "showComponents": "rw",
        "showStats": "rw",
        "showTools": "rw",
        "onclickResult": "rw",
    },
};

YSLOW.view.Tooltip = function (panel_doc, parentNode) {
    this.tooltip = panel_doc.createElement('div');
    if (this.tooltip) {
        this.tooltip.id = "tooltipDiv";
        this.tooltip.innerHTML = '';
        this.tooltip.style.display = "none";
        if (parentNode) {
            parentNode.appendChild(this.tooltip);
        }
    }
    this.timer = null;
};

YSLOW.view.Tooltip.prototype = {

    show: function (text, target) {
        var tooltip = this;

        this.text = text;
        this.target = target;
        this.tooltipData = {
            'text': text,
            'target': target
        };
        this.timer = YSLOW.util.setTimer(function () {
            tooltip.showX();
        }, 500);
    },

    showX: function () {
        if (this.tooltipData) {
            this.showTooltip(this.tooltipData.text, this.tooltipData.target);
        }
        this.timer = null;
    },

    showTooltip: function (text, target) {
        var tooltipWidth, tooltipHeight, parent, midpt_x, midpt_y, sClass, new_x,
            padding = 10,
            x = 0,
            y = 0,
            doc = target.ownerDocument,
            win = doc.defaultView || doc.parentWindow,
            pageWidth = win.offsetWidth ? win.offsetWidth : win.innerWidth,
            pageHeight = win.offsetHeight ? win.offsetHeight : win.innerHeight;

        this.tooltip.innerHTML = text;
        this.tooltip.style.display = "block";

        tooltipWidth = this.tooltip.offsetWidth;
        tooltipHeight = this.tooltip.offsetHeight;

        if (tooltipWidth > pageWidth || tooltipHeight > pageHeight) {
            // forget it, the viewport is too small, don't bother.
            this.tooltip.style.display = "none";
            return;
        }

        parent = target.offsetParent;
        while (parent !== null) {
            x += parent.offsetLeft;
            y += parent.offsetTop;
            parent = parent.offsetParent;
        }
        x += target.offsetLeft;
        y += target.offsetTop;

        if (x < doc.ysview.panelNode.scrollLeft || y < doc.ysview.panelNode.scrollTop || (y + target.offsetHeight > doc.ysview.panelNode.scrollTop + pageHeight)) {
            // target is not fully visible.
            this.tooltip.style.display = "none";
            return;
        }

        midpt_x = x + target.offsetWidth / 2;
        midpt_y = y + target.offsetHeight / 2;

        //decide if tooltip will fit to the right
        if (x + target.offsetWidth + padding + tooltipWidth < pageWidth) {
            // fit to the right?
            x += target.offsetWidth + padding;
            // check vertical alignment
            if ((y >= doc.ysview.panelNode.scrollTop) && (y - padding + tooltipHeight + padding <= doc.ysview.panelNode.scrollTop + pageHeight)) {
                y = y - padding;
                sClass = 'right top';
            } else {
                // align bottom
                y += target.offsetHeight - tooltipHeight;
                sClass = 'right bottom';
            }
        } else {
            if (y - tooltipHeight - padding >= doc.ysview.panelNode.scrollTop) {
                // put it to the top.
                y -= tooltipHeight + padding;
                sClass = 'top';
            } else {
                // put it to the bottom.
                y += target.offsetHeight + padding;
                sClass = 'bottom';
            }
            new_x = Math.floor(midpt_x - tooltipWidth / 2);
            if ((new_x >= doc.ysview.panelNode.scrollLeft) && (new_x + tooltipWidth <= doc.ysview.panelNode.scrollLeft + pageWidth)) {
                x = new_x;
            } else if (new_x < doc.ysview.panelNode.scrollLeft) {
                x = doc.ysview.panelNode.scrollLeft;
            } else {
                x = doc.ysview.panelNode.scrollLeft + pageWidth - padding - tooltipWidth;
            }
        }

        if (sClass) {
            this.tooltip.className = sClass;
        }
        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    },

    hide: function () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.tooltip.style.display = "none";
    }

};

/**
 * Set YSlow status bar text.
 * @param {String} text text to put on status bar
 * @param {String} sId id of the status bar element to put the text.
 */
YSLOW.view.setStatusBar = function (text, sId) {
    var el = document.getElementById(sId || 'yslow_status_grade');

    if (el) {
        el.value = text;
    }
};

/**
 * Clear YSlow status bar text.
 */
YSLOW.view.clearStatusBar = function () {
    this.setStatusBar("", "yslow_status_time");
    this.setStatusBar("YSlow", "yslow_status_grade");
    this.setStatusBar("", "yslow_status_size");
};

/**
 * Restore YSlow status bar text
 * @param {YSLOW.context} yscontext YSlow context that contains page result and statistics.
 */
YSLOW.view.restoreStatusBar = function (yscontext) {
    var grade, size, t_done;

    if (yscontext) {
        if (yscontext.PAGE.overallScore) {
            grade = YSLOW.util.prettyScore(yscontext.PAGE.overallScore);
            this.setStatusBar(grade, "yslow_status_grade");
        }
        if (yscontext.PAGE.totalSize) {
            size = YSLOW.util.kbSize(yscontext.PAGE.totalSize);
            this.setStatusBar(size, "yslow_status_size");
        }
        if (yscontext.PAGE.t_done) {
            t_done = yscontext.PAGE.t_done / 1000 + "s";
            this.setStatusBar(t_done, "yslow_status_time");
        }
    }
};

/**
 * Toggle YSlow in status bar.
 * @param {Boolean} bhide show or hide YSlow in status bar.
 */
YSLOW.view.toggleStatusBar = function (bHide) {
    document.getElementById('yslow-status-bar').hidden = bHide;
};

/**
 * Remove name from element's className.
 * @param {HTMLElement} element
 * @param {String} name name to be removed from className.
 * @return true if name is found in element's classname
 */
YSLOW.view.removeClassName = function (element, name) {
    var i, names;

    if (element && element.className && element.className.length > 0 && name && name.length > 0) {
        names = element.className.split(" ");
        for (i = 0; i < names.length; i += 1) {
            if (names[i] === name) {
                names.splice(i, 1);
                element.className = names.join(" ");
                return true;
            }
        }
    }

    return false;
};
