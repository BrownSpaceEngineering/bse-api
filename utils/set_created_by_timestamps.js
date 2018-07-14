// WARNING: modifies database significantly
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../server/.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');

SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:23:06 UTC")

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
    console.log(transmissions.length)
    var updatePromises = transmissions.map(tx => {
      console.log(tx.update)
      console.log(`Updating packet ${tx._id} with timestamp ${tx.preamble.timestamp}`)
      console.log("Created (before): " + tx.created)
      var newCreated = timestampToCreated(tx.preamble.timestamp)
      console.log("Created (after ): " + newCreated)
      return tx.update({created: newCreated})
    })

    Promise.all(updatePromises)
    .then(completedUpdates => {
      console.log(completedUpdates)
    }).catch( err => {
      console.error(err)
    })
  })
  .catch(err => {
    console.error(err);
  })
}

/* generates a created date object from a satellite timestamp, based on the 0-date specified above */
function timestampToCreated(timestamp_s) {
  return new Date(SATELLITE_FIRST_BOOT_DATE_UTC.getTime() + timestamp_s*1000)
}
