var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errorCodeSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true
  }

  // REST OF ERROR IS DIRECTLY SAVED
});

module.exports = mongoose.model('ErrorCode', errorCodeSchema);
