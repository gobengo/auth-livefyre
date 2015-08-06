var authApi = require('./auth-api');
var deepClone = require('mout/lang/deepClone');
var LivefyreUser = require('./user');
var storage = require('./util/storage');

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
        var toCache = deepClone(userInfo);
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
