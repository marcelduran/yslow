/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, regexp: true, continue: true, plusplus: true, bitwise: true, newcap: true, type: true, unparam: true, maxerr: 50, indent: 4*/

/**
 *
 * Example of a rule object:
 *
 * <pre>
 * YSLOW.registerRule({
 *
 *     id: 'myrule',
 *     name: 'Never say never',
 *     url: 'http://never.never/never.html',
 *     info: 'Short description of the rule',
 *
 *     config: {
 *          when: 'ever'
 *     },
 *
 *     lint: function(doc, components, config) {
 *         return {
 *             score: 100,
 *             message: "Did you just say never?",
 *             components: []
 *         };
 *     }
 * });
  </pre>
 */

YSLOW.registerRule({
    id: 'rGradient',
    name: 'Replace CSS3 gradients by repeated images and vice-versa',
    info: 'TODO: long desc here',
    url: 'http://',
    category: ['css3'],

    config: {
    },

    lint: function (doc, cset, config) {

        return {
            score: 100,
            message: '',
            components: []
        };
    }
});

/**
 * YSLOW.registerRuleset({
 *
 *     id: 'myalgo',
 *     name: 'The best algo',
 *     rules: {
 *         myrule: {
 *             ever: 2,
 *         }
 *     }
 *
 * });
 */

YSLOW.registerRuleset({
    id: 'rslow',
    name: 'RSlow',
    rules: {
        rGradient: {}
    },
    weights: {
        rGradient: 2
    }
});
