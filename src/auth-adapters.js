
/**
 * @fileoverview Auth delegate adapters for old to new delegates.
 */
var auth = require('auth');
var authApi = require('./auth-api');
var bind = require('mout/function/bind');
var LivefyreUser = require('./user');

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

    newDelegate.login = (function () {
        var originalFn = delegate.login;
        return function () {
            originalFn.call(delegate);
            Livefyre.user.once('login', function (userInfo) {
                var user = new LivefyreUser();
                // Store the serverUrl
                // TODO(jj): I am kicking myself due to this pattern of copying around the serverUrl
                // b/c it has become spaghetti code
                userInfo.serverUrl = delegate.serverUrl;
                user = authApi.updateUser(user, userInfo);
                auth.authenticate({
                    livefyre: user
                });
            });
        };
    })();

    newDelegate.logout = (function () {
        var originalFn = delegate.logout;
        return function (done) {
            originalFn.call(delegate);
            Livefyre.user.once('logout', function () {
                done();
            });
        };
    })();

    newDelegate.viewProfile = bind(delegate.viewProfile, delegate);

    newDelegate.editProfile = bind(delegate.editProfile, delegate);

    return newDelegate;
}

function adaptOldDelegate(delegate) {
    var fyre = window.fyre;

    function handleChangeToken(token) {
        if (!token) {
            return auth.logout();
        }
        auth.authenticate({
            livefyre: {
                token: token
            }
        });
    }

    fyre.conv.user.on('change:token', function (user, token) {
        handleChangeToken(token);
    });

    if (!fyre.conv.ready.hasFired()) {
        fyre.conv.ready.trigger();
    }

    if (fyre.conv.user.id) {
        if (!auth.get('livefyre')) {
            handleChangeToken(fyre.conv.user.get('token'));
        }
    }

    var handler = {
        success: function () {},
        failure: function () {}
    };
    var slice = Array.prototype.slice;

    var newDelegate = {};

    newDelegate.login = (function () {
        var originalFn = delegate.login;
        return function () {
            originalFn.call(delegate, handler);
        };
    })();

    newDelegate.logout = (function () {
        var originalFn = delegate.logout;
        return function (done) {
            originalFn.call(delegate);
            done();
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

    delegate.loginByCookie();

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
