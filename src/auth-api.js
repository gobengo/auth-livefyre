var base64 = require('base64');
var jsonp = require('./util/jsonp');

/**
 * Fetch user profile information from the Livefyre Auth API
 * @param {string} opts.token
 * @param {string=} opts.serverUrl
 * @param {string=} opts.bpChannel
 * @param {string=} opts.articleId
 * @param {string=} opts.siteId
 * @param {function()=} callback
 */
var authApi = module.exports = function (opts, callback) {
    // TODO: opts.articleId should not have to be b64-encoded
    var qsParts = [];
    var token = opts && opts.token;
    var serverUrl = opts && opts.serverUrl;
    var queryString;
    var url;

    if (token) {
        qsParts.push(qsParam('lftoken', opts.token));
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

    jsonp.req(url, function(err, resp) {
        if ( ! err) {
            err = jsonpError(resp);            
        }
        var authData = resp && resp.data;
        callback(err, authData);
    });
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
 */
authApi.updateUser = function (user, authData) {
    var previous = {
        keys: user.get('keys'),
        modMap: user.get('modMap')
    };
    var profile = authData.profile;
    var permissions = authData.permissions;
    var authors = permissions && permissions.authors || [];
    var collectionModKey = permissions && permissions['moderator_key'];
    var collectionKeys = collectionModKey ? [collectionModKey] : [];
    var modMap = authData['mod_map'] || previous.modMap;
    var tokenDescriptor = authData.token;
    var token = tokenDescriptor && tokenDescriptor.value;
    var tokenExpiresAt = tokenDescriptor && new Date((+new Date()) + tokenDescriptor.ttl * 1000);
    var collectionId = authData['collection_id'];

    // A user has potentially many keys used to decrypt non-public content
    var authorKeys = [];
    for (var i = 0; i < authors.length; i++) {
        authorKeys.push(authors[i]['key']);
    }
    var latestKeys = authorKeys
        .concat(collectionKeys)
        .concat(previous.keys);
    
    var attributes = extend({}, profile, {
        keys: latestKeys,
        token: token,
        tokenExpiresAt: tokenExpiresAt
    });

    // If this authentication was for a particular collection,
    // store the new collection modKey in the modMap
    if (collectionModKey && collectionId) {
        modMap[collectionId] = collectionModKey;
        attributes.modMap = modMap;
    }

    user.set(attributes);
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
    var tokenJSON = base64.atob(token.split('.')[1]);
    var tokenData = JSON.parse(tokenJSON);
    var network = tokenData.domain;
    return network;
}

function serverUrlFromToken(token) {
    var network = networkFromToken(token);
    var serverUrl = document.location.protocol + '//admin.' + network;
    return serverUrl;
}