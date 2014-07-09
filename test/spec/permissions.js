var assert = require('chai').assert;
var authApi = require('livefyre-auth/auth-api');
var CollectionAuthorization = require('livefyre-auth/collection-authorization');
var LivefyreUser = require('livefyre-auth/user');
var permissions = require('livefyre-auth/permissions');
var sinon = require('sinon');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';
var mockAuthResp = '{"status": "ok", "code": 200, "data": {"profile": {"profileUrl": "admin.fy.re/profile/696/", "settingsUrl": "admin.fy.re/profile/edit/info", "displayName": "systemowner", "avatar": "http://gravatar.com/avatar/f79fae57457a4204aeb07e92f81019bd/?s=50&d=http://d25bq1kaa0xeba.cloudfront.net/a/anon/50.jpg", "id": "_u696@livefyre.com"}, "auth_token": {"value": "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGl2ZWZ5cmUuY29tIiwgImV4cGlyZXMiOiAxNDA1MTk1MzI3LjEwMDQ5MywgInVzZXJfaWQiOiAiX3U2OTYifQ.WpFBhePpRgJ9pV5kTHkHgXgE5juX7roUWLdnHZkcQao", "ttl": 2591990}, "isModAnywhere": true, "token": {"value": "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGl2ZWZ5cmUuY29tIiwgImV4cGlyZXMiOiAxNDA1MTk1MzM2LjQwNDMyLCAidXNlcl9pZCI6ICJfdTY5NiJ9.UlChx5HWLuQwsX1_C0nAX9gVNXi5f_TW3iUFGEKPFBs", "ttl": 2592000}, "collection_id": "2485920", "modScopes": {"collections": [], "networks": ["livefyre.com", "a.livefyre.com", "test.fyre.co"], "sites": ["286470", "286471", "286472"]}, "permissions": {"moderator_key": "41ad5d0596048b4b88d6fce1f713eabc0862c8bd", "authors": [{"id": "_u696@livefyre.com", "key": "cbeee2ca676b7e9641f2c177d880e3ca3ecc295a"}]}}}';

describe('livefyre-auth/permissions', function () {
    describe('.forCollection', function (){

        it('is a function', function () {
            assert.typeOf(permissions.forCollection, 'function');
        });

        it('fetches from the auth api when passed a token and collectionInfo (and fails)', function (done) {
            var collectionInfo = {
                network: 'labs.fyre.co',
                siteId: '315833',
                articleId: 'custom-1386874785082'
            };
            var stub = sinon.stub(authApi, 'authenticate', function(opts, cb) {
                cb(new Error());
            });
            var user = new LivefyreUser();
            user.set('serverUrl', 'serve this');
            user.set('token', labsToken);
            permissions.forCollection(user, collectionInfo, function (err, userInfo) {
                assert.instanceOf(err, Error);

                assert(stub.called);
                var opts = stub.args[0][0];
                assert.equal(opts.token, labsToken);
                assert.equal(opts.siteId, collectionInfo.siteId);
                assert.equal(opts.articleId, collectionInfo.articleId);
                assert.equal(opts.serverUrl, 'serve this');

                stub.restore();
                done();
            });
        });

        it('fetches from the auth api when passed a token and collectionInfo (and succeeds)', function (done) {
            var collectionInfo = {
                network: 'labs.fyre.co',
                siteId: '315833',
                articleId: 'custom-1386874785082'
            };
            var stub = sinon.stub(authApi, 'authenticate', function (opts, errback) {
                errback(null, JSON.parse(mockAuthResp).data);
            });
            permissions.forCollection(new LivefyreUser(), collectionInfo, function (err, userInfo) {
                assert.equal(userInfo.auth_token.value, JSON.parse(mockAuthResp).data.auth_token.value);
                stub.restore();
                done();
            });
        });

        it('throws if invalid collection info is passed', function () {
            function doWithInvalidCollection () {
                var collection = {
                    siteId: '111'
                };
                permissions.forCollection(new LivefyreUser(), collection, function () {
                    // Shouldn't get here because collection is invalid
                });
            }
            assert.throws(doWithInvalidCollection);
        });
    });

    describe('.getKeys', function () {
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
            user.set('token', 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY');
            user.authorizations.push(authorization);
            permissionsSpy = sinon.spy(permissions, 'forCollection');
        });
        afterEach(function () {
            permissionsSpy.restore();
        });

        it('returns keys if the user can mod the collection', function (done) {
            permissions.getKeys(user, collection, function(err, keys) {
                assert.equal(keys.length, 2);
                assert(keys.indexOf('batarang') > -1);
                assert(keys.indexOf('batmobile') > -1);
                assert(!permissionsSpy.called);
                done();
            });
        });
        it('returns an array with the author key if the user cannot mod the collection', function (done) {
            user.authorizations[0].moderatorKey = null;
            permissions.getKeys(user, collection, function(err, keys) {
                assert.equal(keys.length, 1);
                assert(keys.indexOf('batmobile') > -1);
                assert(!permissionsSpy.called);
                done();
            });
        });
        it('fetches permissions if there is no authorization for the collection (and fails)', function (done) {
            user.authorizations = [];
            permissionsSpy.restore();
            var permissionStub = sinon.stub(permissions, 'forCollection', function(user, collection, errback) {
                errback(new Error());
            });
            permissions.getKeys(user, collection, function(err, keys) {
                assert.instanceOf(err, Error);
                assert(permissionStub.called);
                var args = permissionStub.args[0];
                assert.equal(args[0], user);
                assert.equal(args[1], collection);
                permissionStub.restore();
                done();
            });
        });
        it('fetches permissions if there is no authorization for the collection (and succeeds)', function (done) {
            permissionsSpy.restore();
            var permissionStub = sinon.stub(permissions, 'forCollection', function(user, collection, errback) {
                errback(null, JSON.parse(mockAuthResp).data);
            });
            user.authorizations = [];
            collection.id = '2485920';
            permissions.getKeys(user, collection, function(err, keys) {
                assert.equal(keys.length, 2);
                assert(keys.indexOf('41ad5d0596048b4b88d6fce1f713eabc0862c8bd') > -1);
                assert(keys.indexOf('cbeee2ca676b7e9641f2c177d880e3ca3ecc295a') > -1);

                permissionStub.restore();
                done();
            });
        });
    });
});
