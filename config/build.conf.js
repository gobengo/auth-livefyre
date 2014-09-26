({
  mainConfigFile: 'requirejs.conf.js',
  paths: {
    almond: 'lib/almond/almond'
  },
  baseUrl: '..',
  name: 'livefyre-auth',
  include: ['almond'],
  out: '../dist/livefyre-auth.min.js',
  preserveLicenseComments: false,
  cjsTranslate: true,
  wrap: {
    startFile: 'wrap-start.frag',
    endFile: 'wrap-end.frag'
  }
})
