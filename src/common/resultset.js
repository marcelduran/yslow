/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * ResultSet class
 * @constructor
 * @param {Array} results array of lint result
 * @param {Number} overall_score overall score
 * @param {YSLOW.Ruleset} ruleset_applied Ruleset used to generate the result.
 */
YSLOW.ResultSet = function (results, overall_score, ruleset_applied) {
    this.ruleset_applied = ruleset_applied;
    this.overall_score = overall_score;
    this.results = results;
};

YSLOW.ResultSet.prototype = {

    /**
     * Get results array from ResultSet.
     * @return results array
     * @type Array
     */
    getResults: function () {
        return this.results;
    },

    /**
     * Get ruleset applied from ResultSet
     * @return ruleset applied
     * @type YSLOW.Ruleset
     */
    getRulesetApplied: function () {
        return this.ruleset_applied;
    },

    /**
     * Get overall score from ResultSet
     * @return overall score
     * @type Number
     */
    getOverallScore: function () {
        return this.overall_score;
    }

};
