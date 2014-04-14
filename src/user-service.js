var authApi = require('./auth-api');
var LivefyreUser = require('./user');

// Use the default authApi, but if you want a custom
// user-service, you can Object.create and override.
exports._authApi = authApi;

/**
 * Fetch a User from the Livefyre Auth API
 * @param {string} opts.token
 * @param {string=} opts.serverUrl
 * @param {string=} opts.bpChannel
 * @param {string=} opts.articleId
 * @param {string=} opts.siteId
 * @param {function()=} callback
 * @param {object} opts.authApi a custom AuthApi to use
 */
exports.fetch = function (opts, errback) {
    var authApi = this._authApi;
    authApi.authenticate(opts, function (err, userInfo) {
        if (err) {
            return errback(err);
        }
        var user = new LivefyreUser();
        authApi.updateUser(user, userInfo);
        errback(null, user, userInfo);
    });
};
