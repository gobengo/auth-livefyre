var userService = require('./user-service');
var log = require('debug')('livefyre-auth/auth-plugin');
var session = require('./session');
var LivefyreUser = require('./user');

/**
 * An auth plugin that will handle livefyre credentials (lftokens) that are
 * passed to `auth.authenticate({ livefyre: creds })`. It will
 * * authenticate the creds by requesting the Auth API
 * * Create a LivefyreUser if authenticated
 * * Call `auth.login({ livefyre: user })`
 *
 * It will also load users from session initially, and clear the session
 * on auth 'logout' events
 *
 * @param auth {Auth} An auth module
 * @param [serverUrl] {string} The Livefyre host that is serving up auth.
 *     This should only need to be provided if you're using the 'livefyre.com'
 *     network on a non-production cluster
 * @param opts {Object}
 * @param opts.userService {Object} Specify an alternate user service
 */
module.exports = function (auth, serverUrl, opts) {
    opts = opts || {};
    userService = opts.userService || userService;
    function login(user) {
        auth.login({ livefyre: user });
    }

    // Load user from existing session
    var sessionUser = session.get();
    if (sessionUser) {
        login(sessionUser);
    }

    // When there are credentials for Livefyre
    // authenticate the user and call auth.login({ livefyre: user })
    auth.on('authenticate.livefyre', function (credentials) {
        if ( ! credentials) {
            return;
        }
        if (typeof credentials === 'string') {
            credentials = {
                token: credentials,
                serverUrl: serverUrl
            };
        }
        // The LivefyreAuthDelegate will be able to construct a user
        // by nature of its login process. Those are valid credentials
        // in place of a token, and we can save making an extra request
        if (credentials instanceof LivefyreUser) {
            return login(credentials);
        }

        // Try to get a user from the credentials
        // If succeed, save to session (cookie/storage)
        userService.fetch(credentials, function (err, user, userInfo) {
            if (err) {
                log('Error authenticating with credentials', credentials, err);
                return;
            }
            session.save(userInfo, user);
            login(user);
        });
    });

    auth.on('logout', function () {
        session.clear();
    });
};

// TODO: Not just anyone should be able to listen for events that contain
// the livefyre token. You must register a named plugin with auth, and auth
// will invoke plugins[name].authenticate(credentials[name]);

// module.exports = {
//     authenticate: function (credentials, errback) {
//         userService.fetch(credentials, function (err, user) {
//             if (err) {
//                 log('error fetching user for credentials', err, credentials);
//             } else {
//                 log('fetched user', user);
//             }
//             errback(err, user);
//         });
//     }
// }
