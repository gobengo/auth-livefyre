var auth = require('auth');
require('auth-livefyre').plugin(auth);

var log = require('debug')('auth-livefyre-demo');
var createAuthButton = require('auth/contrib/auth-button');
var createAuthLog = require('auth/contrib/auth-log');
var livefyreDelegate = require('auth-livefyre/livefyre-auth-delegate');

var delegate = window.delegate = livefyreDelegate('http://www.livefyre.com');
auth.delegate(delegate);

auth.on('login.livefyre', function (livefyreUser) {
    log("User was logged into Livefyre", livefyreUser);
});

window.auth = auth;

var authLog = createAuthLog(auth, document.getElementById('auth-log'));
createAuthButton(auth, document.getElementById('auth-button'), authLog);
