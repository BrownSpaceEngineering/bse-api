// Run this while local server is running

// Loads environment variables from our .env file
var path = require('path')
require('dotenv').config({path: path.resolve(process.cwd(), "../.env")}); // defaults to .env

var Chance = require('chance');

// Instantiate Chance so it can be used
var chance = new Chance();

var rp = require('request-promise');
var packetparse = require('../server/packetparse/packetparse.js');
var security = require('../server/routes/key-manager');
var secret = security.generateKey();

var USE_RAW_ROUTE = true;

var options = {
  method: 'POST',
  uri: 'http://localhost:3000/equisat/' + (USE_RAW_ROUTE ? 'receive/raw': 'receive'),
  json: true // Automatically stringifies the body to JSON
};

var attitudePacket = require('./samplePackets/attitudePacket.json');
var flashBurstPacket = require('./samplePackets/flashBurstPacket.json');
var flashCmpPacket = require('./samplePackets/flashCmpPacket.json');
var idlePacket = require('./samplePackets/idlePacket.json');
var lowPowerPacket = require('./samplePackets/lowPowerPacket.json');

var packets = [attitudePacket, flashBurstPacket, flashCmpPacket, idlePacket, lowPowerPacket];

var packetPromises = packets.map(packet => {
  var packetOption = Object.assign({}, options);

  packetOption.body = {
    transmission: packet.parsed,
    raw: packet.corrected + chance.hash({length: 64}), // something random
    corrected: packet.corrected,
    station_name: 'Test Computer',
    secret: secret,
    post_publicly: true,
    source: "test_source",
    latitude: 43.1,
    longitude: -70
    // rx_time: Date.now()
  }

  return rp(packetOption);
});

Promise.all(packetPromises)
.then(() => {
  console.log('Packets Seeded');
})
.catch(err => {
  console.error(err);
})
