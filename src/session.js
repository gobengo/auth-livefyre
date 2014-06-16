var storage = require('./util/storage');
var LivefyreUser = require('./user');
var authApi = require('./auth-api');

// Used for the data from last request to auth api
var AUTH_COOKIE_KEY = 'fyre-auth';
// Used for just the token
var AUTH_CREDS = 'fyre-authentication-creds';

/**
 * The LivefyreUser session that is saved between logins and logouts
 */
var session = module.exports = {
    /**
     * Get an existing session, or null
     * @returns LivefyreUser
     */
    get: function () {
        var cookieData = storage.get(AUTH_COOKIE_KEY) || {};
        if ( ! cookieData.token) {
            return null;
        }
        var user = new LivefyreUser();
        // We save the raw data from the auth api
        authApi.updateUser(user, cookieData);
        return user;
    },
    /**
     * Save a new session for userInfo you provide
     * @param userInfo {object} The full data from the Auth API response
     * @param [user] A LivefyreUser model you've already created
     */
    save: function (userInfo, user) {
        // Pluck all values from userInfo to new object
        var toCache = Object.keys(userInfo).reduce(function (toCache, key) {
            toCache[key] = userInfo[key];
            return toCache;
        }, {});
        var tokenObj = userInfo['token'];
        var tokenExpiresAt = (+new Date()) + tokenObj['ttl'] * 1000;

        if (user) {
            toCache['mod_map'] = user.get('modMap');
        }

        storage.set(AUTH_COOKIE_KEY, toCache, tokenExpiresAt);
        // Store authentication credentials, i.e. the token used for authenticating
        var authCreds = userInfo['token'];
        if (authCreds) {
            storage.set(AUTH_CREDS, authCreds['value'], (+new Date()) + authCreds['ttl'] * 1000);
        }
    },
    /**
     * Clear the session
     */
    clear: function () {
        storage.remove(AUTH_COOKIE_KEY);
        storage.remove(AUTH_CREDS);
    }
};
