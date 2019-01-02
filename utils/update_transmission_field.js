// WARNING: modifies database!
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');

ACTUALLY_UPDATE = false

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

      // updated sources in DB BEFORE WE STARTED GETTING DATA FROM NEW APPS
      // (DON'T RUN THIS AGAIN)
      // for (var i = 0; i < tx.station_names.length; i++) {
      //   tx.sources.push("equistation");
      // }
      //
      // if (ACTUALLY_UPDATE) {
      //   tx.save()
      //     .then(updated => {
      //       console.log(`${tx._id}: updated transmission`);
      //     })
      //     .catch(err => {
      //       console.error(`${tx._id}: error updating transmission: ${err}`);
      //     });
      // }
  });
  })
  .catch(err => {
    console.error(err);
  });
}
