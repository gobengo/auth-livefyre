var auth = require('livefyre-auth');

var log = require('debug')('livefyre-auth-demo');
var createAuthButton = require('auth/contrib/auth-button');
var createAuthLog = require('auth/contrib/auth-log');
var livefyreDelegate = require('livefyre-auth/livefyre-auth-delegate');

var delegate = window.delegate = livefyreDelegate('http://www.livefyre.com', {
    siteId: 300512
});
auth.delegate(delegate);

auth.on('login.livefyre', function (livefyreUser) {
    log("User was logged into Livefyre", livefyreUser);
});

window.auth = auth;

var authLog = createAuthLog(auth, document.getElementById('auth-log'));
createAuthButton(auth, document.getElementById('auth-button'), authLog);
