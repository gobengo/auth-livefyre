var authModule = require('auth');
var LivefyreUser = require('auth/livefyre-user');
var assert = require('chai').assert;

describe('auth/livefyre-user', function () {
    var auth;
    beforeEach(function () {
        auth = authModule.create();
    })
    it('exports a function', function () {
        assert.typeOf(LivefyreUser, 'function');
    });
    it('can be constructed with an auth instance', function () {
        assert.doesNotThrow(function () {
            LivefyreUser(auth);
        });
    });
    it('can be constructed with an auth instance that has already been authenticated', function () {
        var token = '12345';
        auth.authenticate({
            livefyre: token
        });
        var user = new LivefyreUser(auth);
        assert.equal(user.token, token);
        // assert login even is fired by user
    });
});
