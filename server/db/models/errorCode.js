var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errorCodeSchema = new Schema({
  // added is when this error was first received in the database
  added: {
    type: Date,
    default: Date.now,
    required: true
  },

  // Recorded corresponds directly to the error timestamp, but in real time
  recorded: {
    type: Date,
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
