
/**
 * @fileoverview Auth delegate adapters for old to new delegates.
 */
var auth = require('auth');
var authApi = require('./auth-api');
var bind = require('mout/function/bind');
var LivefyreUser = require('./user');
var session = require('./session');

/**
 * @typedef {Object} OldAuthDelegate
 * @property {function()} login
 * @property {function()} logout
 * @property {function()} viewProfile
 * @property {function()} editProfile
 * @property {function()} loginByCookie
 */

/**
 * @typedef {Object} AuthDelegate
 * @property {function()} login
 * @property {function()} logout
 * @property {function()} viewProfile
 * @property {function()} editProfile
 * @property {fucntion()} destroy
 */

/**
 * @typedef {Object} BetaAuthDelegate
 * @property {function()} login
 * @property {function()} logout
 * @property {function()} viewProfile
 * @property {function()} editProfile
 * @property {function()} restoreSession
 * @property {string} serverUrl
 */

/**
 *
 * @param {AuthDelegate|OldAuthDelegate} delegate
 * @return {boolean}
 */
function isFyreOld(delegate) {
    var isDelegateOld = typeof delegate.loginByCookie === 'function';
    var doesFyreExist = window.fyre && typeof window.fyre.conv === 'object';
    return !!isDelegateOld && !!doesFyreExist;
}

/**
 * The livefyre delegate from Sidenotes beta days
 * see https://github.com/Livefyre/auth-delegates
 * @param {AuthDelegate|BetaAuthDelegate} delegate
 * @return {boolean}
 */
function isBetaDelegate(delegate) {
    var hasRestoreSession = typeof delegate.restoreSession === 'function';
    var hasLivefyreUser = window.Livefyre && typeof window.Livefyre.user === 'object';
    return hasRestoreSession && hasLivefyreUser;
}

/**
 *
 * @param {AuthDelegate|OldAuthDelegate|BetaAuthDelegate} delegate
 * @return {boolean}
 */
function isOld(delegate) {
    return isFyreOld(delegate) || isBetaDelegate(delegate);
}

function adaptBetaDelegate(delegate) {
    var newDelegate = {};
    var Livefyre = window.Livefyre;

    function callbackHandler(callback, args) {
        if (typeof callback === 'function') {
            callback.apply(this, null, args);
        }
    }

    function handleLogin(userInfo) {
        var user = new LivefyreUser();
        // Store the serverUrl
        // TODO(jj): I am kicking myself due to this pattern of copying around the serverUrl
        // b/c it has become spaghetti code
        userInfo.serverUrl = delegate.serverUrl;
        user = authApi.updateUser(user, userInfo);
        auth.login({
            livefyre: user
        });
    }

    function handleLogout() {
        auth.emit('logout');
    }

    Livefyre.user.on('login', handleLogin);
    Livefyre.user.on('logout', handleLogout);

    newDelegate.login = (function () {
        var originalFn = delegate.login;
        return function (callback) {
            originalFn.call(delegate);
            Livefyre.user.once('login', function (userInfo) {
                callbackHandler(callback, [userInfo]);
            });
        };
    })();

    newDelegate.logout = (function () {
        var originalFn = delegate.logout;
        return function (callback) {
            originalFn.call(delegate);
            Livefyre.user.once('logout', function () {
                callbackHandler(callback);
            });
        };
    })();

    newDelegate.viewProfile = bind(delegate.viewProfile, delegate);

    newDelegate.editProfile = bind(delegate.editProfile, delegate);

    newDelegate.destroy = function () {
        Livefyre.user.removeListener('login', handleLogin);
        Livefyre.user.removeListener('logout', handleLogout);
        delegate.destroy();
    };

    return newDelegate;
}

function adaptOldDelegate(delegate) {
    var fyre = window.fyre;

    function handleChangeToken(user, token) {
        if (!token) {
            return auth.emit('logout');
        }
        auth.login({
            livefyre: session.get()
        });
    }

    fyre.conv.user.on('change:token', handleChangeToken);

    if (fyre.conv.user.id) {
        if (!auth.get('livefyre')) {
            handleChangeToken(fyre.conv.user.get('token'));
        }
    }

    var handler = {
        success: function () {},
        failure: function () {}
    };
    function callbackHandler(callback) {
        return {
            success: function () {
                if (typeof callback === 'function') {
                    callback.apply(this, null, arguments);
                }
            },
            failure: function () {
                if (typeof callback === 'function') {
                    callback.apply(this, arguments);
                }
            }
        };
    }
    var slice = Array.prototype.slice;

    var newDelegate = {};

    newDelegate.login = (function () {
        var originalFn = delegate.login;
        return function (callback) {
            originalFn.call(delegate, callbackHandler(callback));
        };
    })();

    newDelegate.logout = (function () {
        var originalFn = delegate.logout;
        return function (callback) {
            originalFn.call(delegate, handler);
            callback();
        };
    })();

    newDelegate.viewProfile = (function () {
        var originalFn = delegate.viewProfile;
        return function () {
            var args = slice.call(arguments);
            args.unshift(handler);
            originalFn.apply(delegate, args);
        };
    })();

    newDelegate.editProfile = (function () {
        var originalFn = delegate.editProfile;
        return function () {
            var args = slice.call(arguments);
            args.unshift(handler);
            originalFn.apply(delegate, args);
        };
    })();

    newDelegate.destroy = function () {
        fyre.conv.user.off('change:token', handleChangeToken);
    };

    delegate.loginByCookie(handler);

    return newDelegate;
}

/**
 * Fill in interface for old delegate to new delegate.
 * @param {OldAuthDelegate} delegate
 * @param {string} articleId
 * @param {string} siteId
 * @param {string} networkId
 * @param {string} environment
 */
function oldToNew(delegate) {
    if (isBetaDelegate(delegate)) {
        return adaptBetaDelegate(delegate);
    } else if (isFyreOld(delegate)) {
        return adaptOldDelegate(delegate);
    } else {
        return delegate;
    }
}

module.exports = {
    oldToNew: oldToNew,
    isOld: isOld
};
