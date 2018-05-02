var mongoose = require('mongoose');

// replace Mongoose Promise with bluebird's
mongoose.Promise = require('bluebird');

// Export a Promise to connect
module.exports = mongoose.connect('mongodb://localhost/equisat');
