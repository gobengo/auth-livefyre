var userService = require('livefyre-auth/user-service');
var assert = require('chai').assert;
var authApi = require('livefyre-auth/auth-api');
var LivefyreUser = require('livefyre-auth/user');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var bobResponse1 = require('json!livefyre-auth-tests/fixtures/auth-bob-collection-1.json');
var modResponse = require('json!livefyre-auth-tests/fixtures/livefyre-admin-auth.json');
var modCollectionResponse = require('json!livefyre-auth-tests/fixtures/livefyre-admin-collection-auth.json');

// Make a mock api that always returns the same response
function createMockAuthApi (response) {
    var mockAuthApi = Object.create(authApi);
    mockAuthApi._request = function (url, errback) {
        errback(null, response);
    };
    return mockAuthApi;
}

describe('livefyre-auth/user-service', function () {
    it('is an object', function () {
        assert.typeOf(userService, 'object');
    });

    describe('.fetch', function () {
        it('fetches a LivefyreUser instance', function (done) {
            // Patch userService._authApi to return a response
            // as if we only passed a token, no collection info
            var bobUserService = Object.create(userService);
            bobUserService._authApi = createMockAuthApi(bobResponse1);

            var opts = {
                token: labsToken,
                serverUrl: 'serve this'
            };
            bobUserService.fetch(opts, function (err, user) {
                assert.instanceOf(user, LivefyreUser);
                assert.equal(
                    user.get('displayName'),
                    bobResponse1.data.profile.displayName);
                // 1 network, 1 site, 1 collection
                assert.equal(user.authorizations.length, 3);
                assert.ok(user.isMod({
                    network: '1n'
                }));
                assert.ok(user.isMod({
                    siteId: '1s'
                }));
                assert.ok(user.isMod({
                    collectionId: '1'
                }));
                assert.equal(user.get('serverUrl'), opts.serverUrl);
                done(err);
            });
        });
        it('survives if authApi returns empty 200 response', function (done) {
            // Patch userService._authApi to return an empty response
            var emptyUserService = Object.create(userService);
            emptyUserService._authApi = createMockAuthApi({
                code: 200,
                data: {}
            });

            var opts = {
                token: labsToken
            };
            emptyUserService.fetch(opts, function (err, user) {
                assert.notOk(user);
                assert.ok(err);
                done();
            });
        });
        it('fetches Collection authorization too if info is passed', function (done) {
            // Patch userService._authApi to return a response
            // as if we only passed a token, no collection info
            var modCollectionUserService = Object.create(userService);
            modCollectionUserService._authApi = createMockAuthApi(modCollectionResponse);

            var opts = {
                token: labsToken,
                network: 'livefyre.com',
                siteId: 'SITEID',
                articleId: 'ARTICLEID'
            };
            modCollectionUserService.fetch(opts, function (err, user) {
                assert.instanceOf(user, LivefyreUser);
                assert.equal(
                    user.get('displayName'),
                    modCollectionResponse.data.profile.displayName);
                // Since collection info was passed, there will be a
                // CollectionAuthorization in user.authorizations
                var thisCollectionAuthorizations = user.authorizations.filter(function (authorization) {
                    var collection = authorization.collection;
                    return collection && collection.articleId === opts.articleId;
                });
                assert.equal(thisCollectionAuthorizations.length, 1);
                var collectionAuthorization = thisCollectionAuthorizations[0];

                // A Collection Authorization has .collection info
                assert.equal(
                    collectionAuthorization.collection.id,
                    modCollectionResponse.data.collection_id);
                assert.equal(
                    collectionAuthorization.collection.articleId,
                    opts.articleId);

                // The Authors you represent in the Collection are saved
                // as .authors[]
                var authors = collectionAuthorization.authors;
                assert.instanceOf(authors, Array);
                assert.equal(authors.length, 1);
                // The author for my authenticating token was saved
                var lfAuthor = authors[0];
                assert.equal(lfAuthor.id, modCollectionResponse.data.permissions.authors[0].id);

                // If you are a moderator of the Collection, your key is saved
                // as authorization.moderatorKey
                assert.equal(collectionAuthorization.moderatorKey, modCollectionResponse.data.permissions.moderator_key);

                // Now the user can answer that he is a mod of this colleciton info
                assert.ok(user.isMod({
                    network: opts.network,
                    siteId: opts.siteId,
                    articleId: opts.articleId
                }));

                // Or this collection id
                assert.ok(user.isMod({
                    collectionId: modCollectionResponse.data.collection_id
                }));

                // Or, because the auth response included modScopes
                // by Network (two of them)
                assert.ok(user.isMod({
                    network: modCollectionResponse.data.modScopes.networks[0]
                }));
                assert.ok(user.isMod({
                    network: modCollectionResponse.data.modScopes.networks[1]
                }));
                // but you're not a mod of a network not in the response
                assert.notOk(user.isMod({
                    network: 'fake'
                }));

                // Or, because the auth response included modScopes
                // by Site
                assert.ok(user.isMod({
                    siteId: modCollectionResponse.data.modScopes.sites[0]
                }));
                assert.notOk(user.isMod({
                    siteId: 'not real site'
                }));

                done(err);
            });
        });
    });
});
