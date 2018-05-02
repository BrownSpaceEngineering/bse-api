var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transmissionSchema = new Schema({
  created: {
    type: Date,
    default: Date.now,
    required: true
  },

  // Original Hex String Received
  raw: {
    type: String,
    required: true
  },

  // Unique Identifier
  cuid: {
    type: String,
    required: true
  },

  data: [{
    type: Schema.Types.ObjectId, ref: 'Data'
  }],

  preamble: Schema.Types.Mixed,

  error_codes: [{
    type: Schema.Types.ObjectId, ref: 'ErrorCode'
  }],

  current_info: {
    type: Schema.Types.ObjectId, ref: 'CurrentInfo'
  }
});

module.exports = mongoose.model('Transmission', transmissionSchema);
