var authModule = require('auth');
var LivefyreUser = require('livefyre-auth/user');
var assert = require('chai').assert;

describe('livefyre-auth/user', function () {
    var auth;
    beforeEach(function () {
        auth = authModule.create();
    });
    it('exports a function', function () {
        assert.typeOf(LivefyreUser, 'function');
    });
});
