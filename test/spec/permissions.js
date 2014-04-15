var permissions = require('auth-livefyre/permissions');
var assert = require('chai').assert;
var authApi = require('auth-livefyre/auth-api');
var CollectionAuthorization = require('auth-livefyre/collection-authorization');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var mockAuthResponse = require('json!auth-livefyre-tests/fixtures/livefyre-admin-auth.json');
var mockAuthApi = createMockAuthApi(mockAuthResponse);

// permissions shouldn't actually make API requests
permissions = Object.create(permissions);
permissions._authApi = mockAuthApi;

describe('auth-livefyre/permissions', function () {
    describe('.forCollection', function (){

        it('is a function', function () {
            assert.typeOf(permissions.forCollection, 'function');
        });

        it('gets a CollectionAuthorization when passed token and collectionInfo', function (done) {
            var collectionInfo = {
                network: 'labs.fyre.co',
                siteId: '315833',
                articleId: 'custom-1386874785082'
            };
            permissions.forCollection(labsToken, collectionInfo, function (err, perms) {
                assert.instanceOf(perms, CollectionAuthorization);
                
                // assert.ok(perms.isModAnywhere);
                // assert.ok(perms.modScopes);
                // assert.ok(perms.permissions);
                done(err);
            });
        });

        it('throws if invalid collection info is passed', function () {
            function doWithInvalidCollection () {
                var collection = {
                    siteId: '111'
                };
                permissions.forCollection(labsToken, collection, function () {
                    // Should get here because collection is invalid
                });
            }
            assert.throws(doWithInvalidCollection);
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