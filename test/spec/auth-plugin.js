var authModule = require('auth');
var livefyreAuthPlugin = require('livefyre-auth/auth-plugin');
var LivefyreUser = require('livefyre-auth/user');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('livefyre-auth/auth-plugin', function () {
    var auth;
    beforeEach(function () {
        auth = authModule.create();
        livefyreAuthPlugin(auth, null, {
            // Stubbin
            userService: {
                fetch: function () {
                    auth.login({ livefyre: new LivefyreUser() })
                }
            }
        });
    });
    it('exports a function', function () {
        assert.typeOf(livefyreAuthPlugin, 'function');
    });
    it('can be passed an auth instance', function () {
        assert.doesNotThrow(function () {
            livefyreAuthPlugin(auth);
        });
    });
    it('logs the user into livefyre once authenticated (w/ user obj)', function (done) {
        auth.on('login.livefyre', function (user) {
            assert(user);
            assert.equal(auth.get('livefyre'), user);
            done();
        });
        auth.authenticate({
            livefyre: new LivefyreUser()
        });
    });
    it('logs the user into livefyre once authenticated (w/ token)', function (done) {
        var token = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';
        auth.on('login.livefyre', function (user) {
            assert(user);
            assert.equal(auth.get('livefyre'), user);
            done();
        });
        auth.authenticate({
            livefyre: token
        });
    });
});
