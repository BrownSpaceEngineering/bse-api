var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dumpSchema = new Schema({
  // created is when this data was recorded on the satellite itself
  received: {
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
