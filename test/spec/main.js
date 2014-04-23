var livefyreAuth = require('auth-livefyre');
var assert = require('chai').assert;

describe('auth-livefyre', function () {
    it('is truthy', function (){
        assert(livefyreAuth);
    });
    it('has a delegate method', function () {
        assert.typeOf(livefyreAuth.delegate, 'function');
    });
});
