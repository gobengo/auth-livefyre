/**
 * @fileoverview Simplified user object that looks like a Backbone model, but with only 'CHANGE'
 * and 'CLEAR' events.
 * Note that including this file will setup a global `window.livefyre.user`, but won't override
 * an existing object. Use at own risk.
 * This should be assumed to be a global singleton.
 */

var authApi = require('./auth-api');
var EventEmitter = require('event-emitter');
var inherits = require('inherits');
var permissions = require('./permissions');
var session = require('./session');

/**
 * @param {Object} initialAttr
 * @constructor
 */
function LivefyreUser(initialAttr) {
    this._attributes = {};
    this.authorizations = [];
    EventEmitter.call(this);
}
inherits(LivefyreUser, EventEmitter);

/** @enum {string} */
LivefyreUser.EVENTS = {
    CHANGE: 'change'
};

/**
 * @param {Object|string} keyOrObj
 * @param {*=} opt_value
 */
LivefyreUser.prototype.set = function(keyOrObj, opt_value) {
    var tempKey, k, val;
    // Assume object if not string
    if (typeof(keyOrObj) === 'string') {
        tempKey = keyOrObj;
        keyOrObj = {};
        keyOrObj[tempKey] = opt_value;
    }

    for (k in keyOrObj) {
        if (keyOrObj.hasOwnProperty(k)) {
            val = keyOrObj[k];
            this._attributes[k] = val;
            this.emit(LivefyreUser.EVENTS.CHANGE + ':' + k, val);
        }
    }
    this.emit(LivefyreUser.EVENTS.CHANGE, keyOrObj);
};

/**
 * Get a particular attribute
 * @param {string} key
 * @return {*}
 */
LivefyreUser.prototype.get = function(key) {
    if (!key) {
        return this._attributes;
    }
    return this._attributes[key];
};

/**
 * @param {string} key
 */
LivefyreUser.prototype.unset = function(key) {
    if (key in this._attributes) {
        delete this._attributes[key];
        var obj = {};
        obj[key] = void 0;
        this.emit(LivefyreUser.EVENTS.CHANGE + ':' + key, obj[key]);
    }
};

/**
 * Determines if this user is authenticated or not.
 * @return {boolean}
 */
LivefyreUser.prototype.isAuthenticated = function() {
    return !!this.get('id');
};

/**
 * Check if user is known to be a moderator of provided Collection info
 * @param scope {object} An object which describes the scope you're curious
 *     about isMod. Pass .network, .siteId, .articleID for Collection
 *     or just .collectionId
 * @return {boolean}
 */
function isModByCollectionInfo(scopeObj) {
    var isMod = this.authorizations.some(function (authorization) {
        var collection = authorization.collection;
        return Boolean(collection &&
            authorization.moderatorKey &&
            collection.network === scopeObj.network &&
            collection.siteId === scopeObj.siteId &&
            collection.articleId === scopeObj.articleId);
    });
    return isMod;
}

/**
 * Check if user is known to be a moderator of a given Collection ID
 * @param collectionId {string} A Collection ID
 * @return {boolean}
 */
function isModByCollectionId(collectionId) {
    var authorization = getAuthorizationByCollectionId.call(this, collectionId);
    return Boolean(authorization && authorization.moderatorKey);
}

/**
 * @param collectionId {string} A Collection ID
 * @return {CollectionAuthorization}
 */
function getAuthorizationByCollectionId(collectionId) {
    var authorization;
    var collection;
    for (var i = 0; i < this.authorizations.length; i++) {
        authorization = this.authorizations[i];
        collection = authorization.collection;
        if (collection &&
            collection.id === collectionId) {
            return authorization;
        }
    }
    return null;
}

/**
 * Check if user is known to be a moderator of a given Network
 * @param networkId {string} A Network name
 * @return {boolean}
 */
function isModByNetwork(networkId) {
    var isMod = this.authorizations.some(function (authorization) {
        var authNetwork = authorization.network;
        return authNetwork && authNetwork === networkId && authorization.moderator;
    });
    return isMod;
}

/**
 * Check if user is known to be a moderator of a given Site ID
 * @param siteId {string} A Site ID
 * @return {boolean}
 */
function isModBySiteId(siteId) {
    var isMod = this.authorizations.some(function (authorization) {
        var authSiteId = authorization.siteId;
        return authSiteId && authSiteId === siteId && authorization.moderator;
    });
    return isMod;
}

/**
 * @param scope {object} An object which describes the scope you're curious
 *     about isMod. Pass .network, .siteId, .articleID for Collection
 *     or just .collectionId
 * @return {boolean}
 */
LivefyreUser.prototype.isMod = function(scopeObj) {
    if (scopeObj.collectionId) {
        return isModByCollectionId.call(this, scopeObj.collectionId);
    }
    if (scopeObj.articleId) {
        return isModByCollectionInfo.call(this, scopeObj);
    }
    if (scopeObj.network) {
        return isModByNetwork.call(this, scopeObj.network);
    }
    if (scopeObj.siteId) {
        return isModBySiteId.call(this, scopeObj.siteId);
    }
    return;
};

/**
 * Get the erefs keys for this user and for the specified collection.
 * @param collection {Collection}
 * @param errback {function(?Error, Array)}
 */
LivefyreUser.prototype.getKeys = function (collection, errback) {
    var authorization = getAuthorizationByCollectionId.call(this, collection.id);
    var user = this;

    function collKeyset(authorization) {
        var authorKeys = authorization.authors.map(function(authorObj) {
            return authorObj.key;
        });
        if (authorization.moderatorKey) {
            // TODO(jj): ie8 compat for 'map' and 'some'
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

        authorization = getAuthorizationByCollectionId.call(user, collection.id);
        errback(null, collKeyset(authorization));
    });
};

/**
 * Set up singleton user object.
 */
module.exports = LivefyreUser;
