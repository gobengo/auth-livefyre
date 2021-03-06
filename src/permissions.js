'use strict';

var authApi = require('./auth-api');
var session = require('./session');

var permissions = module.exports = {};


/**
 * Fetch a user's permissions for a Livefyre Collection
 * @param token {string} usertoken
 * @param collection.network {string} Network of Collection
 * @param collection.siteId {string} Site ID of Collection
 * @param collection.articleId {string} Article ID of Collection
 * @throws Error if you didn't pass all required Collection info
 */
permissions.forCollection = function (token, collection, errback) {
    validateCollection(collection);
    var opts = Object.create(collection);
    opts.token = token;

    authApi.authenticate(opts, function (err, userInfo) {
        if (err) {
            return errback(err);
        }
        // bad, duplicated from user-service
        if ( ! userInfo.profile) {
            err = new Error('fetch-user got empty auth response');
            return errback(err);
        }

        errback(null, userInfo);
    });
};

/**
 * Get the eref keys for a user and for the specified collection.
 * @param collection {Collection}
 * @param errback {function(?Error, Array)}
 */
permissions.getKeys = function (user, collection, errback) {
    var authorization = user.getAuthorizationByCollectionId(collection.id);

    function collKeyset(authorization) {
        var authorKeys = authorization.authors.map(function(authorObj) {
            return authorObj.key;
        });
        if (authorization.moderatorKey) {
            return authorKeys.concat([authorization.moderatorKey]);
        }
        return authorKeys;
    }

    if (authorization) {
        return errback(null, collKeyset(authorization));
    }

    // user has not yet fetched permissions for this collection, get them now!11
    permissions.forCollection(user.token, collection, function (err, userInfo) {
        if (err) {
            return errback(err);
        }

        // update the user for the future
        authApi.updateUser(user, userInfo);

        // save the session for the far future
        session.save(userInfo, user);

        authorization = user.getAuthorizationByCollectionId(collection.id);
        errback(null, collKeyset(authorization));
    });
};

function validateCollection(collection) {
    var collectionOpts = ['siteId', 'articleId', 'network'];
    for (var i=0, numOpts=collectionOpts.length; i<numOpts; i++) {
        var optName = collectionOpts[i];
        if ( ! collection[optName]) {
            throw collectionOptError(optName, collection);
        }
    }
}

function collectionOptError(optName, collection) {
    var err = new Error("Missing Collection option "+optName);
    err.collection = collection;
    err.missingOption = optName;
    return err;
}
