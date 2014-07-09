require.config({
  paths: {
    base64: 'lib/base64/base64',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    md5: 'lib/js-md5/js/md5',
    mout: 'lib/mout/src',
    sinon: 'lib/sinonjs/sinon',
    chai: 'node_modules/chai/chai',
    debug: 'lib/debug/debug',
    json: 'lib/requirejs-plugins/src/json',
    text: 'lib/requirejs-plugins/lib/text'
  },
  packages: [{
    name: 'livefyre-auth',
    location: 'src'
  },{
    name: 'livefyre-auth-tests',
    location: 'test'
  },{
    name: 'auth',
    location: 'lib/auth/src'
  }],
  shim: {
    'sinon': {
      exports: 'sinon'
    }
  }
});
