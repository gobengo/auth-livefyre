var auth = require('auth');
require('livefyre-auth').plugin(auth);

var log = require('debug')('livefyre-auth-demo');
var createAuthButton = require('auth/contrib/auth-button');
var createAuthLog = require('auth/contrib/auth-log');
var livefyreDelegate = require('livefyre-auth/livefyre-auth-delegate');

function singleTokenLogin(token) {
    var singleTokenLoginDelegate = {
        login: function (authenticate) {
            authenticate(null, {
                livefyre: token
            });
        }
    };
    return singleTokenLoginDelegate;
}

var token = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGl2ZWZ5cmUuY29tIiwgImV4cGlyZXMiOiAxMzk5MTg5OTcxLjk2MzYxOCwgInVzZXJfaWQiOiAiX3VwMzU4ODYyODEifQ.rG49b8ZE26XSdVH24ry_vADkpgUtoRY86zB6dUrUc8I';
var delegate = window.delegate = livefyreDelegate('http://www.livefyre.com');

//auth.delegate(singleTokenLogin(token));
auth.delegate(delegate);


auth.on('login.livefyre', function (livefyreUser) {
    console.log("User was logged into Livefyre", livefyreUser);
});

window.token = token;
window.auth = auth;

var authLog = createAuthLog(auth, document.getElementById('auth-log'));
createAuthButton(auth, document.getElementById('auth-button'), authLog);
