/**
 * @fileoverview Simplified user object that looks like a Backbone model, but with only 'CHANGE'
 * and 'CLEAR' events.
 * Note that including this file will setup a global `window.livefyre.user`, but won't override
 * an existing object. Use at own risk.
 * This should be assumed to be a global singleton.
 */

var EventEmitter = require('event-emitter');
var inherits = require('inherits');

/**
 * @param {Object} initialAttr
 * @constructor
 */
function LivefyreUser(initialAttr) {
    this._attributes = LivefyreUser.getDefaults();
    EventEmitter.call(this);
}
inherits(LivefyreUser, EventEmitter);

/** @return {Object.<string, *>} */
LivefyreUser.getDefaults = function() {
    return {
        'modMap': {},
        'keys': []
    };
};

/** @enum {string} */
LivefyreUser.EVENTS = {
    CHANGE: 'change',
    LOGOUT: 'logout',
    LOGIN: 'login',
    LOGIN_REQUESTED: 'loginRequested'
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
 * @param {string} collectionId
 * @return {boolean}
 */
LivefyreUser.prototype.isMod = function(articleId) {
    return articleId in this.get('modMap');
};

/**
 * Set up singleton user object.
 */
module.exports = LivefyreUser;
