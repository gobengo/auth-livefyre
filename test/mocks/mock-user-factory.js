var mockAuthResponse = require('json!auth-livefyre-tests/mocks/auth-response.json');
var authApi = require('auth-livefyre/auth-api')
var LivefyreUser = require('auth-livefyre/user');

var MockUserFactory = function () {
};

MockUserFactory.prototype.createUser = function () {
    var user = new LivefyreUser();
    authApi.updateUser(user, mockAuthResponse.data)
    return user;
};

module.exports = MockUserFactory;
