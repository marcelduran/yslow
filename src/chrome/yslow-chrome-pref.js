/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * This class implement YSLOW.util.Preferences for Chrome.
 * @class
 * @static
 */

YSLOW.util.Preference.registerNative({
    prefDomain: 'extensions.yslow.',

    /**
     * Normalize preference name with domain name
     * @param {String} name preference name
     * @return {String} normalized name
     */
    normalizeName: function (name) {
        var prefDomain = this.prefDomain;

        if (name.indexOf(prefDomain) !== 0) {
            return prefDomain + name;
        }

        return name;
    },

    /**
     * Get Preference with default value.  If the preference does not exist,
     * return the passed defaultValue.
     * @param {String} name preference name
     * @param defaultValue value to return if no preference is found.
     * @return preference value or default value.
     */
    getPref: function (name, defaultValue) {
        var val;

        name = this.normalizeName(name);
        val = localStorage.getItem(name);

        return ((typeof val === 'undefined') ? defaultValue : val);
    },

    /**
     * Get child preference list in branch.
     * @param {String} branchName branch name
     * @param defaultValue value to return if no preference is found.
     * @return array of preference name/value pairs.
     */
    getPrefList: function (branchName, defaultValue) {
        var item,
            values = [];

        branchName = this.normalizeName(branchName || '');
        for (item in localStorage) {
            if (localStorage.hasOwnProperty(item) &&
                    item.indexOf(branchName) === 0) {
                values.push({
                    'name': item,
                    'value': localStorage.getItem(item)
                });
            }
        }

        return (values.length ? values : defaultValue);
    },

    /**
     * Set Preference.
     * @param {String} name preference name
     * @param {String} value preference value
     */
    setPref: function (name, value) {
        name = this.normalizeName(name);
        localStorage.setItem(name, value);
    },

    /**
     * Delete Preference with passed name.
     * @param {String} name name of preference to be deleted
     */
    deletePref: function (name) {
        name = this.normalizeName(name);
        localStorage.removeItem(name);
    },

    initialize: function (items) {
    }
});
