// auth delegate to log in with your Livefyre.com account

var adapters = require('./auth-adapters');
var jsonp = require('./util/jsonp');
var storage = require('./util/storage');
var userAgent = navigator.userAgent;
var AUTH_COOKIE_KEY = 'fyre-auth';
var userService = require('./user-service');
var IS_OPERA = userAgent.indexOf('Opera') > -1;
var session = require('./session');

/**
 * @param {string} serverUrl
 * @constructor
 * @extends {BaseDelegate}
 */
function LivefyreDelegate(serverUrl) {
    if ( ! (this instanceof LivefyreDelegate)) {
        return new LivefyreDelegate(serverUrl);
    }
    this.serverUrl = serverUrl;
}

/**
 * Fire login popup, and on success login the user.
 */
LivefyreDelegate.prototype.login = function(authenticate) {
    var self = this;
    this._popup(function () {
        self.restoreSession(function (err, user) {
            authenticate(err, {
                livefyre: user
            });
        });
    });
};

/**
 * @param {function()} callback
 * @private
 */
LivefyreDelegate.prototype._popup = function(callback) {
    var serverUrl = this.serverUrl;
    var windowUrl = serverUrl + '/auth/popup/login/';
    var popup = window.open(windowUrl, 'authWindow',
    'width=530;height=365;location=true;menubar=false;resizable=false;scrollbars=false');
    var timeout = setInterval(function() {
        testResult(callback, popup);
    }, 100);

    function isActive(popup) {
        if (!popup) {
            return false;
        }
        try {
            // Opera has a bug that changes popup.closed to undefined rather than true.
            return (popup.closed === false);
        } catch(e) {
            if (IS_OPERA) {
                return true;
            }
            throw e;
        }
    }

    function testResult(callback, popup) {
        if (!isActive(popup)) {
            clearInterval(timeout);
            callback();
            return;
        }
    }
};

/**
 * @param {function()} callback
 */
LivefyreDelegate.prototype.logout = function(finishLogout) {
    var url = this.serverUrl + '/auth/logout/ajax/?nocache=' + (new Date()).getTime();
    jsonp.req(url, function (err, data) {
        finishLogout(err, data);
    });
};

/**
 * @param {Object} author
 */
LivefyreDelegate.prototype.viewProfile = function(author) {
    window.open(author.profileUrl, '_blank');
};

LivefyreDelegate.prototype.editProfile = function() {
    window.open(this.serverUrl + '/profile/edit/info/', '_blank');
};

// Called after we close the popup, to get the resulting session
LivefyreDelegate.prototype.restoreSession = function(callback) {
    var cookieData = storage.get(AUTH_COOKIE_KEY) || {};
    if (cookieData['token']) {
        callback(null, cookieData.token.value);
    } else {
        storage.remove(AUTH_COOKIE_KEY);
        userService.fetch({ serverUrl: this.serverUrl }, function (err, user, userInfo) {
            if (err) {
                return callback(err);
            }
            session.save(userInfo, user);
            callback(null, user);
        });
    }
};

module.exports = LivefyreDelegate;
