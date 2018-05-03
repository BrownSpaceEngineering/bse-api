var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errorCodeSchema = new Schema({
  // created is when this error was recorded on the satellite itself
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true
  },

  error_location: {
    type: Number,
    required: true
  },

  priority_bit: {
    type: Number,
    required: true
  },

  error_code_name: {
    type: String,
    required: true
  },

  error_location_name: {
    type: String,
    required: true
  },

  error_code: {
    type: Number,
    required: true
  },

  // uncorrected timestamp, for archival purposes
  timestamp: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('ErrorCode', errorCodeSchema);
