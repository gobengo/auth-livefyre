require.config({
  paths: {
    base64: 'lib/base64/base64',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    md5: 'lib/js-md5/js/md5',
    sinon: 'lib/sinonjs/sinon',
    chai: 'node_modules/chai/chai',
    debug: 'lib/debug/debug'
  },
  packages: [{
    name: 'auth-livefyre',
    location: 'src'
  },{
    name: 'auth-livefyre-tests',
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
