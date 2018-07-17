var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSchema = new Schema({
  // created is when this data was recorded on the satellite itself
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  // Recorded corresponds directly to the packet timestamp, but in real time
  recorded: {
    type: Date,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true
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
