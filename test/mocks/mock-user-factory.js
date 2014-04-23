var mockAuthResponse = require('json!livefyre-auth-tests/mocks/auth-response.json');
var authApi = require('livefyre-auth/auth-api')
var LivefyreUser = require('livefyre-auth/user');

var MockUserFactory = function () {
};

MockUserFactory.prototype.createUser = function () {
    var user = new LivefyreUser();
    authApi.updateUser(user, mockAuthResponse.data)
    return user;
};

module.exports = MockUserFactory;
