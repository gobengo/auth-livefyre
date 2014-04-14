var fetchUser = require('auth-livefyre/fetch-user');
var assert = require('chai').assert;
var authApi = require('auth-livefyre/auth-api');
var LivefyreUser = require('auth-livefyre/user');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var mockAuthResponse = require('json!auth-livefyre-tests/fixtures/livefyre-admin-auth.json');
var mockAuthApi = createMockAuthApi(mockAuthResponse);

// // permissions shouldn't actually make API requests
// permissions = Object.create(permissions);
// permissions._authApi = mockAuthApi;

describe('auth-livefyre/fetch-user', function () {
    it('is a function', function () {
        assert.typeOf(fetchUser, 'function');
    });

    it('fetches a LivefyreUser instance', function (done) {
        var opts = {
            token: labsToken
        };
        fetchUser(opts, function (err, user) {
            assert.instanceOf(user, LivefyreUser);
            // assert.ok(perms.isModAnywhere);
            // assert.ok(perms.modScopes);
            // assert.ok(perms.permissions);
            done(err);
        });
    });
});

// Make a mock api that always returns the same response
function createMockAuthApi (response) {
    var mockAuthApi = Object.create(authApi);
    mockAuthApi._request = function (url, errback) {
        errback(null, response);
    };
    return mockAuthApi;
}