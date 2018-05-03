var mongoose = require('mongoose');

// replace Mongoose Promise with bluebird's
mongoose.Promise = require('bluebird');

var user = process.env.DATABASE_USER;
var password = process.env.DATABASE_USER_PASSWORD;
var uri = process.env.DATABASE_URI;

// Export a Promise to connect
module.exports = mongoose.connect(`mongodb://${user}:${password}@${uri}`);
