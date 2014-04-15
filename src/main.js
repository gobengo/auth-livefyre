module.exports = {
    createDelegate: require('./livefyre-auth-delegate'),
    User: require('./user'),
    userService: require('./user-service'),
    api: require('./auth-api'),
    plugin: require('./auth-plugin')
};
