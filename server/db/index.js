var mongoose = require('mongoose');

// replace Mongoose Promise with bluebird's
mongoose.Promise = require('bluebird');

var user = process.env.DATABASE_USER;
var password = process.env.DATABASE_USER_PASSWORD;
var uri = process.env.DATABASE_URI;

// Export a Promise to connect
// Export a Promise to connect
if ((user == "" || user == undefined) && (password == "" || password == undefined)) {
  var connectURI = `mongodb://${uri}`
} else {
  var connectURI = `mongodb://${user}:${password}@${uri}`
}
module.exports = mongoose.connect(connectURI);
