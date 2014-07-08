/**
 * @fileoverview More than just stub! Here we check if Livefyre auth is on the page. If it is, we use it.
 * If it isn't, then we fetch Livefyre.js and in set up a proxy/queue to the incoming Livefyre auth.
 */
var authInterface = require('lib/auth/src/contrib/auth-interface');
var getScript = require('../util/get-script');

exports.hazAuth = false;
exports.pendingCalls = [];
exports.auth = {};

/**
 * Has auth arrived? We check that Livefyre.js is on the page, since it haz auth.
 */
exports.authHasArrived = function() {
    return window.Livefyre && window.Livefyre['_lfjs'] === true;
}

/**
 * Flush the pending calls now that auth has arrived
 */
exports.flushPendingCalls = function() {
    var methodCall;
    for (var i = 0; i < exports.pendingCalls.length; i++) {
        methodCall = exports.pendingCalls[i];
        exports.auth[methodCall[0]].apply(exports.auth, methodCall[1]);
    }
    exports.pendingCalls = [];
}

/**
 * Proxy a call to Livefyre auth
 * @param {string} methodName
 */
exports.proxyCall = function(methodName) {
    var args = Array.prototype.slice.call(arguments, 1);
    if (exports.hazAuth) {
        return exports.auth[methodName].apply(exports.auth, args);
    }
    exports.pendingCalls.push([methodName, args]);
}

/**
 * Load Scout to Load LivefyreJS + Auth
 */
exports.getLivefyreJS = function() {
    getScript.req('//cdn.livefyre.com/Livefyre.js', function () {
        window.Livefyre.on('initialized', exports.handleAuthHasArrived);
    });
}

/**
 * Proxy all public auth methods so that they can be invoked before auth is actually on the page.
 */
exports.getAuth = function() {
    var methodName;
    for (var i = authInterface.length - 1; i >= 0; i--) {
        methodName = authInterface[i];
        exports.auth[methodName] = exports.proxyCall.bind(exports.auth, methodName);
    }

    // If we don't have auth, fetch Livefyre.js
    if (exports.authHasArrived()) {
        exports.handleAuthHasArrived();
    } else {
        exports.getLivefyreJS();
    }

    return exports.auth;
}

/**
 * Yay auth is here!
 */
exports.handleAuthHasArrived = function() {
    window.Livefyre.require(['auth'], function (authModule) {
        exports.auth = authModule;
        exports.hazAuth = true;
        exports.flushPendingCalls();
        // we need to fake a login b/c we might have a session user
        // and the event listeners just lost a race as they registered after auth initialized.
        var session = exports.auth.get();
        if (session) {
            exports.auth.login(session);
        }
    });
}
