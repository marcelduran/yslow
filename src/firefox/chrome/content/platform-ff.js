/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

YSLOW.util.evalInSandbox = function (text) {
    var s = new Components.utils.Sandbox("about:blank");

    return Components.utils.evalInSandbox("(" + text + ")", s);
};

YSLOW.util.setTimer = function (callback, delay) {
    var timer,
        event = {
        notify: function (timer) {
            try {
                callback.call();
            } catch (e) {
                YSLOW.util.dump(e);
            }
        }
    };

    // Now it is time to create the timer...
    timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);

    delay = delay || 0;

    // ... and to initialize it, we want to call event.notify() ...
    // ... one time after exactly ten second.
    timer.initWithCallback(event, delay, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
};
