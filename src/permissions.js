'use strict';

var authApi = require('./auth-api');

/**
 * Fetch permissions for a Livefyre Collection
 * @param token {string} lftoken of user you want permissions for
 * @param collection.network {string} Network of Collection
 * @param collection.siteId {string} Site ID of Collection
 * @param collection.articleId {string} Article ID of Collection
 * @throws Error if you didn't pass all required Collection info
 */
exports.forCollection = function (token, collection, errback) {
    validateCollection(collection);

    var opts = Object.create(collection);
    opts.token = token;

    authApi(opts, function (err, resp) {
        errback(err, resp);
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