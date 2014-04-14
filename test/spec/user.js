var authModule = require('auth');
var LivefyreUser = require('auth-livefyre/user');
var assert = require('chai').assert;

describe('auth-livefyre/user', function () {
    var auth;
    beforeEach(function () {
        auth = authModule.create();
    })
    it('exports a function', function () {
        assert.typeOf(LivefyreUser, 'function');
    });
});
