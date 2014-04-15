var defaultAuthApi = require('./auth-api');
var LivefyreUser = require('./user');

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
    var authApi = this._authApi || defaultAuthApi;
    authApi.authenticate(opts, function (err, userInfo) {
        var authorizations = [];
        var collectionAuthorization;
        if (err) {
            return errback(err);
        }
        var user = new LivefyreUser();
        // Update user and user.authorizations with info
        authApi.updateUser(user, userInfo, opts);
        errback(null, user, userInfo);
    });
};
