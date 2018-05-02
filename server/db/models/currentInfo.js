var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var currentInfoSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true
  }

  // REST OF DATA IS DIRECTLY SAVED
});

module.exports = mongoose.model('CurrentInfo', currentInfoSchema);
