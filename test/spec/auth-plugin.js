var authModule = require('auth');
var livefyreAuthPlugin = require('auth-livefyre/auth-plugin');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth-livefyre/user', function () {
    var auth;
    beforeEach(function () {
        auth = authModule.create();
        livefyreAuthPlugin(auth);
    });
    it('exports a function', function () {
        assert.typeOf(livefyreAuthPlugin, 'function');
    });
    it('can be passed an auth instance', function () {
        assert.doesNotThrow(function () {
            livefyreAuthPlugin(auth);
        });
    });
    it('logs the user into livefyre once authenticated', function (done) {
        var token = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';
        auth.on('login.livefyre', function (user) {
            var userToken = user.get('token');
            assert(user);
            assert.equal(auth.get('livefyre'), user);
            done();
        });
        auth.authenticate({
            livefyre: token
        });
    });
});