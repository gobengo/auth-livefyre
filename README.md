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

## `.User`

Create a Livefyre User model. It is rare that you'd create this directly.
Check out `.userService.fetch()`.

```javascript
var LivefyreUser = require('auth-livefyre').User;
var user = new LivefyreUser();
```

Users have attributes that can be get, set, and unset.

### `User#get`

Get an attribute

```javascript
user.get('id');
user.get('displayName');
```

### `User#set`

Set an attribute. This will emit events.

```javascript
// set with key, val args
user.set('id', 1);
// or a key/value map
user.get({
    id: 2,
    displayName: 'ben'
});
```

### `User#unset`

Unset an attribute. This will emit a change event.

```javascript
user.unset('id');
```

### `User#on`

Users are EventEmitters, and emit 'change' events when attributes change.

```javascript
// Listen for any change
user.on('change', function (changes) {
    // changes is an object of attribute/value pairs
});
// Listen for change of a particular attribute
user.on('change:{attributeName}', function (newValue) {
    // newValue is the value the attribute was changed to    
})
```

### `User#isMod`

Check if a User is known to be a a moderator of a scope.
returns a Boolean.

```javascript
// network
user.isMod({
    network: 'livefyre.com'
});
// siteId
user.isMod({
    siteId: '343434'
});
// collectionId
user.isMod({
    collectionId: '124124124'
});
// collection info
user.isMod({
    network: 'livefyre.com',
    siteId: '4',
    articleId: '169'
});
```

## `.permissions`

Deals with reading permissions from Livefyre

### `.permissions.forCollection(token, collection, errback)`

Get permissions for a Livefyre Authentication Token within a Collection.

```javascript
var permissions = require('auth-livefyre').permissions;
var collection = {
    network: 'livefyre.com',
    siteId: '4',
    articleId: '169'
};
permissions.forCollection('my token', collection, function (err, authorization) {
    // `authorization` is an instanceof CollectionAuthorization
});
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

## `.userService`

Manages Users via Livefyre Auth API

### `.fetch(credentials, errback)`

Fetch a LivefyreUser from the AuthAPI. If you pass collection info in your
credentials, the User will be made with the right collectionAuthorizations.

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
