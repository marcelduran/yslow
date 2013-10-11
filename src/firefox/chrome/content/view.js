/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * Load CSS needed for YSlow UI.
 * @param {Document} doc Document to load the CSS files.
 */
YSLOW.view.prototype.loadCSS = function (doc) {
    YSLOW.util.loadCSS('chrome://yslow/content/yslow/tabview.css', doc);
    YSLOW.util.loadCSS('chrome://yslow/content/yslow/yslow.css', doc);
};
