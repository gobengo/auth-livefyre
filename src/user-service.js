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
        authApi.updateUser(user, userInfo);
        // If collection info was passed, attempt to create a 
        // CollectionAuthorization from the response
        if (opts.articleId || opts.collectionId) {
            collectionAuthorization = authApi.createCollectionAuthorization(opts, userInfo);
            if (collectionAuthorization) {
                authorizations.push(collectionAuthorization);
            }
        }
        // Add network authorizations
        var networkAuthorizations = authApi.createNetworkAuthorizations(userInfo);
        if (networkAuthorizations && networkAuthorizations.length > 0) {
            authorizations.push.apply(authorizations, networkAuthorizations);
        }
        // Add site authorizations
        var siteAuthorizations = authApi.createSiteAuthorizations(userInfo);
        if (siteAuthorizations && siteAuthorizations.length > 0) {
            authorizations.push.apply(authorizations, siteAuthorizations);
        }
        // Add authorizations to user.authorizations
        if (authorizations.length > 0) {
            user.authorizations.push.apply(user.authorizations, authorizations);
        }
        errback(null, user, userInfo);
    });
};
