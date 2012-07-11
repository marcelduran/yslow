/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint unparam: true, continue: true, sloppy: true, type: true, maxerr: 50, indent: 4 */

/**
 * Renderer class
 *
 * @class
 */
YSLOW.renderer = {

    sortBy: 'type',

    sortDesc: false,

    bPrintable: false,

    colors: {
        doc: '#8963df',
        redirect: '#FC8C8C',
        iframe: '#FFDFDF',
        xhr: '#89631f',
        flash: '#8D4F5B',
        js: '#9fd0e8',
        css: '#aba5eb',
        cssimage: '#677ab8',
        image: '#d375cd',
        favicon: '#a26c00',
        unknown: '#888888'
    },

    reset: function () {
        this.sortBy = 'type';
        this.sortDesc = false;
    },

    genStats: function (stats, bCacheFull) {
        var hCount, hSize, nHttpRequests, aTypes, cache_type, i, sType, sText,
            tableHtml = '',
            totalSize = 0;

        if (!stats.PAGE) {
            return '';
        }

        if (bCacheFull) {
            hCount = stats.PAGE.totalObjCountPrimed;
            hSize = stats.PAGE.totalObjSizePrimed;
            nHttpRequests = stats.PAGE.totalRequestsPrimed;
            totalSize = stats.PAGE.totalSizePrimed;
        } else {
            hCount = stats.PAGE.totalObjCount;
            hSize = stats.PAGE.totalObjSize;
            nHttpRequests = stats.PAGE.totalRequests;
            totalSize = stats.PAGE.totalSize;
        }

        // Iterate over the component types and format the SUMMARY results.

        // One row for each component type.
        aTypes = YSLOW.peeler.types;
        cache_type = (bCacheFull) ? 'primed' : 'empty';
        for (i = 0; i < aTypes.length; i += 1) {
            sType = aTypes[i];
            if (typeof hCount[sType] !== 'undefined') {
                tableHtml += '<tr><td class="legend">' +
                    '<div class="stats-legend" style="background: ' +
                    this.colors[sType] +
                    '">&nbsp;</div></td><td class="count">' +
                    hCount[sType] +
                    '</td><td class="type">' +
                    YSLOW.util.prettyType(sType) +
                    '</td><td class="size">' +
                    YSLOW.util.kbSize(hSize[sType]) +
                    '</td></tr>';
            }
        }

        sText = '<div id="stats-detail">' +
            '<div class="summary-row">HTTP Requests - ' +
            nHttpRequests +
            '</div><div class="summary-row-2">Total Weight - ' +
            YSLOW.util.kbSize(totalSize) +
            '</div><table id="stats-table">' +
            tableHtml +
            '</table></div>';

        return sText;
    },

    plotComponents: function (stats_view, yscontext) {
        if (typeof stats_view !== "object") {
            return;
        }
        this.plotOne(stats_view, yscontext.PAGE.canvas_data.empty, yscontext.PAGE.totalSize, 'comp-canvas-empty');
        this.plotOne(stats_view, yscontext.PAGE.canvas_data.primed, yscontext.PAGE.totalSizePrimed, 'comp-canvas-primed');
    },

    plotOne: function (stats_view, data, total, canvas_id) {
        var canvas, i, ctx, canvas_size, radius, center, sofar, piece, thisvalue,
            aElements = stats_view.getElementsByTagName('canvas');

        for (i = 0; i < aElements.length; i += 1) {
            if (aElements[i].id === canvas_id) {
                canvas = aElements[i];
            }
        }
        if (!canvas) {
            return;
        }

        ctx = canvas.getContext('2d');
        canvas_size = [canvas.width, canvas.height];
        radius = Math.min(canvas_size[0], canvas_size[1]) / 2;
        center = [canvas_size[0] / 2, canvas_size[1] / 2];


        sofar = 0; // keep track of progress
        // loop the data[]
        for (piece in data) {
            if (data.hasOwnProperty(piece) && data[piece]) {
                thisvalue = data[piece] / total;

                ctx.beginPath();
                // center of the pie
                ctx.moveTo(center[0], center[1]);
                // draw next arc
                ctx.arc(
                    center[0],
                    center[1],
                    radius,
                    // -0.5 sets set the start to be top
                    Math.PI * (-0.5 + 2 * sofar),
                    Math.PI * (-0.5 + 2 * (sofar + thisvalue)),
                    false
                );
                ctx.lineTo(center[0], center[1]); // line back to the center
                ctx.closePath();
                ctx.fillStyle = this.colors[piece]; // color
                ctx.fill();

                sofar += thisvalue; // increment progress tracker
            }
        }
    },

    getComponentHeadersTable: function (comp) {
        var field,
            sText = '<table><tr class="respHeaders"><td colspan=2>Response Headers</td></tr>';

        for (field in comp.headers) {
            if (comp.headers.hasOwnProperty(field) && comp.headers[field]) {
                sText += '<tr><td class="param-name">' +
                    YSLOW.util.escapeHtml(YSLOW.util.formatHeaderName(field)) +
                    '</td><td class="param-value">' +
                    YSLOW.util.escapeHtml(comp.headers[field]) +
                    '</td></tr>';
            }
        }

        if (comp.req_headers) {
            sText += '<tr class="reqHeaders"><td colspan=2>Request Headers</td></tr>';
            for (field in comp.req_headers) {
                if (comp.req_headers.hasOwnProperty(field) &&
                        comp.req_headers[field]) {
                    sText += '<tr><td class="param-name">' +
                        YSLOW.util.escapeHtml(YSLOW.util.formatHeaderName(field)) +
                        '</td><td class="param-value"><p>' +
                        YSLOW.util.escapeHtml(comp.req_headers[field]) +
                        '</p></td></tr>';
                }
            }
        }

        sText += '</table>';
        return sText;
    },

    /**
     * Generate HTML table row code for a component.
     * @param fields table columns
     * @param comp Component
     * @param row_class 'odd' or 'even'
     * @param hidden
     * @return html code
     */
    genComponentRow: function (fields, comp, row_class, hidden) {
        var headersDivId, sHtml, i, sClass, value, sent, recv;

        if (typeof row_class !== "string") {
            row_class = '';
        }
        if (comp.status >= 400 && comp.status < 500) {
            row_class += ' compError';
        }
        if (comp.after_onload === true) {
            row_class += ' afteronload';
        }

        headersDivId = 'compHeaders' + comp.id;

        sHtml = '<tr class="' + row_class + ' type-' + comp.type + '"' + (hidden ? ' style="display:none"' : '') + '>';
        for (i in fields) {
            if (fields.hasOwnProperty(i)) {
                sClass = i;
                value = '';

                if (i === "type") {
                    value += comp[i];
                    if (comp.is_beacon) {
                        value += ' &#8224;';
                    }
                    if (comp.after_onload) {
                        value += ' *';
                    }
                } else if (i === "size") {
                    value += YSLOW.util.kbSize(comp.size);
                } else if (i === "url") {
                    if (comp.status >= 400 && comp.status < 500) {
                        sHtml += '<td class="' + sClass + '">' + comp[i] + ' (status: ' + comp.status + ')</td>';
                        // skip the rest of the fields if this component has error.
                        continue;
                    } else {
                        value += YSLOW.util.prettyAnchor(comp[i], comp[i], undefined, !YSLOW.renderer.bPrintable, 100, 1, comp.type);
                    }
                } else if (i === "gzip" && (comp.compressed === "gzip" || comp.compressed === "deflate")) {
                    value += (comp.size_compressed !== undefined ? YSLOW.util.kbSize(comp.size_compressed) : 'uncertain');
                } else if (i === "set-cookie") {
                    sent = comp.getSetCookieSize();
                    value += sent > 0 ? sent : '';
                } else if (i === "cookie") {
                    recv = comp.getReceivedCookieSize();
                    value += recv > 0 ? recv : '';
                } else if (i === "etag") {
                    value += comp.getEtag();
                } else if (i === "expires") {
                    value += YSLOW.util.prettyExpiresDate(comp.expires);
                } else if (i === "headers") {
                    if (YSLOW.renderer.bPrintable) {
                        continue;
                    }
                    if (comp.raw_headers && comp.raw_headers.length > 0) {
                        value += '<a href="javascript:document.ysview.showComponentHeaders(\'' + headersDivId + '\')"><b class="mag"></b></a>';
                    }
                } else if (i === "action") {
                    if (YSLOW.renderer.bPrintable) {
                        continue;
                    }
                    if (comp.type === 'cssimage' || comp.type === 'image') {
                        // for security reason, don't display smush.it unless it's image mime type.
                        if (comp.response_type === undefined || comp.response_type === "image") {
                            value += '<a href="javascript:document.ysview.smushIt(document, \'' + comp.url + '\')">smush.it</a>';
                        }
                    }
                } else if (comp[i] !== undefined) {
                    value += comp[i];
                }
                sHtml += '<td class="' + sClass + '">' + value + '</td>';
            }
        }
        sHtml += '</tr>';

        if (comp.raw_headers && comp.raw_headers.length > 0) {
            sHtml += '<tr id="' + headersDivId + '" class="headers" style="display:none;"><td colspan="12">' + this.getComponentHeadersTable(comp) + '</td></tr>';
        }
        return sHtml;
    },

    componentSortCallback: function (comp1, comp2) {
        var i, types, max,
            a = '',
            b = '',
            sortBy = YSLOW.renderer.sortBy,
            desc = YSLOW.renderer.sortDesc;

        switch (sortBy) {
        case 'type':
            a = comp1.type;
            b = comp2.type;
            break;
        case 'size':
            a = comp1.size ? Number(comp1.size) : 0;
            b = comp2.size ? Number(comp2.size) : 0;
            break;
        case 'gzip':
            a = comp1.size_compressed ? Number(comp1.size_compressed) : 0;
            b = comp2.size_compressed ? Number(comp2.size_compressed) : 0;
            break;
        case 'set-cookie':
            a = comp1.getSetCookieSize();
            b = comp2.getSetCookieSize();
            break;
        case 'cookie':
            a = comp1.getReceivedCookieSize();
            b = comp2.getReceivedCookieSize();
            break;
        case 'headers':
            // header exist?
            break;
        case 'url':
            a = comp1.url;
            b = comp2.url;
            break;
        case 'respTime':
            a = comp1.respTime ? Number(comp1.respTime) : 0;
            b = comp2.respTime ? Number(comp2.respTime) : 0;
            break;
        case 'etag':
            a = comp1.getEtag();
            b = comp2.getEtag();
            break;
        case 'action':
            if (comp1.type === 'cssimage' || comp1.type === 'image') {
                a = 'smush.it';
            }
            if (comp2.type === 'cssimage' || comp2.type === 'image') {
                b = 'smush.it';
            }
            break;
        case 'expires':
            // special case - date type
            a = comp1.expires || 0;
            b = comp2.expires || 0;
            break;
        }

        if (a === b) {
            // secondary sorting by ID to stablize the sorting algorithm.
            if (comp1.id > comp2.id) {
                return (desc) ? -1 : 1;
            }
            if (comp1.id < comp2.id) {
                return (desc) ? 1 : -1;
            }
        }

        // special case for sorting by type.
        if (sortBy === 'type') {
            types = YSLOW.peeler.types;
            for (i = 0, max = types.length; i < max; i += 1) {
                if (comp1.type === types[i]) {
                    return (desc) ? 1 : -1;
                }
                if (comp2.type === types[i]) {
                    return (desc) ? -1 : 1;
                }
            }
        }

        // normal comparison
        if (a > b) {
            return (desc) ? -1 : 1;
        }
        if (a < b) {
            return (desc) ? 1 : -1;
        }

        return 0;

    },

    /**
     * Sort components, return a new array, the passed array is unchanged.
     * @param array of components to be sorted
     * @param field to sort by.
     * @return a new array of the sorted components.
     */
    sortComponents: function (comps, sortBy, desc) {
        var arr_comps = comps;

        this.sortBy = sortBy;
        this.sortDesc = desc;
        arr_comps.sort(this.componentSortCallback);

        return arr_comps;
    },

    genRulesCheckbox: function (ruleset) {
        var sText, id, rule, column_id,
            weightsText = '',
            numRules = 0,
            rules = YSLOW.controller.getRegisteredRules(),
            j = 0,
            col1Text = '<div class="column1">',
            col2Text = '<div class="column2">',
            col3Text = '<div class="column3">';

        for (id in rules) {
            if (rules.hasOwnProperty(id) && rules[id]) {
                rule = rules[id];

                sText = '<label class="rules"><input id="rulesetEditRule' +
                    id +
                    '" name="rules" value="' +
                    id +
                    '" type="checkbox"' +
                    (ruleset.rules[id] ? ' checked' : '') +
                    '>' +
                    rule.name +
                    '</label><br>';

                if (ruleset.rules[id] !== undefined) {
                    numRules += 1;
                }

                if (ruleset.weights !== undefined && ruleset.weights[id] !== undefined) {
                    weightsText += '<input type="hidden" name="weight-' +
                        id +
                        '" value="' +
                        ruleset.weights[rule.id] +
                        '">';
                }

                column_id = (j % 3);
                switch (column_id) {
                case 0:
                    col1Text += sText;
                    break;
                case 1:
                    col2Text += sText;
                    break;
                case 2:
                    col3Text += sText;
                    break;
                }
                j += 1;
            }
        }

        col1Text += '</div>';
        col2Text += '</div>';
        col3Text += '</div>';

        return '<h4><span id="rulesetEditFormTitle">' + ruleset.name + '</span> Ruleset <span id="rulesetEditFormNumRules" class="font10">(includes ' + parseInt(numRules, 10) + ' of ' + parseInt(j, 10) + ' rules)</span></h4>' + '<div class="rulesColumns"><table><tr><td>' + col1Text + '</td><td>' + col2Text + '</td><td>' + col3Text + '</td></tr></table><div id="rulesetEditWeightsDiv" class="weightsDiv">' + weightsText + '</div></div>';
    },

    genRulesetEditForm: function (ruleset) {
        var contentHtml = '';

        contentHtml += '<div id="rulesetEditFormDiv">' + '<form id="edit-form" action="javascript:document.ysview.saveRuleset(document, \'edit-form\')">' + '<div class="floatRight"><a href="javascript:document.ysview.checkAllRules(document, \'edit-form\', true)">Check All</a>|<a href="javascript:document.ysview.checkAllRules(document, \'edit-form\', false)">Uncheck All</a></div>' + YSLOW.renderer.genRulesCheckbox(ruleset) + '<div class="buttons"><input type="button" value="Save ruleset as ..." onclick="javascript:document.ysview.openSaveAsDialog(document, \'edit-form\')">' + '<span id="rulesetEditCustomButtons" style="visibility: ' + (ruleset.custom === true ? 'visible' : 'hidden') + '">' + '<input type="button" value="Save" onclick="this.form.submit()">' + '<!--<input type="button" value="Share" onclick="javascript:document.ysview.shareRuleset(document, \'edit-form\')">-->' + '<input class="btn_delete" type="button" value="Delete" onclick="javascript:document.ysview.deleteRuleset(document, \'edit-form\')">' + '</span></div>' + '<div id="rulesetEditRulesetId"><input type="hidden" name="ruleset-id" value="' + ruleset.id + '"></div>' + '<div id="rulesetEditRulesetName"><input type="hidden" name="ruleset-name" value="' + ruleset.name + '"></div>' + '</form></div>';

        return contentHtml;
    },

    initRulesetEditForm: function (doc, form, ruleset) {
        var divs, i, j, id, buttons, rulesetId, rulesetName, title, weightsDiv,
            rules, numRulesSpan, spans, checkbox,
            aElements = form.elements,
            weightsText = '',
            checkboxes = [],
            numRules = 0,
            totalRules = 0;

        // uncheck all rules
        for (i = 0; i < aElements.length; i += 1) {
            if (aElements[i].name === "rules") {
                aElements[i].checked = false;
                checkboxes[aElements[i].id] = aElements[i];
                totalRules += 1;
            } else if (aElements[i].name === "saveas-name") {
                // clear saveas-name
                form.removeChild(aElements[i]);
            }
        }

        divs = form.getElementsByTagName('div');
        for (i = 0; i < divs.length; i += 1) {
            if (divs[i].id === "rulesetEditWeightsDiv") {
                weightsDiv = divs[i];
            } else if (divs[i].id === "rulesetEditRulesetId") {
                rulesetId = divs[i];
            } else if (divs[i].id === "rulesetEditRulesetName") {
                rulesetName = divs[i];
            }
        }

        spans = form.parentNode.getElementsByTagName('span');
        for (j = 0; j < spans.length; j += 1) {
            if (spans[j].id === "rulesetEditFormTitle") {
                title = spans[j];
            } else if (spans[j].id === "rulesetEditCustomButtons") {
                // show save, delete and share for custom rules
                buttons = spans[j];
                if (ruleset !== undefined && ruleset.custom === true) {
                    // show the buttons
                    buttons.style.visibility = 'visible';
                } else {
                    // hide the buttons
                    buttons.style.visibility = 'hidden';
                }
            } else if (spans[j].id === "rulesetEditFormNumRules") {
                numRulesSpan = spans[j];
            }
        }

        if (ruleset) {
            rules = ruleset.rules;
            for (id in rules) {
                if (rules.hasOwnProperty(id) && rules[id]) {
                    // check the checkbox.
                    checkbox = checkboxes['rulesetEditRule' + id];
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                    if (ruleset.weights !== undefined && ruleset.weights[id] !== undefined) {
                        weightsText += '<input type="hidden" name="weight-' + id + '" value="' + ruleset.weights[id] + '">';
                    }
                    numRules += 1;
                }
            }
            numRulesSpan.innerHTML = '(includes ' + parseInt(numRules, 10) + ' of ' + parseInt(totalRules, 10) + ' rules)';
            rulesetId.innerHTML = '<input type="hidden" name="ruleset-id" value="' + ruleset.id + '">';
            rulesetName.innerHTML = '<input type="hidden" name="ruleset-name" value="' + ruleset.name + '">';
            title.innerHTML = ruleset.name;
        } else {
            rulesetId.innerHTML = '';
            rulesetName.innerHTML = '';
            title.innerHTML = 'New';
            numRulesSpan.innerHTML = '';
        }
        weightsDiv.innerHTML = weightsText;
    }
};

YSLOW.registerRenderer({
    /**
     * @member YSLOW.HTMLRenderer
     * @final
     */
    id: 'html',
    /**
     * @member YSLOW.HTMLRenderer
     * @final
     */
    supports: {
        components: 1,
        reportcard: 1,
        stats: 1,
        tools: 1,
        rulesetEdit: 1
    },

    /**
     * @private
     */
    genComponentsTable: function (comps, sortBy, sortDesc) {
        var f, j, type, comp,
            headers = {
                'type': 'TYPE',
                'size': 'SIZE<br> (KB)',
                'gzip': 'GZIP<br> (KB)',
                'set-cookie': 'COOKIE&nbsp;RECEIVED<br>(bytes)',
                'cookie': 'COOKIE&nbsp;SENT<br>(bytes)',
                'headers': 'HEADERS',
                'url': 'URL',
                'expires': 'EXPIRES<br>(Y/M/D)',
                'respTime': 'RESPONSE<br> TIME&nbsp;(ms)',
                'etag': 'ETAG',
                'action': 'ACTION'
            },
            collapsed = false,
            tableHtml = '',
            rowHtml = '',
            numComponentsByType = 0,
            sizeByType = 0;

        if (sortBy !== undefined && headers[sortBy] === undefined) {
            return ''; // Invalid column name, don't do anything.
        }

        if (YSLOW.renderer.bPrintable) {
            sortBy = YSLOW.renderer.sortBy;
            sortDesc = YSLOW.renderer.sortDesc;
        } else if (sortBy === undefined || sortBy === "type") {
            sortBy = "type";
            collapsed = true;
        }

        comps = YSLOW.renderer.sortComponents(comps, sortBy, sortDesc);


        // table headers
        tableHtml += '<table id="components-table"><tr>';
        for (f in headers) {
            if (headers.hasOwnProperty(f) && headers[f]) {
                if (YSLOW.renderer.bPrintable &&
                        (f === "action" || f === "components" ||
                        f === "headers")) {
                    continue;
                }
                tableHtml += '<th';
                if (sortBy === f) {
                    tableHtml += ' class=" sortBy"';
                }
                tableHtml += '>';
                if (YSLOW.renderer.bPrintable) {
                    tableHtml += headers[f];
                } else {
                    tableHtml += '<div class="';
                    if (sortBy === f) {
                        tableHtml += (sortDesc ? ' sortDesc' : ' sortAsc');
                    }
                    tableHtml += '"><a href="javascript:document.ysview.regenComponentsTable(document, \'' + f + '\'' + (sortBy === f ? (sortDesc ? ', false' : ', true') : '') + ')">' + (sortBy === f ? (sortDesc ? '&darr;' : '&uarr;') : '') + ' ' + headers[f] + '</a></div>';

                }
            }
        }
        tableHtml += '</tr>';

        // component data
        for (j = 0; j < comps.length; j += 1) {
            comp = comps[j];
            if ((sortBy === undefined || sortBy === "type") && !YSLOW.renderer.bPrintable) {
                if (type === undefined) {
                    type = comp.type;
                } else if (type !== comp.type) { /* add type summary row */
                    tableHtml += '<tr class="type-summary ' + (collapsed ? 'expand' : 'collapse') + '"><td>' + '<a href="javascript:document.ysview.expandCollapseComponentType(document, \'' + type + '\')"><b class="expcol"><b class="exp exph"></b><b class="exp expv"></b><b class="col"></b></b><span class="rowTitle type-' + type + '">' + type + '&nbsp;(' + numComponentsByType + ')</span></a></td><td class="size">' + YSLOW.util.kbSize(sizeByType) + '</td><td><!-- GZIP --></td><td></td><td></td><td><!-- HEADERS --></td>' + '<td><!-- URL --></td><td><!-- EXPIRES --></td><td><!-- RESPTIME --></td><td><!-- ETAG --></td>' + '<td><!-- ACTION--></td></tr>'; /* flush to tableHtml */
                    tableHtml += rowHtml;
                    rowHtml = '';
                    numComponentsByType = 0;
                    sizeByType = 0;
                    type = comp.type;
                }
                rowHtml += YSLOW.renderer.genComponentRow(headers, comp, (numComponentsByType % 2 === 0 ? 'even' : 'odd'), collapsed);
                numComponentsByType += 1;
                sizeByType += comp.size;
            } else {
                tableHtml += YSLOW.renderer.genComponentRow(headers, comp, (j % 2 === 0 ? 'even' : 'odd'), false);
            }
        }
        if (rowHtml.length > 0) {
            tableHtml += '<tr class="type-summary ' + (collapsed ? 'expand' : 'collapse') + '"><td>' + '<a href="javascript:document.ysview.expandCollapseComponentType(document, \'' + type + '\')"><b class="expcol"><b class="exp exph"></b><b class="exp expv"></b><b class="col"></b></b><span class="rowTitle type-' + type + '">' + type + '&nbsp;(' + numComponentsByType + ')</span></a></td><td class="size">' + YSLOW.util.kbSize(sizeByType) + '</td><td><!-- GZIP --></td><td></td><td></td><td><!-- HEADERS --></td>' + '<td><!-- URL --></td><td><!-- EXPIRES --></td><td><!-- RESPTIME --></td><td><!-- ETAG --></td>' + '<td><!-- ACTION--></td></tr>';
            tableHtml += rowHtml;
        }
        tableHtml += '</table>';
        return tableHtml;

    },

    /**
     * @member YSLOW.HTMLRenderer
     * Generate HTML code for Components tab
     * @param {YSLOW.ComponentSet} comps  array of components
     * @param {Number} totalSize total page size
     * @return html code for Components tab
     * @type String
     */
    componentsView: function (comps, totalSize) {
        var sText,
            tableHtml = this.genComponentsTable(comps, YSLOW.renderer.sortBy, false),
            beacon_legend = 'in type column indicates the component is loaded after window onload event.',
            after_onload_legend = 'denotes 1x1 pixels image that may be image beacon',
            title = 'Components';

        if (YSLOW.doc) {
            if (YSLOW.doc.components_legend) {
                if (YSLOW.doc.components_legend.beacon) {
                    beacon_legend = YSLOW.doc.components_legend.beacon;
                }
                if (YSLOW.doc.components_legend.after_onload) {
                    after_onload_legend = YSLOW.doc.components_legend.after_onload;
                }
            }
            if (YSLOW.doc.view_names && YSLOW.doc.view_names.components) {
                title = YSLOW.doc.view_names.components;
            }
        }

        sText = '<div id="componentsDiv">' + '<div id="summary"><span class="view-title">' + title + '</span>The page has a total of ' + '<span class="number">' + comps.length + '</span>' + ' components and a total weight of ' + '<span class="number">' + YSLOW.util.kbSize(totalSize) + '</span> bytes</div>' + '<div id="expand-all"><a href="javascript:document.ysview.expandAll(document)"><b>&#187;</b><span id="expand-all-text">Expand All</span></a></div>' + '<div id="components">' + tableHtml + '</div><div class="legend">* ' + beacon_legend + '<br>' + '&#8224; ' + after_onload_legend + '</div></div>';

        return sText;
    },

    /**
     * @private
     */
    reportcardPrintableView: function (results, overall_grade, ruleset) {
        var i, j, result, grade, grade_class,
            html = '<div id="reportDiv"><table><tr class="header"><td colspan="2">Overall Grade: ' + overall_grade + '  (Ruleset applied: ' + ruleset.name + ')</td></tr>';

        for (i = 0; i < results.length; i += 1) {
            result = results[i];
            if (typeof result === "object") {
                grade = YSLOW.util.prettyScore(result.score);
                grade_class = 'grade-' + (grade === "N/A" ? 'NA' : grade);

                html += '<tr><td class="grade ' + grade_class + '"><b>' + grade + '</b></td>' + '<td class="desc"><p>' + result.name + '<br><div class="message">' + result.message + '</div>';

                if (result.components && result.components.length > 0) {
                    html += '<ul class="comps-list">';
                    for (j = 0; j < result.components.length; j += 1) {
                        if (typeof result.components[j] === "string") {
                            html += '<li>' + result.components[j] + '</li>';
                        } else if (result.components[j].url !== undefined) {
                            html += '<li>' + YSLOW.util.briefUrl(result.components[j].url, 60) + '</li>';
                        }
                    }
                    html += '</ul><br>';
                }

                html += '</p></td></tr>';
            }
        }
        html += '</table></div>';
        return html;
    },

    getFilterCode: function (categories, results, grade, url) {
        var html, id, i, len, link, result, score,
            total = results.length,
            array = [];

        for (id in categories) {
            if (categories.hasOwnProperty(id) && categories[id]) {
                array.push(id);
            }
        }
        array.sort();

        html = '<div id="filter"><ul>' + '<li class="first selected" id="all" onclick="javascript:document.ysview.updateFilterSelection(event)"><a href="#">ALL (' + total + ')</a></li>' + '<li class="first">FILTER BY: </li>';

        for (i = 0, len = array.length; i < len; i += 1) {
            html += '<li';
            if (i === 0) {
                html += ' class="first"';
            }
            html += ' id="' + array[i] + '" onclick="javascript:document.ysview.updateFilterSelection(event)"><a href="#">' + array[i].toUpperCase() + ' (' + categories[array[i]] + ')</a></li>';
        }

        // social
        link = 'http://yslow.org/scoremeter/?url=' +
            encodeURIComponent(url) + '&grade=' + grade;
        for (i = 0; i < total; i += 1) {
            result = results[i];
            score = parseInt(result.score, 10);
            if (score >= 0 && score < 100) {
                link += '&' + result.rule_id.toLowerCase() + '=' + score;
            }
        }

        // for some reason window.open mess with decoding, thus encoding twice
        link = encodeURIComponent(encodeURIComponent(link));
        url = encodeURIComponent(encodeURIComponent(url.slice(0, 60) + (url.length > 60 ? '...' : '')));

        html += '<li class="social"><a class="facebook" href="javascript:document.ysview.openPopup(\'http://www.facebook.com/sharer.php?t=YSlow%20Scoremeter&u=' + link + '\', \'facebook\')" title="Share these results"><span>Share</span></a></li>';
        html += '<li class="social"><a class="twitter" href="javascript:document.ysview.openPopup(\'http://twitter.com/share?original_referer=&source=tweetbutton&text=YSlow%20grade%20' + grade + '%20for%20' + url + '&url=' + link + '&via=yslow\', \'twitter\')" title="Tweet these results"><span>Tweet</spam></a></li>';

        html += '</ul></div>';

        return html;
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Generate HTML code for Grade screen
     * @param {YSLOW.ResultSet} resultset
     * @return html code for Grade screen
     * @type String
     */
    reportcardView: function (resultset) {
        var overall_grade, i, j, k, result, grade, index, sClass, grade_class, score, messages, comp, string, rule,
            html = '<div id="reportDiv">',
            appliedRuleset = resultset.getRulesetApplied(),
            results = resultset.getResults(),
            url = resultset.url,
            title = 'Grade',
            tab_label_html = '',
            tab_html = '',
            categories = {};


        if (YSLOW.doc) {
            if (YSLOW.doc.view_names && YSLOW.doc.view_names.grade) {
                title = YSLOW.doc.view_names.grade;
            }
        }

        overall_grade = YSLOW.util.prettyScore(resultset.getOverallScore());

        if (YSLOW.renderer.bPrintable) {
            return this.reportcardPrintableView(results, overall_grade, appliedRuleset);
        }

        html += '<div id="summary"><table><tr><td><div class="bigFont">' + title + '</div></td>' + '<td class="padding5"><div id="overall-grade" class="grade-' + overall_grade + '">' + overall_grade + '</div></td>' + '<td class="padding15">Overall performance score ' + Math.round(resultset.getOverallScore()) + '</td>' + '<td class="padding15">Ruleset applied: ' + appliedRuleset.name + '</td>' + '<td class="padding15">URL: ' + YSLOW.util.briefUrl(url, 100) + '</td>' + '</tr></table></div>';


        for (i = 0; i < results.length; i += 1) {
            result = results[i];
            if (typeof result === "object") {
                grade = YSLOW.util.prettyScore(result.score);
                index = i + 1;
                sClass = '';
                grade_class = 'grade-' + (grade === "N/A" ? 'NA' : grade);
                score = parseInt(result.score, 10);
                if (isNaN(score) || result.score === -1) {
                    score = "n/a";
                } else {
                    score += "%";
                }

                tab_label_html += '<li' + ' id="label' + index + '"';
                if (i === 0) {
                    sClass += "first selected";
                }
                if (result.category) {
                    for (k = 0; k < result.category.length; k += 1) {
                        if (sClass.length > 0) {
                            sClass += ' ';
                        }
                        sClass += result.category[k];
                        // update filter categories
                        if (categories[result.category[k]] === undefined) {
                            categories[result.category[k]] = 0;
                        }
                        categories[result.category[k]] += 1;
                    }
                }
                if (sClass.length > 0) {
                    tab_label_html += ' class="' + sClass + '"';
                }
                tab_label_html += ' onclick="javascript:document.ysview.onclickResult(event)">' + '<a href="#" class="' + grade_class + '">' + '<div class="tab-label">' + '<span class="grade" title="' + score + '">' + grade + '</span>' + '<span class="desc">' + result.name + '</span></div></a></li>';

                tab_html += '<div id="tab' + index + '" class="result-tab';
                if (i !== 0) {
                    tab_html += ' yui-hidden';
                }
                messages = result.message.split('\n');
                if (messages) {
                    result.message = messages.join('<br>');
                }
                tab_html += '"><h4>Grade ' + grade + ' on ' + result.name + '</h4><p>' + result.message + '<br>';

                if (result.components && result.components.length > 0) {
                    tab_html += '<ul class="comps-list">';
                    for (j = 0; j < result.components.length; j += 1) {
                        comp = result.components[j];
                        if (typeof comp === "string") {
                            tab_html += '<li>' + comp + '</li>';
                        } else if (comp.url !== undefined) {
                            tab_html += '<li>';
                            string = result.rule_id.toLowerCase();
                            if (result.rule_id.match('expires')) {
                                tab_html += '(' + YSLOW.util.prettyExpiresDate(comp.expires) + ') ';
                            }
                            tab_html += YSLOW.util.prettyAnchor(comp.url, comp.url, undefined, true, 120, undefined, comp.type) + '</li>';
                        }
                    }
                    tab_html += '</ul><br>';
                }
                tab_html += '</p>';

                rule = YSLOW.controller.getRule(result.rule_id);

                if (rule) {
                    tab_html += '<hr><p class="rule-info">' + (rule.info || '** To be added **') + '</p>';

                    if (rule.url !== undefined) {
                        tab_html += '<p class="more-info"><a href="javascript:document.ysview.openLink(\'' + rule.url + '\')"><b>&#187;</b>Read More</a></p>';

                    }
                }

                tab_html += '</div>';
            }
        }

        html += '<div id="reportInnerDiv">' + this.getFilterCode(categories, results, overall_grade, url) + '<div id="result" class="yui-navset yui-navset-left">' + '<ul class="yui-nav" id="tab-label-list">' + tab_label_html + '</ul>' + '<div class="yui-content">' + tab_html + '</div>' + '<div id="copyright2">' + YSLOW.doc.copyright + '</div>' + '</div></div></div>';

        return html;
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Generate HTML code for Stats screen
     * @param {Object} stats page stats
     * <ul>
     * <li><code>PAGE.totalObjCountPrimed</code> a hash of components count group by type (primed cache)</li>
     * <li><code>PAGE.totalObjSizePrimed</code> a hash of components size group by type (primed cache)</li>
     * <li><code>PAGE.totalObjRequestsPrimed</code> total number of requests (primed cache)</li>
     * <li><code>PAGE.totalSizePrimed</code> total size of all components (primed cache)</li>
     * <li><code>PAGE.totalObjCount</code> a hash of components count group by type (empty cache)</li>
     * <li><code>PAGE.totalObjSize</code> a hash of components size group by type (empty cache)</li>
     * <li><code>PAGE.totalObjRequests</code> total number of requests (empty cache)</li>
     * <li><code>PAGE.totalSize</code> total size of all components (empty cache)</li>
     * </ul>
     * @return html code for Stats screen
     * @type String
     */
    statsView: function (stats) {
        var sText = '',
            title = 'Stats';

        if (YSLOW.doc) {
            if (YSLOW.doc.view_names && YSLOW.doc.view_names.stats) {
                title = YSLOW.doc.view_names.stats;
            }
        }

        sText += '<div id="statsDiv">' + '<div id="summary"><span class="view-title">' + title + '</span>The page has a total of ' + '<span class="number">' + stats.PAGE.totalRequests + '</span>' + ' HTTP requests and a total weight of ' + '<span class="number">' + YSLOW.util.kbSize(stats.PAGE.totalSize) + '</span>' + ' bytes with empty cache</div>';

        // Page summary.
        sText += '<div class="section-header">WEIGHT GRAPHS</div>';

        sText += '<div id="empty-cache">' + '<div class="stats-graph floatLeft"><div class="canvas-title">Empty Cache</div>' + '<canvas id="comp-canvas-empty" width="150" height="150"></canvas></div>' + '<div class="yslow-stats-empty">' + YSLOW.renderer.genStats(stats, false) + '</div></div>';

        sText += '<div id="primed-cache">' + '<div class="stats-graph floatLeft"><div class="canvas-title">Primed Cache</div>' + '<canvas id="comp-canvas-primed" width="150" height="150"></canvas></div>' + '<div class="yslow-stats-primed">' + YSLOW.renderer.genStats(stats, true) + '</div></div>';

        sText += '</div>';

        return sText;
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Generate Html for Tools tab
     * @param {Array} tools array of tools
     * @return html for Tools tab
     * @type String
     */
    toolsView: function (tools) {
        var i, sText, tool,
            tableHtml = '<table>',
            title = 'Tools',
            desc = 'Click the Launch Tool link next to the tool you want to run to start the tool.';

        if (YSLOW.doc) {
            if (YSLOW.doc.tools_desc) {
                desc = YSLOW.doc.tools_desc;
            }
            if (YSLOW.doc.view_names && YSLOW.doc.view_names.tools) {
                title = YSLOW.doc.view_names.tools;
            }
        }

        for (i = 0; i < tools.length; i += 1) {
            tool = tools[i];
            tableHtml += '<tr><td class="name"><b><a href="#" onclick="javascript:document.ysview.runTool(\'' + tool.id + '\', {\'yscontext\': document.yslowContext })">' + tool.name + '</a></b></td><td>-</td><td>' + (tool.short_desc || 'Short text here explaining what are the main benefits of running this App') + '</td></tr>';
        }

        tableHtml += '</table>';

        sText = '<div id="toolsDiv">' + '<div id="summary"><span class="view-title">' + title + '</span>' + desc + '</div>' + '<div id="tools">' + tableHtml + '</div></div>';

        return sText;
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Generate Html for Ruleset Settings Screen
     * @param {Object} rulesets a hash of rulesets with { ruleset-name => ruleset }
     * @return html code for Ruleset Settings screen
     * @type String
     */
    rulesetEditView: function (rulesets) {
        var id, ruleset, tab_id, sText,
            settingsHtml = '<div id="settingsDiv" class="yui-navset yui-navset-left">',
            navHtml, contentHtml,
            index = 0,
            custom = false,
            selectedRuleset,
            defaultRulesetId,
            title = 'Rule Settings',
            desc = 'Choose which ruleset better fit your specific needs. You can Save As an existing rule, based on an existing ruleset.';

        if (YSLOW.doc) {
            if (YSLOW.doc.rulesettings_desc) {
                desc = YSLOW.doc.rulesettings_desc;
            }
            if (YSLOW.doc.view_names && YSLOW.doc.view_names.rulesetedit) {
                title = YSLOW.doc.view_names.rulesetedit;
            }
        }

        defaultRulesetId = YSLOW.controller.getDefaultRulesetId();

        navHtml = '<ul class="yui-nav"><li class="header">STANDARD SETS</li>';

        for (id in rulesets) {
            if (rulesets.hasOwnProperty(id) && rulesets[id]) {
                ruleset = rulesets[id];
                tab_id = 'tab' + index;
                if (!custom && ruleset.custom === true) {
                    navHtml += '<li class="new-section header" id="custom-set-title">CUSTOM SETS</li>';
                    custom = true;
                }
                navHtml += '<li id="label' + index + '" class="' + 'ruleset-' + ruleset.id;
                if (id === defaultRulesetId) {
                    selectedRuleset = rulesets[id];
                    navHtml += ' selected"';
                }
                navHtml += '" onclick="javascript:document.ysview.onclickRuleset(event)"><a href="#' + tab_id + '">' + ruleset.name + '</a></li>';
                index += 1;
            }
        }

        navHtml += '<li class="new-section create-ruleset" id="create-ruleset"><input type="button" value="New Set" onclick="javascript:document.ysview.createRuleset(this, \'edit-form\')"></li></ul>';
        contentHtml = '<div class="yui-content">' + YSLOW.renderer.genRulesetEditForm(selectedRuleset) + '</div>';

        settingsHtml += navHtml + contentHtml;

        sText = '<div id="rulesetEditDiv">' + '<div id="summary"><span class="view-title">' + title + '</span>' + desc + '</div>' + settingsHtml + '</div>';

        return sText;
    },

    /**
     * @private
     */
    rulesetEditUpdateTab: function (doc, form, ruleset, updateAction, updateSelection) {
        var ul_elem, content, li_elem, index, id, tab_id, event, custom_set_title,
            label_id, idx, prev_li_elem, header, event2,
            container = form.parentNode.parentNode.parentNode;

        if (container && container.id === 'settingsDiv' && ruleset.custom === true) {
            ul_elem = container.firstChild;
            content = ul_elem.nextSibling;

            if (updateAction < 1) {
                // for delete, we'll need to identify the tab to update.
                li_elem = ul_elem.firstChild;
                while (li_elem) {
                    index = li_elem.className.indexOf('ruleset-');
                    if (index !== -1) {
                        id = li_elem.className.substring(index + 8);
                        index = id.indexOf(" ");
                        if (index !== -1) {
                            id = id.substring(0, index);
                        }
                        if (ruleset.id === id) {
                            index = li_elem.id.indexOf('label');
                            if (index !== -1) {
                                tab_id = li_elem.id.substring(index + 5);
                                if (li_elem.className.indexOf('selected') !== -1) {
                                    // the tab we're removing is the selected tab, select the last non-header tab.
                                    event = {};
                                    event.currentTarget = prev_li_elem;
                                    doc.ysview.onclickRuleset(event);
                                }
                                // check if we are removing the last custom ruleset.
                                if (li_elem.previousSibling && li_elem.previousSibling.id === 'custom-set-title' && li_elem.nextSibling && li_elem.nextSibling.id === 'create-ruleset') {
                                    custom_set_title = li_elem.previousSibling;
                                }
                                ul_elem.removeChild(li_elem);
                                if (custom_set_title) {
                                    ul_elem.removeChild(custom_set_title);
                                }
                            }
                            break;
                        } else {
                            prev_li_elem = li_elem;
                        }
                    }
                    li_elem = li_elem.nextSibling;
                }
            } else {
                li_elem = ul_elem.lastChild;
                while (li_elem) {
                    idx = li_elem.id.indexOf('label');
                    if (idx !== -1) {
                        label_id = li_elem.id.substring(idx + 5);
                        break;
                    }
                    li_elem = li_elem.previousSibling;
                }

                label_id = Number(label_id) + 1;
                li_elem = doc.createElement('li');
                li_elem.className = 'ruleset-' + ruleset.id;
                li_elem.id = 'label' + label_id;
                li_elem.onclick = function (event) {
                    doc.ysview.onclickRuleset(event);
                };
                li_elem.innerHTML = '<a href="#tab' + label_id + '">' + ruleset.name + '</a>';
                ul_elem.insertBefore(li_elem, ul_elem.lastChild); // lastChild is the "New Set" button.
                header = ul_elem.firstChild;
                while (header) {
                    if (header.id && header.id === 'custom-set-title') {
                        custom_set_title = header;
                        break;
                    }
                    header = header.nextSibling;
                }
                if (!custom_set_title) {
                    custom_set_title = doc.createElement('li');
                    custom_set_title.className = 'new-section header';
                    custom_set_title.id = 'custom-set-title';
                    custom_set_title.innerHTML = 'CUSTOM SETS';
                    ul_elem.insertBefore(custom_set_title, li_elem);
                }

                if (updateSelection) {
                    event2 = {};
                    event2.currentTarget = li_elem;
                    doc.ysview.onclickRuleset(event2);
                }
            }
        }

    },

    /**
     * @private
     * Helper function to find if name is in class_name.
     * @param {String} class_name
     * @param {String} name
     * @return true if name is a substring of class_name, false otherwise.
     * @type Boolean
     */
    hasClassName: function (class_name, name) {
        var i,
            arr_class = class_name.split(" ");

        if (arr_class) {
            for (i = 0; i < arr_class.length; i += 1) {
                if (arr_class[i] === name) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Expand or collapse the rows in components table that matches type.
     * @param {Document} doc Document object of YSlow Chrome Window.
     * @param {HTMLElement} table table element
     * @param {String} type component type of the rows to be expanded or collapsed
     * @param {Boolean} expand true to expand, false to collapse. This can be undefined.
     * @param {Boolean} all true to expand/collapse all, can be undefined.
     */
    expandCollapseComponentType: function (doc, table, type, expand, all) {
        var hiding, i, j, do_all, row, span, names, header, className, len,
            expandAllDiv, elems, expandAllText, checkExpand,
            hasClass = this.hasClassName,
            summary = {
                expand: 0,
                collapse: 0
            };

        if (typeof all === "boolean" && all === true) {
            do_all = true;
        }

        if (table) {
            for (i = 0, len = table.rows.length; i < len; i += 1) {
                row = table.rows[i];
                className = row.className;
                if (hasClass(className, 'type-summary')) {
                    if (hasClass(className, 'expand')) {
                        summary.expand += 1;
                        hiding = false;
                    } else if (hasClass(className, 'collapse')) {
                        summary.collapse += 1;
                        hiding = true;
                    }
                    span = row.getElementsByTagName('span')[0];
                    if (do_all || hasClass(span.className, 'type-' + type)) {
                        if (do_all) {
                            names = span.className.split(' ');
                            for (j = 0; j < names.length; j += 1) {
                                if (names[j].substring(0, 5) === 'type-') {
                                    type = names[j].substring(5);
                                }
                            }
                        }
                        if (typeof hiding !== "boolean" || (typeof expand === "boolean" && expand === hiding)) {
                            if (do_all) {
                                hiding = !expand;
                                continue;
                            } else {
                                return;
                            }
                        }
                        YSLOW.view.removeClassName(row, (hiding ? 'collapse' : 'expand'));
                        row.className += (hiding ? ' expand' : ' collapse');
                        if (hiding) {
                            summary.collapse -= 1;
                            summary.expand += 1;
                        } else {
                            summary.collapse += 1;
                            summary.expand -= 1;
                        }
                    }
                } else if (hasClass(className, 'type-' + type)) {
                    if (hiding) {
                        row.style.display = "none";
                        // next sibling should be its header, collapse it too.
                        header = row.nextSibling;
                        if (header.id.indexOf('compHeaders') !== -1) {
                            header.style.display = "none";
                        }
                    } else {
                        row.style.display = "table-row";
                    }
                }
            }
        }

        // now check all type and see if we need to toggle "expand all" and "collapse all".
        if (summary.expand === 0 || summary.collapse === 0) {
            expandAllDiv = table.parentNode.previousSibling;
            if (expandAllDiv) {
                elems = expandAllDiv.getElementsByTagName('span');
                for (i = 0; i < elems.length; i += 1) {
                    if (elems[i].id === "expand-all-text") {
                        expandAllText = elems[i];
                    }
                }

                checkExpand = false;

                if (expandAllText.innerHTML.indexOf('Expand') !== -1) {
                    checkExpand = true;
                }

                // toggle
                if (checkExpand) {
                    if (summary.expand === 0) {
                        expandAllText.innerHTML = 'Collapse All';
                    }
                } else if (summary.collapse === 0) {
                    expandAllText.innerHTML = 'Expand All';
                }
            }
        }
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Expand all component rows in components table.
     * @param {Document} doc Document object of YSlow Chrome Window.
     * @param {HTMLElement} table table element
     */
    expandAllComponentType: function (doc, table) {
        var elem, i,
            expand = false,
            expandAllDiv = table.parentNode.previousSibling,
            elems = expandAllDiv.getElementsByTagName('span');

        for (i = 0; i < elems.length; i += 1) {
            if (elems[i].id === "expand-all-text") {
                elem = elems[i];
            }
        }
        if (elem) {
            if (elem.innerHTML.indexOf('Expand') !== -1) {
                expand = true;
            }
        }

        this.expandCollapseComponentType(doc, table, undefined, expand, true);

        if (elem) {
            elem.innerHTML = (expand ? 'Collapse All' : 'Expand All');
        }
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Regenerate Components Table.
     * @param {Document} doc Document object of YSlow Chrome Window
     * @param {HTMLElement} table table element
     * @param {String} column_name Column to sort by
     * @param {Boolean} sortDesc true if sort descending order, false otherwise
     * @param {YSlow.ComponentSet} cset ComponentSet object
     */
    regenComponentsTable: function (doc, table, column_name, sortDesc, cset) {
        var show, elem, tableHtml;

        if (table) {
            if (sortDesc === undefined) {
                sortDesc = false;
            }
            // hide or show expand-all
            if (column_name === "type") {
                show = true;
            }
            elem = table.parentNode.previousSibling;
            if (elem.id === 'expand-all') {
                elem.style.visibility = (show ? 'visible' : 'hidden');
            }

            tableHtml = this.genComponentsTable(cset.components, column_name, sortDesc);
            table.parentNode.innerHTML = tableHtml;
        }
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Save Ruleset.
     * @param {Document} doc Document Object of YSlow Chrome Window
     * @param {HTMLElement} form Form element
     */
    saveRuleset: function (doc, form) {
        var i, elem, index, id, saveas_name, ruleset_name, ruleset_id, rules,
            ruleset = {},
            weights = {};

        if (form) {
            ruleset.custom = true;
            ruleset.rules = {};
            ruleset.weights = {};

            for (i = 0; i < form.elements.length; i += 1) {
                elem = form.elements[i];

                // build out ruleset object with the form elements.
                if (elem.name === 'rules' && elem.type === 'checkbox') {
                    if (elem.checked) {
                        ruleset.rules[elem.value] = {};
                    }
                } else if (elem.name === 'saveas-name') {
                    saveas_name = elem.value;
                } else if (elem.name === 'ruleset-name') {
                    ruleset_name = elem.value;
                } else if (elem.name === 'ruleset-id') {
                    ruleset_id = elem.value;
                } else if ((index = elem.name.indexOf('weight-')) !== -1) {
                    weights[elem.name.substring(index)] = elem.value;
                }
            }
            rules = ruleset.rules;
            for (id in rules) {
                if (rules.hasOwnProperty(id) && weights['weight-' + id]) {
                    ruleset.weights[id] = parseInt(weights['weight-' + id], 10);
                }
            }

            if (saveas_name) {
                ruleset.id = saveas_name.replace(/\s/g, "-");
                ruleset.name = saveas_name;
            } else {
                ruleset.id = ruleset_id;
                ruleset.name = ruleset_name;
            }

            // register ruleset
            if (ruleset.id && ruleset.name) {
                YSLOW.controller.addRuleset(ruleset, true);

                // save to pref
                YSLOW.controller.saveRulesetToPref(ruleset);

                // update UI
                if (saveas_name !== undefined) {
                    this.updateRulesetUI(doc, form, ruleset, 1);
                }
            }
        }
    },

    updateRulesetUI: function (doc, form, ruleset, updateAction) {
        var i, forms = doc.getElementsByTagName('form');

        for (i = 0; i < forms.length; i += 1) {
            if (forms[i].id === form.id) {
                this.rulesetEditUpdateTab(doc, forms[i], ruleset, updateAction, (forms[i] === form));
            }
        }
        doc.ysview.updateRulesetList();
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Delete the current selected ruleset in Ruleset settings screen.
     * @param {Document} doc Document object of YSlow Chrome Window.
     * @param {HTMLElement} form Form element
     */
    deleteRuleset: function (doc, form) {
        var ruleset_id = this.getEditFormRulesetId(form),
            ruleset = YSLOW.controller.removeRuleset(ruleset_id);

        if (ruleset && ruleset.custom) {
            // remove from pref
            YSLOW.controller.deleteRulesetFromPref(ruleset);

            // update UI
            this.updateRulesetUI(doc, form, ruleset, -1);
        }
    },

    /**
     * @member YSLOW.HTMLRenderer
     * Get form id from Ruleset Settings screen.
     * @param {DOMElement} form Form element
     */
    getEditFormRulesetId: function (form) {
        var i,
            aInputs = form.getElementsByTagName('input');

        for (i = 0; i < aInputs.length; i += 1) {
            if (aInputs[i].name === 'ruleset-id') {
                return aInputs[i].value;
            }
        }

        return undefined;
    }

});

YSLOW.registerRenderer({
    /**
     * @member YSLOW.XMLRenderer
     * @final
     */
    id: 'xml',
    /**
     * @member YSLOW.XMLRenderer
     * @final
     */
    supports: {
        components: 1,
        reportcard: 1,
        stats: 1
    },

    /**
     * @member YSLOW.XMLRenderer
     * Generate XML code for Components tab
     * @param {Array} comps  array of components
     * @param {Number} totalSize total page size
     * @return XML code for Components tab
     * @type String
     */
    componentsView: function (comps, totalSize) {
        var i, cookieSize,
            sText = '<components>';

        for (i = 0; i < comps.length; i += 1) {
            sText += '<component>';
            sText += '<type>' + comps[i].type + '</type>';
            sText += '<size>' + comps[i].size + '</size>';
            if (comps[i].compressed === false) {
                sText += '<gzip/>';
            } else {
                sText += '<gzip>' + (comps[i].size_compressed !== undefined ? parseInt(comps[i].size_compressed, 10) : 'uncertain') + '</gzip>';
            }
            cookieSize = comps[i].getSetCookieSize();
            if (cookieSize > 0) {
                sText += '<set-cookie>' + parseInt(cookieSize, 10) + '</set-cookie>';
            }
            cookieSize = comps[i].getReceivedCookieSize();
            if (cookieSize > 0) {
                sText += '<cookie>' + parseInt(cookieSize, 10) + '</cookie>';
            }
            sText += '<url>' + encodeURI(comps[i].url) + '</url>';
            sText += '<expires>' + comps[i].expires + '</expires>';
            sText += '<resptime>' + comps[i].respTime + '</resptime>';
            sText += '<etag>' + comps[i].getEtag() + '</etag>';
            sText += '</component>';
        }
        sText += '</components>';
        return sText;
    },

    /**
     * @member YSLOW.XMLRenderer
     * Generate XML code for Grade tab
     * @param {YSlow.ResultSet} resultset object containing result.
     * @return xml code for Grades tab
     * @type String
     */
    reportcardView: function (resultset) {
        var i, j, result,
            overall_score = resultset.getOverallScore(),
            overall_grade = YSLOW.util.prettyScore(overall_score),
            appliedRuleset = resultset.getRulesetApplied(),
            results = resultset.getResults(),
            sText = '<performance ruleset="' + appliedRuleset.name + '" url="' + resultset.url + '">';

        sText += '<overall grade="' + overall_grade + '" score="' + overall_score + '" />';

        for (i = 0; i < results.length; i += 1) {
            result = results[i];

            sText += '<lints id="' + result.rule_id + '" ruletext="' + result.name + '" hreftext="' + YSLOW.controller.getRule(result.rule_id).url + '" grade="' + YSLOW.util.prettyScore(result.score) + '" score="' + result.score + '" category="' + result.category.join(',') + '">';

            sText += '<message>' + result.message + '</message>';
            if (results.components && results.components.length > 0) {
                sText += '<offenders>';
                for (j = 0; j < result.components.length; j += 1) {
                    if (typeof result.components[j] === "string") {
                        sText += '<offender>' + result.components[j] + '</offender>';
                    } else if (result.components[j].url !== undefined) {
                        sText += '<offender>' + result.components[j].url + '</offender>';
                    }
                }
                sText += '</offenders>';
            }
            sText += '</lints>';
        }
        sText += '</performance>';
        return sText;
    },

    /**
     * @member YSLOW.XMLRenderer
     * Generate XML code for Stats tab
     * @param {Object} stats page stats
     * <ul>
     * <li><code>PAGE.totalObjCountPrimed</code> a hash of components count group by type (primed cache)</li>
     * <li><code>PAGE.totalObjSizePrimed</code> a hash of components size group by type (primed cache)</li>
     * <li><code>PAGE.totalObjRequestsPrimed</code> total number of requests (primed cache)</li>
     * <li><code>PAGE.totalSizePrimed</code> total size of all components (primed cache)</li>
     * <li><code>PAGE.totalObjCount</code> a hash of components count group by type (empty cache)</li>
     * <li><code>PAGE.totalObjSize</code> a hash of components size group by type (empty cache)</li>
     * <li><code>PAGE.totalObjRequests</code> total number of requests (empty cache)</li>
     * <li><code>PAGE.totalSize</code> total size of all components (empty cache)</li>
     * </ul>
     * @return xml code for Stats tab
     * @type String
     */
    statsView: function (stats) {
        var i, sType, sText,
            primed_cache_items = '<items type="primedCache">',
            empty_cache_items = '<items type="emptyCache">',
            aTypes = YSLOW.peeler.types;

        for (i = 0; i < aTypes.length; i += 1) {
            sType = aTypes[i];
            if ((stats.PAGE.totalObjCountPrimed[sType]) !== undefined) {
                primed_cache_items += '<item type="' + sType + '" count="' + stats.PAGE.totalObjCountPrimed[sType] + '" size="' + stats.PAGE.totalObjSizePrimed[sType] + '" />';
            }
            if ((stats.PAGE.totalObjCount[sType]) !== undefined) {
                empty_cache_items += '<item type="' + sType + '" count="' + stats.PAGE.totalObjCount[sType] + '" size="' + stats.PAGE.totalObjSize[sType] + '" />';
            }
        }
        primed_cache_items += '</items>';
        empty_cache_items += '</items>';

        sText = '<stats numRequests="' + stats.PAGE.totalRequests + '" totalSize="' + stats.PAGE.totalSize + '" numRequests_p="' + stats.PAGE.totalRequestsPrimed + '" totalSize_p="' + stats.PAGE.totalSizePrimed + '">' + primed_cache_items + empty_cache_items + '</stats>';

        return sText;
    }
});
