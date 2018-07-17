var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dumpSchema = new Schema({
  // added is when this data was recieved in the database
  added: {
    type: Date,
    default: Date.now,
    required: true
  },

  // REST OF DUMP IS DIRECTLY SAVED
  payload: {
    type: Schema.Types.Mixed,
    required: true
  }
});

module.exports = mongoose.model('Dump', dumpSchema);
