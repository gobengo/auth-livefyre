var assert = require('chai').assert;
var auth = require('auth');
var sinon = require('sinon');
var authLater = require('livefyre-auth/contrib/auth-later-internal');
var authInterface = require('auth/contrib/auth-interface');
var getScript = require('livefyre-auth/util/get-script');

describe('livefyre-auth/contrib/auth-later', function() {

    describe('Livefyre.js is on the page', function () {

        before(function () {
            window.Livefyre = {
                require: function () {},
                _lfjs: true
            };
        });

        after(function () {
            window.Livefyre = null;
        });

        it('requires auth', function() {
            var requireSpy = sinon.stub(Livefyre, 'require');
            var later = authLater.getAuth();
            assert(requireSpy.called, 'require not called');
            assert(requireSpy.calledWith(['auth']));
            requireSpy.restore();
        });

        it('proxies every public method on auth', function () {
            var later = authLater.getAuth();
            for (var i = authInterface.length - 1; i >= 0; i--) {
                assert(later[authInterface[i]]);
            }
        });
    });

    describe('.proxyCall("get")', function () {
        before(function () {
            window.Livefyre = {
                require: function (deps, cb) {
                    cb(auth);
                },
                _lfjs: true
            };
        });

        after(function () {
            window.Livefyre = null;
        });

        it('proxies to the real implementation', function (done) {
            var getSpy = sinon.spy(auth, 'get');
            var later = authLater.getAuth();
            later.get('woah');
            setTimeout(function () {
                assert(getSpy.called);
                assert(getSpy.calledWith('woah'));
                getSpy.restore();
                done();
            }, 4);
        });
    });

    describe('Livefyre.js is not on the page', function () {
        var getScriptStub;
        beforeEach(function () {
            getScriptStub = sinon.stub(getScript, 'req');
            authLater.hazAuth = false;
        });

        afterEach(function () {
            getScriptStub.restore();
        });

        it('fetches Livefyre.js', function () {
            var later = authLater.getAuth();
            assert(getScriptStub.called);
            assert(getScriptStub.calledWith('//cdn.livefyre.com/Livefyre.js'));
            getScriptStub.restore();
        });

        it('queues calls before auth is here', function () {
            var later = authLater.getAuth();
            later.get('woah');
            assert(authLater.pendingCalls.length);
            authLater.pendingCalls = [];
        });

        it('flushes pending calls when auth is here', function () {
            authLater.auth = {
                get: sinon.spy()
            }
            authLater.pendingCalls.push(['get', ['woah']]);
            authLater.flushPendingCalls();
            assert(authLater.auth.get.called);
            assert(authLater.auth.get.calledWith('woah'));
            assert(!authLater.pendingCalls.length);
            authLater.auth = {};
        });
    });
});
