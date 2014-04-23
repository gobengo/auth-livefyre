var livefyreAuth = require('livefyre-auth');
var assert = require('chai').assert;

describe('livefyre-auth', function () {
    it('is truthy', function (){
        assert(livefyreAuth);
    });
    it('has a delegate method', function () {
        assert.typeOf(livefyreAuth.delegate, 'function');
    });
});
