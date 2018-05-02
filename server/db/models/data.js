var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
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
  }

  // REST OF DATA IS DIRECTLY SAVED
});

module.exports = mongoose.model('Data', dataSchema);
