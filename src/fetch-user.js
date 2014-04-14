var authApi = require('./auth-api');
var LivefyreUser = require('./user');

/**
 * Fetch user profile information from the Livefyre Auth API
 * @param {string} opts.token
 * @param {string=} opts.serverUrl
 * @param {string=} opts.bpChannel
 * @param {string=} opts.articleId
 * @param {string=} opts.siteId
 * @param {function()=} callback
 * @param {object} opts.authApi a custom AuthApi to use
 */
module.exports = function (opts, errback) {
    var api = opts.authApi || authApi;
    api.authenticate(opts, function (err, userInfo) {
        if (err) {
            return errback(err);
        }
        var user = new LivefyreUser();
        api.updateUser(user, userInfo);
        errback(null, user, userInfo);
    });
};
