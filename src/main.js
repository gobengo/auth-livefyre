'use strict';

var auth = require('auth');
var plugin = require('./auth-plugin');

/*
livefyre-auth
*/
plugin(auth);
module.exports = exports = auth;

// Create a Livefyre.com auth delegate
exports.createDelegate = require('./livefyre-auth-delegate');

// Model of Livefyre UserProfile and resources from auth endpoints
exports.User = require('./user');

// fetch livefyre users from auth apis
exports.userService = require('./user-service');

// use the auth api
exports.api = require('./auth-api');

// plugin to another `auth`
exports.authPlugin = plugin;
