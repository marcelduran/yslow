/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

// initialize defaults
(function () {
    var i, len, item, value,
        pref = YSLOW.util.Preference,
        items = [
            {'name': 'extensions.yslow.optinBeacon', 'value': false},
            {'name': 'extensions.yslow.beaconUrl', 'value': 'http://rtblab.pclick.yahoo.com/images/ysb.gif'},
            {'name': 'extensions.yslow.beaconInfo', 'value': 'basic'},
            {'name': 'extensions.yslow.excludeBeaconsFromLint', 'value': true},
            {'name': 'extensions.yslow.excludeAfterOnload', 'value': true},
            {'name': 'extensions.yslow.smushItURL', 'value': 'http://www.smushit.com/ysmush.it'},
            {'name': 'extensions.yslow.minFutureExpiresSeconds', 'value': 172800},
            {'name': 'extensions.yslow.cdnHostnames', 'value': ''}
        ];

    for (i = 0, len = items.length; i < len; i += 1) {
        item = items[i];
        value = pref.getPref(item.name);
        if (value === null || typeof value === 'undefined') {
            pref.setPref(item.name, item.value);
        }
    }
}());

