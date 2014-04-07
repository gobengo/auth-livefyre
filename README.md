# Livefyre Auth

`auth-livefyre` provides a series of modules for helping with Authentication
in Livefyre-powered Applications.

## `.plugin(auth)`

Plug in to an instance of [`auth`](https://github.com/Livefyre/auth)

`auth` allows apps to publish and subscribe to login events, and to trigger
auth-related actions separately from how the web page operator delegates the
implementaiton details of their log in flow.

The plugin will watch for 'authenticate' events on auth that have Livefyre
credentials, and it will then try to authenticate them and log the user in with
`auth.login({ livefyre: user })`

It will also load a user from session on page load, and clear the session
on `auth` `logout` events.

```javascript
require('auth-livefyre').plugin(auth);
```

Note: To create a delegate for a non-production cluster, you'll need to pass the
`serverUrl` as a second parameter to `.plugin`

```javascript
require('auth-livefyre').plugin(auth, 'uat.livefyre.com');
```

## `.createDelegate(serverUrl)`

Create an `auth` delegate object to be passed to `auth.delegate()`.
This will configure auth to be controlled by Livefyre.com accounts and profiles.
Livefyre Enterprise customers will rarely use this.

```javascript
var livefyreAuthDelegate = require('auth-livefyre').createDelegate('http://livefyre.com');

auth.delegate(livefyreAuthDelegate);

// This would launch a Livefyre.com login window
auth.login();
```

## `.fetchUser(credentials, errback)`

Fetch a LivefyreUser from the AuthAPI.

```javascript
var livefyreAuth = require('auth-livefyre');
var authCredentials = {
    serverUrl: 'http://livefyre.com',
    token: 'lol'
};
livefyreAuth.fetchUser(authCredentials, function (err, user, userInfo) {
    // do
});
```

## `.User`

Create a Livefyre User model. It is rare that you'd create this directly.
Check out `.fetchUser()`.

## `.api`

Fetch the Livefyre Auth API.

Use `.updateUser(user, data)` to update a LivefyreUser
from the auth api response data

```javascript
var authApi = require('auth-livefyre').api;

authApi(opts, function (err, userInfo) {
    if (err) {
        return errback(err);
    }
    var user = new LivefyreUser();
    authApi.updateUser(user, userInfo);
});
```

### `.session`

Helpers for dealing with the Livefyre User session
