// Run this while local server is running

// Loads environment variables from our .env file
require('dotenv').config(); // defaults to .env

var Chance = require('chance');

// Instantiate Chance so it can be used
var chance = new Chance();

var rp = require('request-promise');

var options = {
  method: 'POST',
  uri: 'http://localhost:8000/equisat/receive',
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
    transmission: packet,
    raw: chance.hash({length: 510}), // something random
    corrected: chance.hash({length: 446}), // something random
    station_name: 'Test Computer',
    secret: process.env.SECRET
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
