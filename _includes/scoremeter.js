/*global YUI*/
/*jslint browser: true */

"use strict";
YUI({fetchCSS: false}).use('node', 'slider', function (Y) {
    var url,
        yArrayEach = Y.Array.each,
        reKeys = /^(ynumreq|ycdn|yemptysrc|yexpires|ycompress|ycsstop|yjsbottom|yexpressions|yexternal|ydns|yminify|yredirects|ydupes|yetags|yxhr|yxhrmethod|ymindom|yno404|ymincookie|ycookiefree|ynofilter|yimgnoscale|yfavicon)$/i,
        // Regex from Scott Gonzalez's IRI: http://projects.scottsplayground.com/iri/demo/http.html
        reUrl = /^(https?):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
        params = Y.config.win.location.search.slice(1).split('&'),
        results = {},
        totalWeight = 0,
        overall = 100,
        rules = [
            {id: 'ynumreq', link: 'num_http', name: 'Make fewer HTTP requests', weight: 8},
            {id: 'ycdn', link: 'cdn', name: 'Use a Content Delivery Network (CDN)', weight: 6},
            {id: 'yemptysrc', link: 'emptysrc', name: 'Avoid empty src or href', weight: 30},
            {id: 'yexpires', link: 'expires', name: 'Add expires headers', weight: 10},
            {id: 'ycompress', link: 'gzip', name: 'Compress components with gzip', weight: 8},
            {id: 'ycsstop', link: 'css_top', name: 'Put CSS at top', weight: 4},
            {id: 'yjsbottom', link: 'js_bottom', name: 'Put JavaScript at bottom', weight: 4},
            {id: 'yexpressions', link: 'css_expressions', name: 'Avoid CSS expressions', weight: 3},
            {id: 'yexternal', link: 'external', name: 'Make JavaScript and CSS external', weight: 4},
            {id: 'ydns', link: 'dns_lookups', name: 'Reduce DNS lookups', weight: 3},
            {id: 'yminify', link: 'minify', name: 'Minify JavaScript and CSS', weight: 4},
            {id: 'yredirects', link: 'redirects', name: 'Avoid URL redirects', weight: 4},
            {id: 'ydupes', link: 'js_dupes', name: 'Remove duplicate JavaScript and CSS', weight: 4},
            {id: 'yetags', link: 'etags', name: 'Configure entity tags (ETags)', weight: 2},
            {id: 'yxhr', link: 'cacheajax', name: 'Make AJAX cacheable', weight: 4},
            {id: 'yxhrmethod', link: 'ajax_get', name: 'Use GET for AJAX requests', weight: 3},
            {id: 'ymindom', link: 'min_dom', name: 'Reduce the number of DOM elements', weight: 3},
            {id: 'yno404', link: 'no404', name: 'Avoid HTTP 404 (Not Found) error', weight: 4},
            {id: 'ymincookie', link: 'cookie_size', name: 'Reduce cookie size', weight: 3},
            {id: 'ycookiefree', link: 'cookie_free', name: 'Use cookie-free domains', weight: 3},
            {id: 'ynofilter', link: 'no_filters', name: 'Avoid AlphaImageLoader filter', weight: 4},
            {id: 'yimgnoscale', link: 'no_scale', name: 'Do not scale images in HTML', weight: 3},
            {id: 'yfavicon', link: 'favicon', name: 'Make favicon small and cacheable', weight: 2}
        ],
        elRules = Y.one('#rules tbody'),
        elOverall = Y.one('#overall'),
        elOvlScore = elOverall.one('.score'),
        elOvlVal = elOverall.one('.val'),

        prettyScore = function (val) {
            var score = 'F';

            if (val >= 90) {
                score = 'A';
            } else if (val >= 80) {
                score = 'B';
            } else if (val >= 70) {
                score = 'C';
            } else if (val >= 60) {
                score = 'D';
            } else if (val >= 50) {
                score = 'E';
            }

            return score;
        },

        updateOverall = function (prevVal, newVal, weight) {
            var score, prevGrade, newGrade;

            overall -= prevVal * weight;
            overall += newVal * weight;
            score = prettyScore(overall);
            prevGrade = elOverall.getData('grade');
            newGrade = 'grade-' + score;
            elOvlVal.setContent(Math.round(overall));
            if (prevGrade !== newGrade) {
                elOverall.removeClass(prevGrade)
                    .addClass(newGrade)
                    .setData('grade', newGrade);
                elOvlScore.setContent(score);
            }
        },

        updateValue = function (e) {
            var val = e.newVal,
                that = this,
                rule = that.getData('rule'),
                weight = rule.weight / totalWeight,
                score = prettyScore(val),
                prevGrade = that.getData('grade'),
                newGrade = 'grade-' + score;

            that.one('.val').setContent(val);
            that.one('.score').setContent(score);
            if (prevGrade !== newGrade) {
                that.removeClass(prevGrade)
                    .addClass(newGrade)
                    .setData('grade', newGrade);
            }

            updateOverall(e.prevVal, val, weight);
        };

    // get initial scores
    yArrayEach(params, function (param) {
        var keyval = param.split('='),
            key = keyval[0],
            val = parseInt(keyval[1], 10);

        if ((reKeys.test(key) && typeof val === 'number' &&
                val >= 0 && val <= 100)) {
            results[key] = val;
        } else if (key === 'url') {
            // get and validate url
            url = decodeURIComponent(keyval[1]);
            url = reUrl.test(url) ? url : null;
        }
    });

    // set url when available and valid
    if (url) {
        Y.one('#url').append(
            Y.Node.create('<a></a>')
                .setContent(url)
                .set('href', url)
        );
    }

    // calc total weight
    yArrayEach(rules, function (rule) {
        totalWeight += rule.weight;
    });

    // build sliders
    yArrayEach(rules, function (rule) {
        var slider, val, grade,
            value = results[rule.id];

        value = typeof value !== 'undefined' ? value : 100;
        grade = prettyScore(value);

        // markup slides
        val = Y.Node.create('<tr></tr>')
            .append('<td class="score">' + grade + '</td>')
            .append('<td class="val">' + value + '</td>')
            .append('<td class="rule">' +
                '<a href="http://developer.yahoo.com/performance/rules.html#' +
                rule.link + '" target="_blank">' + rule.name + '</a></td>')
            .append('<td class="weight">' + rule.weight + '</td>')
            .append('<td class="slider" id="slider-' + rule.id + '"></td>')
            .setData('rule', rule)
            .setData('grade', 'grade-' + grade)
            .addClass('grade-' + grade)
            .set('id', rule.id);

        elRules.append(val);

        // slider
        slider = new Y.Slider({
            value: value
        });
        slider.after('valueChange', updateValue, val);
        slider.render('#slider-' + rule.id);
        updateOverall(100, value, rule.weight / totalWeight);
    });
});
