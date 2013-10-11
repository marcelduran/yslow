/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * @namespace YSLOW
 * @class controller
 * @static
 */

YSLOW.controller = {

    rules: {},

    rulesets: {},

    onloadTimestamp: null,

    renderers: {},

    default_ruleset_id: 'ydefault',

    run_pending: 0,

    /**
     * Init code.  Add event listeners.
     */
    init: function () {
        var arr_rulesets, i, obj, value;

        // listen to onload event.
        YSLOW.util.event.addListener("onload", function (e) {
            this.onloadTimestamp = e.time;
            YSLOW.util.setTimer(function () {
                YSLOW.controller.run_pending_event();
            });
        }, this);

        // listen to onunload event.
        YSLOW.util.event.addListener("onUnload", function (e) {
            this.run_pending = 0;
            this.onloadTimestamp = null;
        }, this);

        // load custom ruleset
        arr_rulesets = YSLOW.util.Preference.getPrefList("customRuleset.", undefined);
        if (arr_rulesets && arr_rulesets.length > 0) {
            for (i = 0; i < arr_rulesets.length; i += 1) {
                value = arr_rulesets[i].value;
                if (typeof value === "string" && value.length > 0) {
                    obj = JSON.parse(value, null);
                    obj.custom = true;
                    this.addRuleset(obj);
                }
            }
        }

        this.default_ruleset_id = YSLOW.util.Preference.getPref("defaultRuleset", 'ydefault');

        // load rule config preference
        this.loadRulePreference();
    },

    /**
     * Run controller to start peeler. Don't start if the page is not done loading.
     * Delay the running until onload event.
     *
     * @param {Window} win window object
     * @param {YSLOW.context} yscontext YSlow context to use.
     * @param {Boolean} autorun value to indicate if triggered by autorun
     */
    run: function (win, yscontext, autorun) {
        var cset, line,
            doc = win.document;

        if (!doc || !doc.location || doc.location.href.indexOf("about:") === 0 || "undefined" === typeof doc.location.hostname) {
            if (!autorun) {
                line = 'Please enter a valid website address before running YSlow.';
                YSLOW.ysview.openDialog(YSLOW.ysview.panel_doc, 389, 150, line, '', 'Ok');
            }
            return;
        }

        // Since firebug 1.4, onload event is not passed to YSlow if firebug
        // panel is not opened. Recommendation from firebug dev team is to
        // refresh the page before running yslow, which is unnecessary from
        // yslow point of view.  For now, just don't enforce running YSlow
        // on a page has finished loading.
        if (!yscontext.PAGE.loaded) {
            this.run_pending = {
                'win': win,
                'yscontext': yscontext
            };
            // @todo: put up spining logo to indicate waiting for page finish loading.
            return;
        }

        YSLOW.util.event.fire("peelStart", undefined);
        cset = YSLOW.peeler.peel(doc, this.onloadTimestamp);
        // need to set yscontext_component_set before firing peelComplete,
        // otherwise, may run into infinite loop.
        yscontext.component_set = cset;
        YSLOW.util.event.fire("peelComplete", {
            'component_set': cset
        });

        // notify ComponentSet peeling is done.
        cset.notifyPeelDone();
    },

    /**
     * Start pending run function.
     */
    run_pending_event: function () {
        if (this.run_pending) {
            this.run(this.run_pending.win, this.run_pending.yscontext, false);
            this.run_pending = 0;
        }
    },

    /**
     * Run lint function of the ruleset matches the passed rulset_id.
     * If ruleset_id is undefined, use Controller's default ruleset.
     * @param {Document} doc Document object of the page to run lint.
     * @param {YSLOW.context} yscontext YSlow context to use.
     * @param {String} ruleset_id ID of the ruleset to run.
     * @return Lint result
     * @type YSLOW.ResultSet
     */
    lint: function (doc, yscontext, ruleset_id) {
        var rule, rules, i, conf, result, weight, score,
            ruleset = [],
            results = [],
            total_score = 0,
            total_weight = 0,
            that = this,
            rs = that.rulesets,
            defaultRuleSetId = that.default_ruleset_id;

        if (ruleset_id) {
            ruleset = rs[ruleset_id];
        } else if (defaultRuleSetId && rs[defaultRuleSetId]) {
            ruleset = rs[defaultRuleSetId];
        } else {
            // if no ruleset, take the first one available
            for (i in rs) {
                if (rs.hasOwnProperty(i) && rs[i]) {
                    ruleset = rs[i];
                    break;
                }
            }
        }

        rules = ruleset.rules;
        for (i in rules) {
            if (rules.hasOwnProperty(i) && rules[i] &&
                    this.rules.hasOwnProperty(i)) {
                try {
                    rule = this.rules[i];
                    conf = YSLOW.util.merge(rule.config, rules[i]);

                    result = rule.lint(doc, yscontext.component_set, conf);

                    // apply rule weight to result.
                    weight = (ruleset.weights ? ruleset.weights[i] : undefined);
                    if (weight !== undefined) {
                        weight = parseInt(weight, 10);
                    }
                    if (weight === undefined || weight < 0 || weight > 100) {
                        if (rs.ydefault.weights[i]) {
                            weight = rs.ydefault.weights[i];
                        } else {
                            weight = 5;
                        }
                    }
                    result.weight = weight;

                    if (result.score !== undefined) {
                        if (typeof result.score !== "number") {
                            score = parseInt(result.score, 10);
                            if (!isNaN(score)) {
                                result.score = score;
                            }
                        }

                        if (typeof result.score === 'number') {
                            total_weight += result.weight;

                            if (!YSLOW.util.Preference.getPref('allowNegativeScore', false)) {
                                if (result.score < 0) {
                                    result.score = 0;
                                }
                                if (typeof result.score !== 'number') {
                                    // for backward compatibilty of n/a
                                    result.score = -1;
                                }
                            }

                            if (result.score !== 0) {
                                total_score += result.score * (typeof result.weight !== 'undefined' ? result.weight : 1);
                            }
                        }
                    }

                    result.name = rule.name;
                    result.category = rule.category;
                    result.rule_id = i;

                    results[results.length] = result;
                } catch (err) {
                    YSLOW.util.dump("YSLOW.controller.lint: " + i, err);
                    YSLOW.util.event.fire("lintError", {
                        'rule': i,
                        'message': err
                    });
                }
            }
        }

        yscontext.PAGE.overallScore = total_score / (total_weight > 0 ? total_weight : 1);
        yscontext.result_set = new YSLOW.ResultSet(results, yscontext.PAGE.overallScore, ruleset);
        yscontext.result_set.url = yscontext.component_set.doc_comp.url;
        YSLOW.util.event.fire("lintResultReady", {
            'yslowContext': yscontext
        });

        return yscontext.result_set;
    },

    /**
     * Run tool that matches the passed tool_id
     * @param {String} tool_id ID of the tool to be run.
     * @param {YSLOW.context} yscontext YSlow context
     * @param {Object} param parameters to be passed to run method of tool.
     */
    runTool: function (tool_id, yscontext, param) {
        var result, html, doc, h, css, uri, req2, l, s, message, body,
            tool = YSLOW.Tools.getTool(tool_id);

        try {
            if (typeof tool === "object") {
                result = tool.run(yscontext.document, yscontext.component_set, param);
                if (tool.print_output) {
                    html = '';
                    if (typeof result === "object") {
                        html = result.html;
                    } else if (typeof result === "string") {
                        html = result;
                    }
                    doc = YSLOW.util.getNewDoc();
                    body = doc.body || doc.documentElement;
                    body.innerHTML = html;
                    h = doc.getElementsByTagName('head')[0];
                    if (typeof result.css === "undefined") {
                        // use default.
                        uri = 'chrome://yslow/content/yslow/tool.css';
                        req2 = new XMLHttpRequest();
                        req2.open('GET', uri, false);
                        req2.send(null);
                        css = req2.responseText;
                    } else {
                        css = result.css;
                    }
                    if (typeof css === "string") {
                        l = doc.createElement("style");
                        l.setAttribute("type", "text/css");
                        l.appendChild(doc.createTextNode(css));
                        h.appendChild(l);
                    }

                    if (typeof result.js !== "undefined") {
                        s = doc.createElement("script");
                        s.setAttribute("type", "text/javascript");
                        s.appendChild(doc.createTextNode(result.js));
                        h.appendChild(s);
                    }
                    if (typeof result.plot_component !== "undefined" && result.plot_component === true) {
                        // plot components
                        YSLOW.renderer.plotComponents(doc, yscontext);
                    }
                }
            } else {
                message = tool_id + " is not a tool.";
                YSLOW.util.dump(message);
                YSLOW.util.event.fire("toolError", {
                    'tool_id': tool_id,
                    'message': message
                });
            }
        } catch (err) {
            YSLOW.util.dump("YSLOW.controller.runTool: " + tool_id, err);
            YSLOW.util.event.fire("toolError", {
                'tool_id': tool_id,
                'message': err
            });
        }
    },

    /**
     * Find a registered renderer with the passed id to render the passed view.
     * @param {String} id ID of renderer to be used. eg. 'html'
     * @param {String} view id of view, e.g. 'reportcard', 'stats' and 'components'
     * @param {Object} params parameter object to pass to XXXview method of renderer.
     * @return content the renderer generated.
     */
    render: function (id, view, params) {
        var renderer = this.renderers[id],
            content = '';

        if (renderer.supports[view] !== undefined && renderer.supports[view] === 1) {
            switch (view) {
            case 'components':
                content = renderer.componentsView(params.comps, params.total_size);
                break;
            case 'reportcard':
                content = renderer.reportcardView(params.result_set);
                break;
            case 'stats':
                content = renderer.statsView(params.stats);
                break;
            case 'tools':
                content = renderer.toolsView(params.tools);
                break;
            case 'rulesetEdit':
                content = renderer.rulesetEditView(params.rulesets);
                break;
            }
        }
        return content;

    },

    /**
     * Get registered renderer with the passed id.
     * @param {String} id ID of the renderer
     */
    getRenderer: function (id) {
        return this.renderers[id];
    },

    /**
     * @see YSLOW.registerRule
     */
    addRule: function (rule) {
        var i, doc_obj,
            required = ['id', 'name', 'config', 'info', 'lint'];

        // check YSLOW.doc class for text
        if (YSLOW.doc.rules && YSLOW.doc.rules[rule.id]) {
            doc_obj = YSLOW.doc.rules[rule.id];
            if (doc_obj.name) {
                rule.name = doc_obj.name;
            }
            if (doc_obj.info) {
                rule.info = doc_obj.info;
            }
        }

        for (i = 0; i < required.length; i += 1) {
            if (typeof rule[required[i]] === 'undefined') {
                throw new YSLOW.Error('Interface error', 'Improperly implemented rule interface');
            }
        }
        if (this.rules[rule.id] !== undefined) {
            throw new YSLOW.Error('Rule register error', rule.id + " is already defined.");
        }
        this.rules[rule.id] = rule;
    },

    /**
     * @see YSLOW.registerRuleset
     */
    addRuleset: function (ruleset, update) {
        var i, required = ['id', 'name', 'rules'];

        for (i = 0; i < required.length; i += 1) {
            if (typeof ruleset[required[i]] === 'undefined') {
                throw new YSLOW.Error('Interface error', 'Improperly implemented ruleset interface');
            }
            if (this.checkRulesetName(ruleset.id) && update !== true) {
                throw new YSLOW.Error('Ruleset register error', ruleset.id + " is already defined.");
            }
        }
        this.rulesets[ruleset.id] = ruleset;
    },

    /**
     * Remove ruleset from controller.
     * @param {String} ruleset_id ID of the ruleset to be deleted.
     */
    removeRuleset: function (ruleset_id) {
        var ruleset = this.rulesets[ruleset_id];

        if (ruleset && ruleset.custom === true) {
            delete this.rulesets[ruleset_id];

            // if we are deleting the default ruleset, change default to 'ydefault'.
            if (this.default_ruleset_id === ruleset_id) {
                this.default_ruleset_id = 'ydefault';
                YSLOW.util.Preference.setPref("defaultRuleset", this.default_ruleset_id);
            }
            return ruleset;
        }

        return null;
    },

    /**
     * Save ruleset to preference.
     * @param {YSLOW.Ruleset} ruleset ruleset to be saved.
     */
    saveRulesetToPref: function (ruleset) {
        if (ruleset.custom === true) {
            YSLOW.util.Preference.setPref("customRuleset." + ruleset.id, JSON.stringify(ruleset, null, 2));
        }
    },

    /**
     * Remove ruleset from preference.
     * @param {YSLOW.Ruleset} ruleset ruleset to be deleted.
     */
    deleteRulesetFromPref: function (ruleset) {
        if (ruleset.custom === true) {
            YSLOW.util.Preference.deletePref("customRuleset." + ruleset.id);
        }
    },

    /**
     * Get ruleset with the passed id.
     * @param {String} ruleset_id ID of ruleset to be retrieved.
     */
    getRuleset: function (ruleset_id) {
        return this.rulesets[ruleset_id];
    },

    /**
     * @see YSLOW.registerRenderer
     */
    addRenderer: function (renderer) {
        this.renderers[renderer.id] = renderer;
    },

    /**
     * Return a hash of registered ruleset objects.
     * @return a hash of rulesets with ruleset_id => ruleset
     */
    getRegisteredRuleset: function () {
        return this.rulesets;
    },

    /**
     * Return a hash of registered rule objects.
     * @return all the registered rule objects in a hash. rule_id => rule object
     */
    getRegisteredRules: function () {
        return this.rules;
    },

    /**
     * Return the rule object identified by rule_id
     * @param {String} rule_id ID of rule object to be retrieved.
     * @return rule object.
     */
    getRule: function (rule_id) {
        return this.rules[rule_id];
    },

    /**
     * Check if name parameter is conflict with any existing ruleset name.
     * @param {String} name Name to check.
     * @return true if name conflicts, false otherwise.
     * @type Boolean
     */
    checkRulesetName: function (name) {
        var id, ruleset,
            rulesets = this.rulesets;

        name = name.toLowerCase();
        for (id in rulesets) {
            if (rulesets.hasOwnProperty(id)) {
                ruleset = rulesets[id];
                if (ruleset.id.toLowerCase() === name ||
                        ruleset.name.toLowerCase() === name) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * Set default ruleset.
     * @param {String} id ID of the ruleset to be used as default.
     */
    setDefaultRuleset: function (id) {
        if (this.rulesets[id] !== undefined) {
            this.default_ruleset_id = id;
            // save to pref
            YSLOW.util.Preference.setPref("defaultRuleset", id);
        }
    },

    /**
     * Get default ruleset.
     * @return default ruleset
     * @type YSLOW.Ruleset
     */
    getDefaultRuleset: function () {
        if (this.rulesets[this.default_ruleset_id] === undefined) {
            this.setDefaultRuleset('ydefault');
        }
        return this.rulesets[this.default_ruleset_id];
    },

    /**
     * Get default ruleset id
     * @return ID of the default ruleset
     * @type String
     */
    getDefaultRulesetId: function () {
        return this.default_ruleset_id;
    },

    /**
     * Load user preference for some rules. This is needed before enabling user writing ruleset yslow plugin.
     */
    loadRulePreference: function () {
        var rule = this.getRule('yexpires'),
            minSeconds = YSLOW.util.Preference.getPref("minFutureExpiresSeconds", 2 * 24 * 60 * 60);

        if (minSeconds > 0 && rule) {
            rule.config.howfar = minSeconds;
        }
    }
};
