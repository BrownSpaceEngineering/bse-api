var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var currentInfoSchema = new Schema({
  // added is when the transmission was received
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

  // Satellite timestamp
  timestamp: {
    type: Number,
    required: true
  },

  transmission_cuid: {
    type: String,
    required: true,
    unique: true
  },

  // REST OF DATA IS DIRECTLY SAVED
  LF1REF: {
    type: Number,
    required: true
  },
  L1_TEMP: {
    type: Number,
    required: true
  },
  LF3REF: {
    type: Number,
    required: true
  },
  L_REF: {
    type: Number,
    required: true
  },
  LF_B2_RUN_CHG: {
    type: Boolean,
    required: true
  },
  L1_SNS: {
    type: Number,
    required: true
  },
  L2_SNS: {
    type: Number,
    required: true
  },
  L2_FAULTN: {
    type: Boolean,
    required: true
  },
  LF_B1_FAULTN: {
    type: Boolean,
    required: true
  },
  LF_B1_CHGN: {
    type: Boolean,
    required: true
  },
  PANELREF: {
    type: Number,
    required: true
  },
  LF_B1_RUN_CHG: {
    type: Boolean,
    required: true
  },
  time_to_flash: {
    type: Number,
    required: true
  },
  L2_TEMP: {
    type: Number,
    required: true
  },
  L1_REF: {
    type: Number,
    required: true
  },
  LF_B2_CHGN: {
    type: Boolean,
    required: true
  },
  L1_FAULTN: {
    type: Boolean,
    required: true
  },
  L1_ST: {
    type: Boolean,
    required: true
  },
  L2_DISG: {
    type: Boolean,
    required: true
  },
  L1_RUN_CHG: {
    type: Boolean,
    required: true
  },
  boot_count: {
    type: Number,
    required: true
  },
  L2_CHGN: {
    type: Boolean,
    required: true
  },
  L2_ST: {
    type: Boolean,
    required: true
  },
  L2_REF: {
    type: Number,
    required: true
  },
  LF4REF: {
    type: Number,
    required: true
  },
  L1_CHGN: {
    type: Boolean,
    required: true
  },
  LF2REF: {
    type: Number,
    required: true
  },
  L1_DISG: {
    type: Boolean,
    required: true
  },
  LF_B2_FAULTN: {
    type: Boolean,
    required: true
  },
  L2_RUN_CHG: {
    type: Boolean,
    required: true
  },

  pass_data: [{
    type: Schema.Types.ObjectId, ref: 'pass_data'
  }],

  doppler_corrections: [{
    type: Schema.Types.ObjectId, ref: 'doppler_corrections'
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
  }



});

module.exports = mongoose.model('CurrentInfo', currentInfoSchema);
