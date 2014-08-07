var authAdapters = require('./auth-adapters');
var LivefyreUser = require('./user');
var log = require('debug')('livefyre-auth/auth-plugin');
var session = require('./session');
var userServiceModule = require('./user-service');

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
    var userService = opts.userService || userServiceModule;
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

    // transparently adapt an old livefyre auth delegate to a new one
    auth.delegate = (function(orig) {
        return function (delegate) {
            delegate = authAdapters.oldToNew(delegate);
            orig.call(auth, delegate);
        };
    })(auth.delegate);

    function consumeFyreDelegate() {
        if (typeof fyre.conv.getDelegate === 'function') {
            var delegate = fyre.conv.getDelegate();
            if (delegate && !delegate.appkitMetaDelegate) {
                auth.delegate(delegate);
            }
        }
    }

    function fyreReady() {
        // if fyre.conv auth is here then use it
        if (window.fyre && window.fyre.conv && typeof fyre.conv.ready === 'function') {
            fyre.conv.ready(function () {
                consumeFyreDelegate();
            });
            return true;
        }
    }

    // poll for fyre.conv with exponential backoff
    var attempts = 0;
    (function poll() {
        attempts++;
        if (attempts > 15 || auth.hasDelegate() || fyreReady()) {
            return;
        }
        setTimeout(poll, 100 * attempts);
    })();
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
