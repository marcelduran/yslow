/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * This class implement YSLOW.util.Preferences for Firefox.
 * @class
 * @static
 */

YSLOW.firefox.Preference = {
    prefDomain: "extensions.yslow",

    /**
     * Get Preference value from Mozilla preferences-service.
     * @param {String} name name of preference to get.
     * @return preference value
     */
    getPrefValue: function (name) {
        var prefName, type,
            nsIPrefBranch = Components.interfaces.nsIPrefBranch,
            nsIPrefBranch2 = Components.interfaces.nsIPrefBranch2,
            prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(nsIPrefBranch2);

        //Check if this is global firefox preference.
        if (name.indexOf("extensions.") !== -1 || name.indexOf("browser.") !== -1) {
            prefName = name;
        } else {
            prefName = this.prefDomain + "." + name;
        }

        type = prefs.getPrefType(prefName);
        if (type === nsIPrefBranch.PREF_STRING) {
            return prefs.getCharPref(prefName);
        } else if (type === nsIPrefBranch.PREF_INT) {
            return prefs.getIntPref(prefName);
        } else if (type === nsIPrefBranch.PREF_BOOL) {
            return prefs.getBoolPref(prefName);
        }

        return undefined;
    },

    /**
     * Get Preference with default value.  If the preference does not exist,
     * return the passed default_value.
     * @param {String} name preference name
     * @return preference value or default value.
     */
    getPref: function (name, default_value) {
        var val = this.getPrefValue(name);

        return (("undefined" === typeof val) ? default_value : val);
    },

    /**
     * Get child preference list in branch.
     * @param {String} branch_name branch name
     * @param default_value value to return if no preference is found.
     * @return array of preference name/value pairs.
     */
    getPrefList: function (branch_name, default_value) {
        var i, prefName, prefs, branch, children, value, type,
            values = [],
            nsIPrefBranch = Components.interfaces.nsIPrefBranch;

        if (branch_name.indexOf("extensions.") !== -1) {
            prefName = branch_name;
        } else {
            prefName = this.prefDomain + "." + branch_name;
        }

        prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        branch = prefs.getBranch(prefName);
        children = branch.getChildList("", {});

        for (i = 0; i < children.length; i += 1) {
            type = branch.getPrefType(children[i]);
            if (type === nsIPrefBranch.PREF_STRING) {
                value = branch.getCharPref(children[i]);
            } else if (type === nsIPrefBranch.PREF_INT) {
                value = branch.getIntPref(children[i]);
            } else if (type === nsIPrefBranch.PREF_BOOL) {
                value = branch.getBoolPref(children[i]);
            } else {
                continue;
            }
            values.push({
                'name': children[i],
                'value': value
            });
        }

        return (values.length === 0 ? default_value : values);
    },

    /**
     * Set Preference.
     * @param {String} name preference name
     * @param {String} value preference value
     */
    setPref: function (name, value) {
        var prefName,
            nsIPrefBranch2 = Components.interfaces.nsIPrefBranch2,
            prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(nsIPrefBranch2);

        //Check if this is global firefox preference.
        if (name.indexOf('extensions.') !== -1) {
            prefName = name;
        } else {
            prefName = this.prefDomain + '.' + name;
        }

        if (typeof value === 'string') {
            prefs.setCharPref(prefName, value);
        } else if (typeof value === 'number') {
            prefs.setIntPref(prefName, value);
        } else if (typeof value === 'boolean') {
            prefs.setBoolPref(prefName, value);
        } else {
            prefs.setCharPref(prefName, value.toString());
        }
    },

    /**
     * Delete Preference with passed name.
     * @param {String} name name of preference to be deleted
     */
    deletePref: function (name) {
        var prefName, prefs, index, pref_name, branch;

        if (name.indexOf("extensions.") !== -1) {
            prefName = name;
        } else {
            prefName = this.prefDomain + "." + name;
        }
        if (prefName.indexOf("extensions.yslow.") === -1 && prefName.indexOf("extensions.firebug.yslow.") === -1) {
            // only delete yslow pref.
            return;
        }

        prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        index = prefName.lastIndexOf(".");
        if (index !== -1) {
            pref_name = prefName.substring(index + 1);
            branch = prefs.getBranch(prefName.substring(0, index + 1));
            branch.deleteBranch(pref_name);
        }
    }
};
YSLOW.util.Preference.registerNative(YSLOW.firefox.Preference);
