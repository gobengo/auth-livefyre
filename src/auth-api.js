var base64 = require('base64');
var CollectionAuthorization = require('./collection-authorization');
var filter = require('mout/array/filter');
var jsonp = require('./util/jsonp');
var map = require('mout/array/map');

/**
 * An Object that can talk to Livefyre's Auth API over HTTP
 */
var authApi = module.exports = {};

/**
 * Fetch user profile information from the Livefyre Auth API
 * @param {string} opts.token
 * @param {string=} opts.serverUrl
 * @param {string=} opts.bpChannel
 * @param {string=} opts.articleId
 * @param {string=} opts.siteId
 * @param {string=} opts.network
 * @param {function()=} callback
 */
authApi.authenticate = function (opts, errback) {
    // TODO: opts.articleId should not have to be b64-encoded
    var qsParts = [];
    var token = opts && opts.token;
    var serverUrl = opts && opts.serverUrl;
    var queryString;
    var url;

    if (token) {
        qsParts.push(qsParam('lftoken', opts.token));
    }

    if (opts.network) {
        serverUrl = serverUrlFromNetwork(opts.network);
    }

    if (! serverUrl) {
        serverUrl = token ? serverUrlFromToken(token) : 'http://livefyre.com';
    }

    if (opts.bpChannel) {
        qsParts.push(qsParam('bp_channel', opts.bpChannel));
    }
    if (opts.articleId && opts.siteId) {
        qsParts.push(
            qsParam('articleId', base64.btoa(opts.articleId)),
            qsParam('siteId', opts.siteId));
    }
    queryString = qsParts.join('&');

    url = [serverUrl, '/api/v3.0/auth/?', queryString].join('');

    // Use opts._request function if it is passed. This will make it
    // easy to mock
    this._request(url, function(err, resp) {
        if ( ! err) {
            err = jsonpError(resp);
        }
        var authData = resp && resp.data;
        errback(err, authData);
    });
};

/**
 * Make an HTTP Request to the provided url, then errback the response
 */
authApi._request = function (url, errback) {
    jsonp.req(url, errback);
};

// Since JSONP will always return 200, inspect the response
// to see if it was an error, and return an Error if so
// else return undefined
function jsonpError(resp) {
    var code = resp && resp.code;
    if (code === 200) {
        // no error
        return;
    }
    var err = new Error("Error requesting with JSONP");
    err.response = resp;
    err.code = code;
    return err;
}

/**
 * Update a user model given data from the Auth API
 * @param user {LivefyreUser} A User model
 * @param authData {object} The data object from the Auth API response
 * @param [userInfoCollection] {object} Describes the scope of the userInfo
 *     e.g. an object of collectionInfo.
 */
authApi.updateUser = function (user, userInfo, userInfoCollection) {
    var profile = userInfo.profile;
    var tokenDescriptor = userInfo.token;
    var token = tokenDescriptor && tokenDescriptor.value;
    var tokenExpiresAt = tokenDescriptor && new Date((+new Date()) + tokenDescriptor.ttl * 1000);
    var collectionId = userInfo['collection_id'];
    var collectionAuthorization;

    var attributes = extend({}, profile, {
        serverUrl: userInfo.serverUrl,
        token: token,
        tokenExpiresAt: tokenExpiresAt
    });

    user.set(attributes);

    // # Update Authorizations
    var newAuthorizations = [];
    // Collection Authorizations
    if (collectionId) {
        // Should I pass user as first param? or adapt it?
        collectionAuthorization = this.createCollectionAuthorization(userInfoCollection || {}, userInfo);
        if (collectionAuthorization) {
            newAuthorizations.push(collectionAuthorization);
        }
    }
    // Network Authorizations
    var networkAuthorizations = this.createNetworkAuthorizations(userInfo);
    if (networkAuthorizations.length > 0) {
        newAuthorizations.push.apply(newAuthorizations, networkAuthorizations);
    }

    var siteAuthorizations = this.createSiteAuthorizations(userInfo);
    if (siteAuthorizations.length > 0) {
        newAuthorizations.push.apply(newAuthorizations, siteAuthorizations);
    }

    // Add all authorizations to user
    // TODO: Don't push duplicates...
    // Filter newAuthorizations to only include those who aren't duplicates
    var uniqueAuthorizations = filter(newAuthorizations, function (authorization) {
        if (authorization.network) {
            return ! user.isMod({ network: authorization.network });
        }
        if (authorization.siteId) {
            return ! user.isMod({ siteId: authorization.siteId });
        }
        if (authorization.collection && authorization.collection.id) {
            return ! user.isMod({ collectionId: authorization.collection.id });
        }
        // If it's not one of these, don't add it
        return false;
    });
    // Add to authorizations
    if (uniqueAuthorizations.length > 0) {
        user.authorizations.push.apply(user.authorizations, uniqueAuthorizations);
    }
    return user;
};

/**
 * Create a CollectionAuthorization from
 * @param opts {object} opts passed to authApi.authenticate
 * @param userInfo {object} Response data from authApi
 */
authApi.createCollectionAuthorization = function (opts, userInfo) {
    var collection = {
        network: opts.network,
        id: userInfo.collection_id,
        siteId: opts.siteId,
        articleId: opts.articleId
    };
    var authorization = new CollectionAuthorization(collection);
    var permissions = userInfo.permissions;
    var authors = permissions && permissions.authors;
    if (authors && authors.length > 0) {
        authorization.authors.push.apply(authorization.authors, authors);
    }
    var moderatorKey = permissions && permissions.moderator_key;
    if (moderatorKey) {
        authorization.moderatorKey = moderatorKey;
    }
    return authorization;
};

/**
 * Create a set of network authorizations from
 * @param userInfo {object} Response data from authApi
 * @return Array of objects like {network: 'network', moderator: true}
 */
authApi.createNetworkAuthorizations = function (userInfo) {
    var modScopes = userInfo.modScopes;
    var networkModScopes = modScopes && modScopes.networks;
    if ( ! (networkModScopes && networkModScopes.length > 0)) {
        return [];
    }
    var networkAuthorizations = map(networkModScopes, function (network) {
        var authorization = {
            network: network,
            moderator: true
        };
        return authorization;
    });
    return networkAuthorizations;
};

/**
 * Create a set of site authorizations from
 * @param userInfo {object} Response data from authApi
 * @return Array of objects like {siteId: '125125', moderator: true}
 */
authApi.createSiteAuthorizations = function (userInfo) {
    var modScopes = userInfo.modScopes;
    var siteModScopes = modScopes && modScopes.sites;
    if ( ! (siteModScopes && siteModScopes.length > 0)) {
        return [];
    }
    var siteAuthorizations = map(siteModScopes, function (siteId) {
        var authorization = {
            siteId: siteId,
            moderator: true
        };
        return authorization;
    });
    return siteAuthorizations;
};

function extend(destination) {
    var sources = [].slice.call(arguments, 1);
    var source;
    for (var i=0, numSources=sources.length; i < numSources; i++) {
        source = sources[i];
        for (var key in source) {
            if ( ! source.hasOwnProperty(key)) {
                continue;
            }
            destination[key] = source[key];
        }
    }
    return destination;
}

function qsParam(key, value) {
    var qsPart = '{key}={value}'
        .replace('{key}', key)
        .replace('{value}', encodeURIComponent(value));
    return qsPart;
}

function networkFromToken (token) {
    var jwtParts = token.split('.');
    if (jwtParts.length !== 3) {
        throw new Error("The provided lftoken is not a JWT: "+token);
    }
    var tokenJSON = base64.atob(jwtParts[1]);
    var tokenData = JSON.parse(tokenJSON);
    var network = tokenData.domain;
    return network;
}

function serverUrlFromNetwork(network) {
    var serverUrl = document.location.protocol + '//admin.' + network;
    return serverUrl;
}

function serverUrlFromToken(token) {
    var network = networkFromToken(token);
    return serverUrlFromNetwork(network);
}
