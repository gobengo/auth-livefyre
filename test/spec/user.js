var assert = require('chai').assert;
var LivefyreUser = require('livefyre-auth/user');
var permissions = require('livefyre-auth/permissions');
var sinon = require('sinon');

describe('livefyre-auth/user', function () {
    it('exports a function', function () {
        assert.typeOf(LivefyreUser, 'function');
    });
});
