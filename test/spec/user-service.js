var userService = require('auth-livefyre/user-service');
var assert = require('chai').assert;
var authApi = require('auth-livefyre/auth-api');
var LivefyreUser = require('auth-livefyre/user');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var modResponse = require('json!auth-livefyre-tests/fixtures/livefyre-admin-auth.json');
var modCollectionResponse = require('json!auth-livefyre-tests/fixtures/livefyre-admin-collection-auth.json');

// Make a mock api that always returns the same response
function createMockAuthApi (response) {
    var mockAuthApi = Object.create(authApi);
    mockAuthApi._request = function (url, errback) {
        errback(null, response);
    };
    return mockAuthApi;
}

describe('auth-livefyre/user-service', function () {
    it('is an object', function () {
        assert.typeOf(userService, 'object');
    });

    describe('.fetch', function () {
        it('fetches a LivefyreUser instance', function (done) {
            // Patch userService._authApi to return a response
            // as if we only passed a token, no collection info
            var modUserService = Object.create(userService);
            modUserService._authApi = createMockAuthApi(modResponse);

            var opts = {
                token: labsToken
            };
            modUserService.fetch(opts, function (err, user) {
                assert.instanceOf(user, LivefyreUser);
                assert.equal(
                    user.get('displayName'),
                    modCollectionResponse.data.profile.displayName);
                // There will only be a NetworkAuthorization
                // because no collection
                assert.equal(user.authorizations.length, 1);
                // assert.ok(user.isMod({
                //     network: 'livefyre.com'
                // }));
                done(err);
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

                done(err);
            });
        });
    });
});
