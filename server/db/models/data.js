var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSchema = new Schema({
  // added is when this data was added to the database
  added: {
    type: Date,
    default: Date.now,
    required: true
  },

  // created corresponds directly to the packet timestamp, but in real time
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

  // Flash Burst Data or Idle State Data, etc.
  data_type: {
    type: String,
    required: true
  },

  // REST OF DATA IS DIRECTLY SAVED
  payload: {
    type: Schema.Types.Mixed,
    required: true
  }
});

module.exports = mongoose.model('Data', dataSchema);
