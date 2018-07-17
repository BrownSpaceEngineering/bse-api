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
