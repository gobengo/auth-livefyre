var permissions = require('livefyre-auth/permissions');
var assert = require('chai').assert;
var authApi = require('livefyre-auth/auth-api');
var sinon = require('sinon');

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

describe('livefyre-auth/permissions', function () {
    describe('.forCollection', function (){

        it('is a function', function () {
            assert.typeOf(permissions.forCollection, 'function');
        });

        it('fetches from the auth api when passed a token and collectionInfo', function (done) {
            var collectionInfo = {
                network: 'labs.fyre.co',
                siteId: '315833',
                articleId: 'custom-1386874785082'
            };
            var spy = sinon.spy(authApi, 'authenticate');
            permissions.forCollection(labsToken, collectionInfo, function (err, userInfo) {
                // no mock request, so no dataz
                assert.instanceOf(err, Error);

                assert(spy.called);
                var opts = spy.args[0][0];
                assert.equal(opts.token, labsToken);
                assert.equal(opts.network, collectionInfo.network);
                assert.equal(opts.siteId, collectionInfo.siteId);
                assert.equal(opts.articleId, collectionInfo.articleId);

                spy.restore();
                done();
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
