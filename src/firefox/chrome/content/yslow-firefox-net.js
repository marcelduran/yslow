/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2013, Marcel Duran and other contributors. All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW, Components*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true */

/**
 * Use Firefox's native networking support
 *
 * @namespace YSLOW.firefox.net
 * @class net
 * @static
 */
YSLOW.firefox.net = {

    /**
     * Get detail info of the passed url gathered network response from http observation notification.
     * The callback is called with an info object that includes
     * <ul>
     * <li>url</li>
     * <li>status</li>
     * <li>headers</li>
     * <li>raw_headers</li>
     * <li>body</li>
     * <li>method</li>
     * <li>type</li>
     * <li>cookie</li>
     * <li>size</li>
     * <li>respTime</li>
     * <li>startTimestamp</li>
     * </ul>
     * The callback may be called before this function returns.
     *
     * @param url
     * @param callback
     * @param binary, pass true if requesting binary content.
     * @return true if info is found, otherwise returns false.
     */
    getInfo: function (url, callback, binary) {
        var item = YSLOW.firefox.SimpleResponseCache.getItem(url),
            response = {};

        if (item && typeof item !== "undefined" && item.raw_headers.length > 0) {
            response.url = url;
            response.body = item.body;
            response.method = item.method;
            response.cookie = item.cookie;
            response.status = item.status;
            response.headers = item.headers;
            response.raw_headers = item.raw_headers;
            response.req_headers = item.req_headers;
            if (item.type !== undefined) {
                response.type = item.type;
            }
            if (item.size > 0) {
                response.size = item.size;
            }

            if (item.startTimestamp !== undefined) {
                response.startTimestamp = item.startTimestamp;
                if (item.endTimestamp !== undefined) {
                    response.respTime = item.endTimestamp - item.startTimestamp;
                }
            }
            callback(response);

            return true;
        }

        return false;
    },

    /**
     * Get url of requests identified by type.
     * @param {String|Array} type The type of component to get, e.g. "js" or ['js', 'css']
     * @return array of url
     */
    getResponseURLsByType: function (type) {

        return YSLOW.firefox.SimpleResponseCache.getURLByType(type);

    }

};

// shorthands
var Cc = Components.classes,
    Ci = Components.interfaces;

/**
 * Firefox observer
 *
 * @todo call unregister to removeObserver.
 */
YSLOW.firefox.observer = function () {
    this.register();

    YSLOW.util.event.addListener('onUnload', function () {
        // Clears SimpleResponseCache
        YSLOW.firefox.SimpleResponseCache.clear();
    }, this);
};

/**
 * Implement nsIObserver
 */
YSLOW.firefox.observer.prototype = {
    observe: function (subject, topic, data) {
        try {
            switch (topic) {
            case "http-on-modify-request":
            case "http-on-examine-response":
                this.handleObserverHttpTopic(subject, topic);
                break;
            case "http-on-examine-merged-response":
                break;
            default:
                return;
            }

        } catch (err) {
            YSLOW.util.dump("YSLOW.firefox.observer.observe()" + err);
        }
    },

    register: function () {
        var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

        observerService.addObserver(this, "http-on-modify-request", false);
        observerService.addObserver(this, "http-on-examine-response", false);
        observerService.addObserver(this, "http-on-examine-merged-response", false);
    },

    unregister: function () {
        var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

        observerService.removeObserver(this, "http-on-modify-request");
        observerService.removeObserver(this, "http-on-examine-response");
        observerService.removeObserver(this, "http-on-examine-merged-response");

    },

    handleObserverHttpTopic: function (httpChannel, topic) {
        var group_observer, win, owner, obj, new_listener, visitor,
            now = (new Date()).getTime();

        try {
            httpChannel.QueryInterface(Components.interfaces.nsIHttpChannel);
        } catch (err1) {
            // can't proceed without httpChannel.
            return;
        }

        // check if this is just our response content loader
        if (httpChannel.owner) {
            try {
                owner = httpChannel.owner;
                owner.QueryInterface(Components.interfaces.nsISupportsString);
                if (owner.data === "YSLOW.firefox.ContentLoaderFlagger") {
                    // this request is generated by our content loader, don't save.
                    return;
                }
            } catch (err2) {
                // not our own request, continue.
            }
        }

        if (httpChannel.loadGroup && httpChannel.loadGroup.groupObserver) {
            try {
                group_observer = httpChannel.loadGroup.groupObserver.QueryInterface(Components.interfaces.nsIWebProgress);
                win = group_observer.DOMWindow;

                if (win !== YSLOW.firefox.win) {
                    if ((httpChannel.loadFlags & Components.interfaces.nsIHttpChannel.LOAD_DOCUMENT_URI) === 0) {
                        return;
                    }
                }
            } catch (err3) {
                return;
            }
        }

        if (topic === "http-on-modify-request") {
            this.listener = new YSLOW.firefox.ChannelProgressListener(httpChannel.notificationCallbacks);

            obj = YSLOW.firefox.SimpleResponseCache.getItem(httpChannel.URI.asciiSpec);
            // first check if we have this url in SimpleResponseCache already.
            if (obj === null) {
                obj = {};
                obj.httpChannel = httpChannel;
                obj.status = 0;
                obj.method = httpChannel.requestMethod;
                obj.headers = {};
                obj.raw_headers = '';
                obj.body = '';
                if (httpChannel.loadFlags & Components.interfaces.nsIRequest.LOAD_BACKGROUND) {
                    obj.type = 'xhr';
                }
                // check cookie header
                try {
                    obj.cookie = httpChannel.getRequestHeader("Cookie");
                } catch (err4) {
                    obj.cookie = '';
                }
                try {
                    visitor = new YSLOW.firefox.HttpHeaderVisitor();
                    httpChannel.visitRequestHeaders(visitor);
                    obj.req_headers = visitor.headers;
                } catch (err5) {}
                obj.size = 0;
                obj.startTimestamp = now;
                YSLOW.firefox.SimpleResponseCache.add(httpChannel.URI.asciiSpec, obj);
            }
        } else if (topic === "http-on-examine-response") {
            new_listener = new YSLOW.firefox.TracingListener();
            httpChannel.QueryInterface(Ci.nsITraceableChannel);
            new_listener.original_listener = httpChannel.setNewListener(new_listener);

            visitor = new YSLOW.firefox.HttpHeaderVisitor();
            try {
                httpChannel.visitResponseHeaders(visitor);
            } catch (err6) {}

            obj = YSLOW.firefox.SimpleResponseCache.getItem(httpChannel.URI.asciiSpec);
            if (obj) {
                try {
                    obj.status = httpChannel.responseStatus;
                } catch (err7) {
                    obj.status = 0;
                }
                obj.headers = visitor.headers;
                obj.raw_headers = visitor.raw_headers;
                try {
                    if (obj.type === undefined && httpChannel.contentType) {
                        obj.type = YSLOW.util.getComponentType(httpChannel.contentType);
                    }
                    if (obj.status === 302) {
                        obj.type = 'redirect';
                    }
                } catch (err8) {
                    // don't set type.
                }
                obj.endTimestamp = now;
                YSLOW.firefox.SimpleResponseCache.add(httpChannel.URI.asciiSpec, obj);
            }
        }

    },

/*
     * nsISupports
     */
    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIObserver) || aIID.equals(Ci.nsSupports)) {
            return this;
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }

};

YSLOW.firefox.ChannelProgressListener = function (original_callbacks) {
    this.original_callbacks = original_callbacks;
};

YSLOW.firefox.ChannelProgressListener.prototype = {

/*
     * nsIProgressEventSink API
     */
    onProgress: function (request, context, progress, progressMax) {
        var cb, obj;

        if (this.original_callbacks) {
            try {
                cb = this.original_callbacks.getInterface(Ci.nsIProgressEventSink);
                if (cb) {
                    cb.onProgress(request, context, progress, progressMax);
                }
            } catch (e) {
                // YSLOW.util.dump('YSLOW.firefox.ChannelProgressListener.onProgress: ' + e.toString());
            }
        }

        obj = YSLOW.firefox.SimpleResponseCache.getItem(request.name);
        if (obj) {
            obj.size = progress;
            YSLOW.firefox.SimpleResponseCache.add(request.name, obj);
        }
    },

    onStatus: function (request, context, status, statusArg) {
        var cb;

        if (this.original_callbacks) {
            try {
                cb = this.original_callbacks.getInterface(Ci.nsIProgressEventSink);
                if (cb) {
                    cb.onStatus(request, context, status, statusArg);
                }
            } catch (e) {
                // YSLOW.util.dump('YSLOW.firefox.ChannelProgressListener.onStatus: ' + e.toString());
            }
        }
    },

/*
     * nsISupports
     */
    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIProgressEventSink) || aIID.equals(Ci.nsSupports)) {
            return this;
        } else if (this.original_callbacks) {
            return this.original_callbacks.QueryInterface(aIID);
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

/*
     * nsIInterfaceRequestor
     */
    getInterface: function (aIID, result) {
        if (aIID.equals(Ci.nsIProgressEventSink)) {
            return this;
        } else if (this.original_callbacks) {
            return this.original_callbacks.getInterface(aIID, result);
        }
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
};

YSLOW.firefox.HttpHeaderVisitor = function () {

    /**
     * The url of the response header being visited.
     */
    this.headers = {};
    this.raw_headers = '';

};

YSLOW.firefox.HttpHeaderVisitor.prototype = {

    visitHeader: function (name, value) {

        this.headers[name] = value;
        this.raw_headers = name + ": " + value + "\n";

    }

};


/**
 * A simple cache for responses we sniffed through observer.
 *
 * @namespace YSLOW
 * @class firefox.SimpleResponseCache
 * @static
 *
 * @todo when window content changes, SimpleResponseCache needs to be cleared.
 */
YSLOW.firefox.SimpleResponseCache = {

    cache_objs: {},

    /**
     * Add a object to the cache, index by url
     * @param url
     * @param object
     */
    add: function (url, obj) {

        this.cache_objs[url] = obj;

    },

    /**
     * Clear the cache.
     */
    clear: function () {

        this.cache_objs = [];

    },

    /**
     * Get item matching the passed url.
     * @param url
     * @return object matching the url.
     */
    getItem: function (url) {

        if (this.cache_objs[url] !== undefined) {

            return this.cache_objs[url];

        }
        return null;

    },

    /**
     * Get a list of URL by object type.
     * @param {String|Array} type The type of component to get, e.g. "js" or ['js', 'css']
     * @return list of objects having the passed type.
     */
    getURLByType: function (type) {
        var i,
            urls = [],
            types = {};

        if (typeof type === 'string') {
            types[type] = 1;
        } else {
            for (i in type) {
                if (type.hasOwnProperty(i) && type[i]) {
                    types[type[i]] = 1;
                }
            }
        }

        for (i in this.cache_objs) {
            if (this.cache_objs.hasOwnProperty(i) && this.cache_objs[i].type && typeof types[this.cache_objs[i].type] !== 'undefined') {
                urls[urls.length] = i;
            }
        }

        return urls;
    }
};

YSLOW.firefox.TracingListener = function () {
    this.original_listener = null;
};

YSLOW.firefox.TracingListener.prototype = {
    received_data: '',

    onStartRequest: function (request, context) {
        this.original_listener.onStartRequest(request, context);
    },

    onStopRequest: function (request, context, status) {
        var item;

        this.original_listener.onStopRequest(request, context, status);

        // save response data to cache.
        item = YSLOW.firefox.SimpleResponseCache.getItem(request.name);
        if (item) {
            item.body = this.received_data;
        }

    },

    onDataAvailable: function (request, context, input_stream, offset, count) {
        var data,
            binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream),
            storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream),
            binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);

        binaryInputStream.setInputStream(input_stream);
        storageStream.init(8192, count, null);
        binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

        // Copy received data as they come.
        data = binaryInputStream.readBytes(count);
        this.received_data += data;

        binaryOutputStream.writeBytes(data, count);

        this.original_listener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }

};



/**
 * YSLOW.firefox.ContentLoaderFlagger
 *
 * Owner for content loader channel.
 * With this, observer will able to distinguish the request from content loader and don't put them in SimpleCache.
 */
YSLOW.firefox.ContentLoaderFlagger = function () {};

YSLOW.firefox.ContentLoaderFlagger.prototype = {

    data: "YSLOW.firefox.ContentLoaderFlagger",

    toString: function () {

        return "YSLOW.firefox.ContentLoaderFlagger";

    },

    QueryInterface: function (iid) {

        if (iid.equals(Components.interfaces.nsISupportsString) || iid.equals(Components.interfaces.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    }
};
