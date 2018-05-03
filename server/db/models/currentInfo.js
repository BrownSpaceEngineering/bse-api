var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var currentInfoSchema = new Schema({
  // Created is when the transmission was received AKA when current info was recorded
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true
  },

  // REST OF DATA IS DIRECTLY SAVED
  payload: {
    type: Schema.Types.Mixed,
    required: true
  }
});

module.exports = mongoose.model('CurrentInfo', currentInfoSchema);
