var auth = require('auth');
require('livefyre-auth').plugin(auth);
var log = require('debug')('livefyre-sso-auth-demo');
var createAuthButton = require('auth/contrib/auth-button');
var createAuthLog = require('auth/contrib/auth-log');

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

var labsToken = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJkb21haW4iOiAibGFicy5meXJlLmNvIiwgImV4cGlyZXMiOiAxMzk5MTk1MTYwLjE1NTc2MSwgInVzZXJfaWQiOiAiY29tbWVudGVyXzAifQ.N77QlLeF-Z6MMJhospdwpPpZH4HCfaf20fIPhL7GdOY';

var delegate = window.delegate = singleTokenLogin(labsToken);

auth.delegate(delegate);

auth.on('login.livefyre', function (livefyreUser) {
    log("User was logged into Livefyre", livefyreUser);
});

window.token = labsToken;
window.auth = auth;

var authLog = createAuthLog(auth, document.getElementById('auth-log'));
createAuthButton(auth, document.getElementById('auth-button'), authLog);
