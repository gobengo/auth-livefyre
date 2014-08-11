var assert = require('chai').assert;

var authApi = require('livefyre-auth/auth-api');
var LivefyreUser = require('livefyre-auth/user');
var sinon = require('sinon');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var modResponse = require('json!livefyre-auth-tests/fixtures/livefyre-admin-auth.json');
var modCollectionResponse = require('json!livefyre-auth-tests/fixtures/livefyre-admin-collection-auth.json');
var bobResponse1 = require('json!livefyre-auth-tests/fixtures/auth-bob-collection-1.json');
var bobResponse2 = require('json!livefyre-auth-tests/fixtures/auth-bob-collection-2.json');


// Make a mock api that always returns the same response
function createMockAuthApi (response) {
    var mockAuthApi = Object.create(authApi);
    mockAuthApi._request = function (url, errback) {
        errback(null, response);
    };
    return mockAuthApi;
}

describe('livefyre-auth/auth-api', function () {
    it('is an object', function () {
        assert.typeOf(authApi, 'object');
    });

    describe('.authenticate', function () {
        it('requests the auth api with opts, then errbacks', function (done) {
            // Patch authApi._authApi to return a response
            // as if we only passed a token, no collection info
            var modAuthApi = createMockAuthApi(modResponse);
            var opts = {
                token: labsToken
            };
            modAuthApi.authenticate(opts, function (err, userInfo) {
                assert.instanceOf(userInfo, Object);
                assert.equal(
                    userInfo.profile.displayName,
                    modCollectionResponse.data.profile.displayName);
                done(err);
            });
        });

        it('uses a network if provided', function (done) {
            // Patch authApi._authApi to return a response
            // as if we only passed a token, no collection info
            var modAuthApi = createMockAuthApi(modResponse);
            var reqSpy = sinon.spy(modAuthApi, '_request');
            var opts = {
                token: labsToken,
                network: 'yo network'
            };
            modAuthApi.authenticate(opts, function (err, userInfo) {
                assert(reqSpy.calledWith("http://admin.yo network/api/v3.0/auth/?lftoken=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY"));
                done(err);
            });
        });

        it('uses a serverUrl if provided', function (done) {
            // Patch authApi._authApi to return a response
            // as if we only passed a token, no collection info
            var modAuthApi = createMockAuthApi(modResponse);
            var reqSpy = sinon.spy(modAuthApi, '_request');
            var opts = {
                token: labsToken,
                serverUrl: 'yo serverUrl'
            };
            modAuthApi.authenticate(opts, function (err, userInfo) {
                assert(reqSpy.calledWith("yo serverUrl/api/v3.0/auth/?lftoken=eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY"));
                done(err);
            });
        });
    });

    /**
     * auth-api can update a LivefyreUser instance.This keeps the logic
     * in the same module as the fetches the auth response
     * @param user {./user} A LivefyreUser to mutate with properties in
     * @param authData {object} The response object from .authenticate
     */
    describe('.updateUser(user, authData)', function (done) {
        var bobData1 = bobResponse1.data;
        var bobData2 = bobResponse2.data;

        // We'll be updating quite a few ways, so will make a new User
        // frequently to make sure they're isolated
        function createUser(opts) {
            return new LivefyreUser(opts);
        }

        it('can update fresh users', function () {
            var user1 = createUser();
            authApi.updateUser(user1, bobData1);
            assert.equal(user1.get('displayName'), 'bob');

            var user2 = createUser();
            authApi.updateUser(user2, bobData2);
            assert.equal(user2.get('displayName'), 'bob');

            // It should have added authors on a CollectionAuthorization
            assert.ok(user2.authorizations.some(function (authorization) {
                var authors = (authorization.authors || []);
                var hasAuthors = (authors.length === 1);
                return hasAuthors && authorization.collection;
            }));
        });

        it('can save serverUrl data', function () {
            var modifiedData = Object.create(bobData1);
            modifiedData.serverUrl = 'server this';
            var user = createUser();
            authApi.updateUser(user, modifiedData);
            assert.equal(user.get('serverUrl'), modifiedData.serverUrl);
        });

        it('can update existing user to add authorizations', function () {
            var user = createUser();
            authApi.updateUser(user, bobData1);
            authApi.updateUser(user, bobData2);
            assert.equal(user.get('displayName'), 'bob');
            assert.equal(user.authorizations.length, 6);
            // collection
            assert.ok(user.isMod({
                collectionId: bobData1.collection_id
            }));
            assert.ok(user.isMod({
                collectionId: bobData2.collection_id
            }));
            // network
            assert.ok(user.isMod({
                network: bobData1.modScopes.networks[0]
            }));
            assert.ok(user.isMod({
                network: bobData2.modScopes.networks[0]
            }));
            // site
            assert.ok(user.isMod({
                siteId: bobData1.modScopes.sites[0]
            }));
            assert.ok(user.isMod({
                siteId: bobData2.modScopes.sites[0]
            }));

            // It should have added 2 authors on a CollectionAuthorizations
            var authors = user.authorizations.map(function (authorization) {
                return authorization.authors;
            }).filter(function (author) {
                return author;
            });
            assert.equal(authors.length, 2);
        });
    });
});
