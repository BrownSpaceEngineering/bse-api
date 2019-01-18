var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transmissionSchema = new Schema({
  station_info: [{
    // request_time is when the transmission was posted to the server
    request_time: {
      type: Date,
      default: Date.now,
      required: true
    },

    // added is when transmission was received by the ground station
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

    // Original Hex String Received
    raw: {
      type: String,
      required: true
    },

    name: {
      type: String
    },

    // the application which sent the data
    source: {
      type: String
    },

    // N is +, S is -
    latitude: {
      type: Number,
    },

    // W is -, E is +
    longitude: {
      type: Number,
    },

    // EQUiStation-specific data
    pass_data: {
      type: Schema.Types.Mixed,
      required: false
    },

    doppler_corrections: [{
      type: Schema.Types.Mixed,
      required: false
    }],

    doppler_correction: {
      type: Number,
      required: false
    },

    latest_rssi: {
      type: Number,
      required: false
    },

    latest_packet_rssi: {
      type: Number,
      required: false
    },

    rx_since_pass_start: {
      type: Number,
      required: false
    },
  }],

  // deprecated: kept for backwards compatibility with mobile app
  station_names: [{
    type: String
  }],

  // added is when transmission was received by the ground station
  // copied from the first packet received (not affected by duplicates)
  added: {
    type: Date,
    default: Date.now,
    required: true
  },

  // created corresponds directly to the packet timestamp, but in real time
  // copied from the first packet received (not affected by duplicates)
  created: {
    type: Date,
    required: true
  },

  // Post Reed Solomon decoding string for parsing
  corrected: {
    type: String,
    required: true,
    unique: true
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
    FLASH_KILLED: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Number,
      required: true,
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
