var assert = require('chai').assert;
var CollectionAuthorization = require('livefyre-auth/collection-authorization');
var LivefyreUser = require('livefyre-auth/user');
var permissions = require('livefyre-auth/permissions');
var sinon = require('sinon');

describe('livefyre-auth/user', function () {
    var authorization;
    var collection;
    var permissionsSpy;
    var user;
    beforeEach(function () {
        authorization = new CollectionAuthorization();
        collection = authorization.collection = {
            id: 'batman',
            siteId: 'bruce',
            articleId: 'wayne',
            network: 'bats'
        }
        authorization.moderatorKey = 'batarang';
        authorization.authors = [{
            key: 'batmobile'
        }];
        user = new LivefyreUser();
        user.token = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';
        user.authorizations.push(authorization);
        permissionsSpy = sinon.spy(permissions, 'forCollection');
    });
    afterEach(function () {
        permissionsSpy.restore();
    });
    it('exports a function', function () {
        assert.typeOf(LivefyreUser, 'function');
    });

    describe('.getKeys', function () {
        it('returns keys if the user can mod the collection', function (done) {
            user.getKeys(collection, function(err, keys) {
                assert.equal(keys.length, 2);
                assert(keys.indexOf('batarang') > -1);
                assert(keys.indexOf('batmobile') > -1);
                assert(!permissionsSpy.called);
                done();
            });
        });
        it('returns an array with the author key if the user cannot mod the collection', function (done) {
            user.authorizations[0].moderatorKey = null;
            user.getKeys(collection, function(err, keys) {
                assert.equal(keys.length, 1);
                assert(keys.indexOf('batmobile') > -1);
                assert(!permissionsSpy.called);
                done();
            });
        });
        it('fetches permissions if there is no authorization for the collection (and fails)', function (done) {
            user.authorizations = [];
            user.getKeys(collection, function(err, keys) {
                assert.instanceOf(err, Error);
                assert(permissionsSpy.called);
                var args = permissionsSpy.args[0];
                assert.equal(args[0], user.token);
                assert.deepEqual(args[1], collection);
                done();
            });
        });
        // TODO(jj): mock data for succeeding test
    });
});
