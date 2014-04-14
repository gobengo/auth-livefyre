var permissions = require('auth-livefyre/permissions');
var LivefyreUser = require('auth-livefyre/user');
var assert = require('chai').assert;

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

describe('auth-livefyre/permissions', function () {
    describe('.forCollection', function (){

        it('is a function', function () {
            assert.typeOf(permissions.forCollection, 'function');
        });

        it('gets permissions when passed token and collectionInfo', function (done) { 
            var collectionInfo = {
                network: 'labs.fyre.co',
                siteId: '315833',
                articleId: 'custom-1386874785082'
            };
            permissions.forCollection(labsToken, collectionInfo, function (err, perms) {
                assert.instanceOf(perms, Object);
                assert.ok(perms.isModAnywhere);
                assert.ok(perms.modScopes);
                assert.ok(perms.permissions);
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
