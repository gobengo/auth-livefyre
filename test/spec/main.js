var livefyreAuth = require('auth-livefyre');
var assert = require('chai').assert;
var sinon = require('sinon');

describe('auth-livefyre', function () {
    it('is truthy', function (){
        assert(livefyreAuth);
    });
});
