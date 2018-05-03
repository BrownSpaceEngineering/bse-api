// Run this while local server is running

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
    raw: 'ifcjiajioajd01j0121e', // something random
    corrected: '1ioj10danklvnapadf', // something random
    station_name: 'Test Computer'
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
