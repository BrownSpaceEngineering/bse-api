var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errorCodeSchema = new Schema({
  // added is when this error was first received in the database
  added: {
    type: Date,
    default: Date.now,
    required: true
  },

  // created corresponds directly to the error timestamp, but in real time
  created: {
    type: Date,
    required: true
  },

  transmission_cuids: [{
    type: String,
    required: true
  }],

  // raw data in hex representing "hash" of data; unique key
  data_hash: {
    type: String,
    required: true,
    unique: true
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
