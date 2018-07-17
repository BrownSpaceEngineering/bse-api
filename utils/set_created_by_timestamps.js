// WARNING: modifies database significantly
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');
var receive = require('../server/receive.js');

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
      console.log(`Updating packet ${tx._id} with timestamp ${tx.preamble.timestamp}`)
      console.log("Created (before): " + tx.created)
      var newCreated = receive.timestampToReceived(tx.preamble.timestamp)
      // TODO: update for all error codes, data, and current data
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
  .catch(err => {timestampToReceived
    console.error(err);
  })
}
