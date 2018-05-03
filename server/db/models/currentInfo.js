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
    type: String,
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
    type: String,
    required: true
  },
  LF_B1_FAULTN: {
    type: String,
    required: true
  },
  LF_B1_CHGN: {
    type: String,
    required: true
  },
  PANELREF: {
    type: Number,
    required: true
  },
  LF_B1_RUN_CHG: {
    type: String,
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
    type: String,
    required: true
  },
  L1_FAULTN: {
    type: String,
    required: true
  },
  L1_ST: {
    type: String,
    required: true
  },
  L2_DISG: {
    type: String,
    required: true
  },
  L1_RUN_CHG: {
    type: String,
    required: true
  },
  boot_count: {
    type: Number,
    required: true
  },
  L2_CHGN: {
    type: String,
    required: true
  },
  L2_ST: {
    type: String,
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
    type: String,
    required: true
  },
  LF2REF: {
    type: Number,
    required: true
  },
  L1_DISG: {
    type: String,
    required: true
  },
  LF_B2_FAULTN: {
    type: String,
    required: true
  },
  L2_RUN_CHG: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('CurrentInfo', currentInfoSchema);
