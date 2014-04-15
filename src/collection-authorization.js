/**
 * An Object that holds information
 * about a user's authorization in a Collection
 * @param collection.network {string} Network of Collection
 * @param collection.siteId {string} Site ID of Collection
 * @param collection.articleId {string} Article ID of Collection
 * @param authData {object} data returned from auth API
 */
module.exports = function CollectionAuthorization(collection) {
    this.collection = collection;
    // Array of Objects, where each object is like
    // { id: 'authorId', key: 'authorKey' }
    this.authors = [];
    // If the user is a moderator of the Collection, this will be a key
    // that lets them fetch non-public Content
    this.moderatorKey = null;
};
