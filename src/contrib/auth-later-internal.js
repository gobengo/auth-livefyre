/**
 * @fileoverview More than just stub! Here we check if Livefyre auth is on the page. If it is, we use it.
 * If it isn't, then we fetch Livefyre.js and in set up a proxy/queue to the incoming Livefyre auth.
 */
var authInterface = require('lib/auth/src/contrib/auth-interface');
var getScript = require('../util/get-script');

var internal = {};
internal.hazAuth = false;
internal.pendingCalls = [];
internal.auth = {};

/**
 * Has auth arrived? We check that Livefyre.js is on the page, since it haz auth.
 */
internal.authHasArrived = function() {
    return window.Livefyre && window.Livefyre['_lfjs'] === true;
}

/**
 * Flush the pending calls now that auth has arrived
 */
internal.flushPendingCalls = function() {
    var methodCall;
    for (var i = 0; i < internal.pendingCalls.length; i++) {
        methodCall = internal.pendingCalls[i];
        internal.auth[methodCall[0]].apply(internal.auth, methodCall[1]);
    }
    internal.pendingCalls = [];
}

/**
 * Proxy a call to Livefyre auth
 * @param {string} methodName
 */
internal.proxyCall = function(methodName) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (internal.hazAuth) {
        return internal.auth[methodName].apply(internal.auth, args);
    }
    internal.pendingCalls.push([methodName, args]);
}

/**
 * Load Scout to Load LivefyreJS + Auth
 */
internal.getLivefyreJS = function() {
    getScript.req('//cdn.livefyre.com/Livefyre.js', function () {
        window.Livefyre.on('initialized', internal.handleAuthHasArrived);
    });
}

/**
 * Proxy all public auth methods so that they can be invoked before auth is actually on the page.
 */
internal.getAuth = function() {
    var methodName;
    for (var i = authInterface.length - 1; i >= 0; i--) {
        methodName = authInterface[i];
        internal.auth[methodName] = internal.proxyCall.bind(internal.auth, methodName);
    }

    // If we don't have auth, fetch Livefyre.js
    if (internal.authHasArrived()) {
        internal.handleAuthHasArrived();
    } else {
        internal.getLivefyreJS();
    }

    return internal.auth;
}

/**
 * Yay auth is here!
 */
internal.handleAuthHasArrived = function() {
    window.Livefyre.require(['auth'], function (authModule) {
        internal.auth = authModule;
        internal.hazAuth = true;
        internal.flushPendingCalls();
        // we need to fake a login b/c we might have a session user
        // and the event listeners just lost a race as they registered after auth initialized.
        var session = internal.auth.get();
        if (session) {
            internal.auth.login(session);
        }
    });
}

module.exports = internal;
