var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transmissionSchema = new Schema({
  // created is when transmission was received by the server
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

  // Post Reed Solomon decoding string for parsing
  corrected: {
    type: String,
    required: true
  },

  station_name: {
    type: String
  },

  // Unique Identifier
  cuid: {
    type: String,
    required: true
  },

  data: [{
    type: Schema.Types.ObjectId, ref: 'Data'
  }],

  preamble: {
    num_errors: {
      type: Number,
      required: true
    },
    SPF_ST: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Number,
      required: true,
      unique: true
    },
    callsign: {
      type: String,
      required: true
    },
    MRAM_CPY: {
      type: Boolean,
      required: true
    },
    satellite_state: {
      type: String,
      required: true
    },
    message_type: {
      type: String,
      required: true
    },
    bytes_of_data: {
      type: Number,
      required: true
    }
  },

  error_codes: [{
    type: Schema.Types.ObjectId, ref: 'ErrorCode'
  }],

  current_info: {
    type: Schema.Types.ObjectId, ref: 'CurrentInfo'
  }
});

module.exports = mongoose.model('Transmission', transmissionSchema);
