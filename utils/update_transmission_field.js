// WARNING: modifies database!
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');

ACTUALLY_UPDATE = false;

connectDb
.then(() => {
  console.log('Connected to MongoDB')
  run()
})
.catch(err => {
  console.error(err);
});


function run() {
  var query = Transmission.find().populate('data').populate('error_codes').populate('current_info')

  query.exec()
  .then(transmissions => {
    console.log(`num transmissions: ${transmissions.length}`);

    // update transmission field
    var transmissionUpdates = transmissions.map(tx => {
      console.log(`Updating transmission ${tx._id} with timestamp ${tx.preamble.timestamp}`)

      // clear out old fields after moving to station_info list
      // (switch to JS object to remove params)
      // function run() {
      //   // the only way: https://team.goodeggs.com/how-to-remove-a-property-from-a-mongoose-js-schema-1947330c6974
      //   Transmission.collection.update({}, {$unset: {
      //     "request_time": "",
      //     "raws": "",
      //     "sources": "",
      //     "pass_data": "",
      //     "doppler_corrections": "",
      //     "doppler_correction": "",
      //     "latest_rssi": "",
      //     "latest_packet_rssi": "",
      //     "rx_since_pass_start": "",
      //   }},
      //   {multi: true, safe: true}
      //   ).then(() => {
      //     console.log("done");
      //   }).catch((err) => {
      //     console.log(err);
      //   });
      // }

      // transition to station_info list from a bunch of random fields
      // AND add lat/lon
      // for (var i = 0; i < tx.station_names.length; i++) {
      //   lat = null
      //   lon = null
      //   if (tx.station_names[i] == "Ladd Observatory" || tx.station_names[i] == "Ladd Observatory Yagi") {
      //     lat = 41.839157
      //     lon = -71.398982
      //   } else if (tx.station_names[i] == "BSE Mission Control") {
      //     lat = 41.826992
      //     lon = -71.398005
      //   } else if (tx.station_names[i] == "Sapienza University of Rome") {
      //     lat = 41.892942
      //     lon = 12.494183
      //   }
      //
      //   var station_info = {
      //     request_time: tx.request_time,
      //     added: tx.added,
      //     created: tx.created,
      //     raw: tx.raws[i],
      //     name: tx.station_names[i],
      //     source: tx.sources[i] == null ? "equistation" : tx.sources[i],
      //     latitude: lat,
      //     longitude: lon,
      //     pass_data: tx.pass_data === undefined ? null : tx.pass_data,
      //     doppler_corrections: tx.doppler_corrections,
      //     doppler_correction: tx.doppler_correction,
      //     latest_rssi: tx.latest_rssi,
      //     latest_packet_rssi: tx.latest_packet_rssi,
      //     rx_since_pass_start: tx.rx_since_pass_start
      //   }
      //   console.log(station_info);
      //   tx.station_info.push(station_info);
      // }

      // updated request_time to equal added for equistation packets
      // if (tx.sources.indexOf("equistation") != -1) {
      //   console.log(`req time: ${tx.request_time} -> added: ${tx.added}`);
      //   tx.request_time = tx.added;
      // }

      // updated sources in DB BEFORE WE STARTED GETTING DATA FROM NEW APPS
      // (DON'T RUN THIS AGAIN)
      // for (var i = 0; i < tx.station_names.length; i++) {
      //   tx.sources.push("equistation");
      // }

      if (ACTUALLY_UPDATE) {
        tx.update()
          .then(updated => {
            console.log(`${tx._id}: updated transmission`);
          })
          .catch(err => {
            console.error(`${tx._id}: error updating transmission: ${err}`);
          });
      }
  });
  })
  .catch(err => {
    console.error(err);
  });
}
