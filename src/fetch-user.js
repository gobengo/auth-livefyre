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
 */
module.exports = function (opts, errback) {
    authApi(opts, function (err, userInfo) {
        if (err) {
            return errback(err);
        }
        var user = createUser(userInfo);
        errback(null, user, userInfo);
    });
};

function createUser(userInfo) {
    var user = new LivefyreUser();
    authApi.updateUser(user, userInfo);
    return user;
}
