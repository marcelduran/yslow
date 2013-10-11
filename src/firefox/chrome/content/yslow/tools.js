/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, netscape, btoa*/
/*jslint white: true, browser: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true */

/**
 *
 * Example of a tool object:
 *
 * <pre>
 * YSLOW.registerTool({
 *
 *     id: 'mytool',
 *     name: 'Custom tool #3',
 *     short_desc: 'short description of custom tool #3',
 *     print_output: true,
 *     run: function(doc, components, param) {
 *         return 'I am a custom tool';
 *     }
 * });
 * </pre>
 *
 * @class
 */

YSLOW.Tools = {

    tools: {},

    custom_tools: [],

    addBuiltinTool: function (tool) {
        // check YSLOW.doc class for text
        if (YSLOW.doc.rules && YSLOW.doc.tools[tool.id]) {
            var doc_obj = YSLOW.doc.tools[tool.id];
            if (doc_obj.name) {
                tool.name = doc_obj.name;
            }
            if (doc_obj.info) {
                tool.short_desc = doc_obj.info;
            }
        }

        this.tools[tool.id] = tool;
    },

    addCustomTool: function (tool) {
        var i, required = ['id', 'name', 'short_desc', 'print_output', 'run'];
        for (i = 0; i < required.length; i += 1) {
            if (typeof tool[required[i]] === 'undefined') {
                throw new YSLOW.Error('Interface error', 'Improperly implemented rule interface');
            }
        }
        if (tool.id in this.tools || tool.id in this.custom_tools) {
            throw new YSLOW.Error('Tool register error', tool.id + " is already defined.");
        }
        this.custom_tools[tool.id] = tool;
    },

    getTool: function (tool_id) {
        var tool = this.tools[tool_id];
        if (tool === undefined) {
            tool = this.custom_tools[tool_id];
        }
        return tool;
    },

    getCustomTools: function () {
        return this.custom_tools;
    },

    getAllTools: function () {
        var id, aTools = [];

        for (id in this.tools) {
            if (this.tools[id]) {
                aTools.push(this.tools[id]);
            }
        }
        for (id in this.custom_tools) {
            if (this.custom_tools[id]) {
                aTools.push(this.custom_tools[id]);
            }
        }
        return aTools;
    },

    /**
     * @private
     */
    loadAllJS: function (doc, components, beautify) {
        var i, compObj, heading, body, script, heading2, body2,
            index = 0,
            aComponents = components.getComponentsByType('js', true),
            aScripts = doc.getElementsByTagName('script'),
            renderer = new YSLOW.ToolResult();

        renderer.addTitle(((beautify) ? 'Beautified' : '') + " JavaScript for: " + YSLOW.util.escapeHtml(doc.location.href));

        // Iterate over the external JS files.
        for (i = 0; i < aComponents.length; i += 1) {
            compObj = aComponents[i];
            if (typeof compObj.body === "string" && compObj.body.length > 0) {
                heading = YSLOW.util.escapeHtml(compObj.url);
                body = YSLOW.util.escapeHtml((beautify !== undefined) ? YSLOW.js_beautify(compObj.body) : compObj.body);
                renderer.addContent(heading, body);
            }
        }

        // Iterate over the inline SCRIPT blocks
        for (i = 0; i < aScripts.length; i += 1) {
            script = aScripts[i];
            if (!script.src) { // avoid external script objects
                index += 1;
                heading2 = "inline script block #" + parseInt(index, 10);
                body2 = YSLOW.util.escapeHtml((beautify !== undefined) ? YSLOW.js_beautify(script.textContent) : script.textContent);
                renderer.addContent(heading2, body2);
            }
        }

        return renderer.htmlview();
    },

    /**
     * @private
     */
    runAllJSMin: function (doc, components) {
        var i, compObj, heading, heading2, body, body2, script,
            index = 0,
            aComponents = components.getComponentsByType('js', true),
            aScripts = doc.getElementsByTagName('script'),
            renderer = new YSLOW.ToolResult();

        renderer.addTitle("Minified JavaScript for: " + YSLOW.util.escapeHtml(doc.location.href));

        // Iterate over the external JS files.
        for (i = 0; i < aComponents.length; i += 1) {
            compObj = aComponents[i];
            if (typeof compObj.body === "string" && compObj.body.length > 0) {
                heading = YSLOW.util.escapeHtml(compObj.url);
                body = YSLOW.util.escapeHtml(YSLOW.jsmin('', compObj.body, 2));
                renderer.addContent(heading, body);
            }
        }

        // Iterate over the inline SCRIPT blocks
        for (i = 0; i < aScripts.length; i += 1) {
            script = aScripts[i];
            if (!script.src) { // avoid external script objects
                index += 1;
                heading2 = "inline script block #" + parseInt(index, 10);
                body2 = YSLOW.util.escapeHtml(YSLOW.jsmin('', script.textContent, 2));
                renderer.addContent(heading2, body2);
            }
        }

        return renderer.htmlview();
    },

    /**
     * @private
     */
    loadAllCSS: function (doc, components) {
        var i, compObj, heading, heading2, body, elem,
            index = 0,
            aComponents = components.getComponentsByType('css', true),
            aElements = doc.getElementsByTagName('style'),
            renderer = new YSLOW.ToolResult();

        renderer.addTitle("All CSS for: " + YSLOW.util.escapeHtml(doc.location.href));

        // Iterate over the external files.
        for (i = 0; i < aComponents.length; i += 1) {
            compObj = aComponents[i];
            if (typeof compObj.body === "string" && compObj.body.length > 0) {
                heading = YSLOW.util.escapeHtml(compObj.url);
                body = YSLOW.util.escapeHtml(compObj.body);
                renderer.addContent(heading, body);
            }
        }

        // Iterate over the inline STYLE blocks.
        for (i = 0; i < aElements.length; i += 1) {
            elem = aElements[i];
            if (elem.innerHTML) { // avoid external elem objects
                index += 1;
                heading2 = "inline style block #" + parseInt(index, 10);
                renderer.addContent(heading2, YSLOW.util.escapeHtml(elem.textContent));
            }
        }

        return renderer.htmlview();
    },

    /**
     * @private
     */
    runCSSMin: function (doc, components) {
        var i, compObj, heading, heading2, body, elem,
            index = 0,
            aComponents = components.getComponentsByType('css', true),
            aElements = doc.getElementsByTagName('style'),
            renderer = new YSLOW.ToolResult();

        renderer.addTitle("Minified CSS for: " + YSLOW.util.escapeHtml(doc.location.href));

        // Iterate over the external files.
        for (i = 0; i < aComponents.length; i += 1) {
            compObj = aComponents[i];
            if (typeof compObj.body === "string" && compObj.body.length > 0) {
                heading = YSLOW.util.escapeHtml(compObj.url);
                body = YSLOW.util.escapeHtml(YSLOW.cssmin(compObj.body, -1));
                renderer.addContent(heading, body);
            }
        }

        // Iterate over the inline STYLE blocks.
        for (i = 0; i < aElements.length; i += 1) {
            elem = aElements[i];
            if (elem.innerHTML) { // avoid external elem objects
                index += 1;
                heading2 = "inline style block #" + parseInt(index, 10);
                renderer.addContent(heading2, YSLOW.util.escapeHtml(YSLOW.cssmin(elem.textContent, -1)));
            }
        }

        return renderer.htmlview();
    },

    /**
     * @private
     */
    printable: function (doc, components, param) {
        var cnt, format, view, sText, uri, req2, css,
            plot_component = false,
            data_uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAABnRSTlMAAAAAAABupgeRAAADV0lEQVR4Xu2UK5CkPBSFkS2R2MjIyNjIyMjYSCQyFhmJjEUikVhkSyS2ZcuRvR+k57Vbtf+jRuxWDXWKoqpnznfvPbmpvp9vfevP0b7v1+t1OZ91Xfn+AsD9fi+m8zxj+gaYpinn3J8P37D/DwA7TG+328vLy+PxwKXUjuAV0jiOMLquTWkA89+mQflYw2jbVghR140QsmkOCYGE1oqfaGUYhq7rQgiA/5U7omQY1hp8m0ZLGaTspGyN6UM7GMO3P6SsUsp7Tx8w+ACGwT+4U3tKCWsprTFJqb4IBu7TdPU+iQMZhPRCOKUsD90g51xh/M6dcqqqVirO876uewFocwD6nrT3DwDePsZsXWutIwwGZYwhG8L7OdKP7kxD6SG0EyHnfJUywuD9C8CP48K/0gCTdM6XJmBwBD4dx1I+KREm7lpnrQcYMfL/N0gF4H3uupEk2oZ8TBpmagptahqLmFUIzyYgUfSnJeJNm/ydNiOAImMG50be2rwOSkUr2/4iXKPyuJAKMZyyZxOBtGmC8CkX/Pt8zkNW92nhdPb9iukrho/3qIXqc6NTVeNYcn4DkIRSrhxZrXVp4lk+ojXKx5ehw9i2G7XjSBi8SwZCRtf4varjpakF1kWODKZ5YR+HYSQIGMRAEyRxAMo1cE6/o14pEximz3Hgu6gA0FzLe3VhPgAov64t7uQ8L6s2oa41abPYRC2lZA2fVwJXCvPBXalEya+mT5VTJGRP+bgzStWYt/LpG19U3C8XCYClAxBjrOgCsR38gEspFv3yHbXsKP9RVWcArgCa5gCgj4Au9gRQlrwqNxdMANZla5O1JVUAKBbA010IALFWtWpJGEBxZ+e19lo7JATxdtT+DmA+KSV+4MizR4j7gNUFA4wlCHFJId21eQQPIytnutmEUbskVXupLctc7l1ErZ8Ab5c7HRiDYyrbxNKO87as+zijbRi3NUQYu1TAQt79cHVpQ7Zflc/aRppQijwaRgSADJ4AAgB43hDsSMp5oQms52WDkafDvR+3yDstXVpD3kLC/RDuJq46rrJbhc8cLXyGIbMKgogAcIQonxEBoHCsEdbolfFsIs/7cKqfNlSQ7XD1pwoDEQ+xOne0gvOxxgBoitXQX/oA4Fqt/vrnB0Zv9A86EEveAAAAAElFTkSuQmCC';

        cnt = '<div id="printableDiv">' + '<div id="print-title"><img src="' + data_uri + '" align="absbottom"/>YSlow for Firebug</div><hr />';

        try {
            //Print the website address:
            cnt += '<div class="pageURL"><span>URL:</span>' + '<span>' + YSLOW.util.prettyAnchor(doc.location.href, doc.location.href) + '</span></div>';

        } catch (err1) {
            // do nothing
        }

        cnt += '<div id="yslowDiv">'; //yslowDiv start
        YSLOW.renderer.bPrintable = true;

        if (param && param.yscontext) {
            if (param.options === undefined) {
                param.options = {
                    'grade': 1,
                    'components': 1,
                    'stats': 1
                };
            }
            format = 'html';
            for (view in param.options) {
                if (param.options.hasOwnProperty(view)) {
                    sText = '<div class="section">';

                    try {
                        switch (view) {
                        case 'grade':
                            sText += '<div class="title">Grade</div><div class="contentDiv">' + param.yscontext.genPerformance(format);
                            break;
                        case 'components':
                            sText += '<div class="title">Components</div><div class="contentDiv">' + param.yscontext.genComponents(format);
                            break;
                        case 'stats':
                            sText += '<div class="title">Stats</div><div class="contentDiv">' + param.yscontext.genStats(format);
                            plot_component = true;
                            break;
                        default:
                            continue;
                        }
                    } catch (err2) {
                        // do nothing.
                    }
                    if (sText.length > 0) {
                        cnt += sText + '</div></div>';
                    }
                }
            }
        }

        cnt += '</div>\n' + //yslowDiv END
        '<br /><hr />' + '<div class="copyright">' + (YSLOW.doc.copyright ? YSLOW.doc.copyright : 'Copyright &copy; 2010 Yahoo! Inc. All rights reserved.') + '</div>' + '</div>'; // printableDiv END

        //If we were generating performance stats for a printable version, we should reset this flag after we are done.
        //This is required so that performance output on the FF panel remains unexpanded and correctly formated.
        YSLOW.renderer.bPrintable = false;
        
        // add styling
        uri = 'chrome://yslow/content/yslow/printable.css';
        req2 = new XMLHttpRequest();
        req2.open('GET', uri, false);
        req2.overrideMimeType('text/css');
        req2.send(null);
        css = req2.responseText;

        return {
            'css': css,
            'html': cnt,
            'plot_component': plot_component
        };
    },

    /**
     * @private
     */
    runSmushIt: function (doc, components) {
        var i, new_doc, js, s,
            imgs = [],
            images = components.getComponentsByType(['image', 'cssimage'], true);

        if (images.length > 0) {
            for (i = 0; i < images.length; i += 1) {
                imgs.push(images[i].url);
            }
        }

        new_doc = YSLOW.util.getNewDoc();

        new_doc.body.innerHTML = '<form method="post" action="' + YSLOW.util.getSmushUrl() + '">' + '<input type="hidden" name="img" value="' + imgs.join('\n') + '">' + '</form>';


        js = 'document.forms[0].submit();';
        s = new_doc.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.appendChild(new_doc.createTextNode(js));
        new_doc.body.appendChild(s);
    }
};

/**
 * @private
 * Helper class to generate html code for tools.
 * @constructor
 */
YSLOW.ToolResult = function () {
    this.title = '';
    this.content = [];
};

YSLOW.ToolResult.prototype = {

    /**
     * @private
     */
    addTitle: function (title) {
        this.title = title;
    },

    /**
     * @private
     */
    addContent: function (heading, body) {
        this.content[this.content.length] = {
            'heading': heading,
            'content': body
        };
    },

    /**
     * @private
     */
    htmlview: function () {
        var j,
            html = '',
            toc = '';

        toc += '<ol>';
        if (this.content.length > 0) {
            html += '<pre>';
            for (j = 0; j < this.content.length; j += 1) {
                toc += '<li><a href="about:blank#' + j + '">' + this.content[j].heading + '</a></li>';
                html += '<a name="' + j + '"><div id="#' + j + '" class="blockheader">' + this.content[j].heading + '</div>';
                html += this.content[j].content;
            }
            html += '</pre>';
        }
        toc += '</ol>';

        html = toc + html;
        if (typeof this.title === "string" && this.title.length > 0) {
            html = '<div class="gentitleheader">' + this.title + '</div>' + html;
        }

        return html;
    }
};

/**
 * Register tools
 */

YSLOW.Tools.addBuiltinTool({
    id: 'jslint',
    //name: 'Run JSLint',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.JSLint.runJSLint(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'alljs',
    //name: 'All JS',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.loadAllJS(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'jsbeautified',
    //name: 'All JS beautified',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.loadAllJS(doc, components, true);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'jsminified',
    //name: 'All JS minified',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.runAllJSMin(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'allcss',
    //name: 'All CSS',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.loadAllCSS(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'cssmin',
    //name: 'YUI CSS Compressor',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.runCSSMin(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'smushItAll',
    //name: 'Smush.It All',
    print_output: false,
    run: function (doc, components) {
        return YSLOW.Tools.runSmushIt(doc, components);
    }
});

YSLOW.Tools.addBuiltinTool({
    id: 'printableview',
    //name: 'Printable View',
    print_output: true,
    run: function (doc, components, param) {
        return YSLOW.Tools.printable(doc, components, param);
    }
});
