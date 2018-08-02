// WARNING: modifies database significantly
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');
var receive = require('../server/routes/receive.js');

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
    var startAveragingTimestamp = 978054;
    var maxDiff = 1400;
    var sumOfDiffs = 0;
    var numTimestamps = 0;

    // update transmission timestamps
    var transmissionUpdates = transmissions.map(tx => {
      console.log(`Updating packet ${tx._id} with timestamp ${tx.preamble.timestamp}`)
      console.log("added: " + tx.added);
      console.log("created (before): " + tx.created)
      var newCreated = receive.timestampToCreated(tx.preamble.timestamp, tx.added)
      console.log("created (after ): " + newCreated)

      if (tx.preamble.timestamp >= startAveragingTimestamp) {
        diff = tx.added.getTime()/1000 - newCreated.getTime()/1000
        console.log("added vs. new created diff (s): " + diff)
        if (diff <= maxDiff) {
          sumOfDiffs += diff;
          numTimestamps += 1;
        }
      }

      if (ACTUALLY_UPDATE) {
        tx.update({created: newCreated})
          .then(updated => {
            console.log(`${tx._id}: updated transmission`)

            // update error codes for transmission
            ecodeUpdates = tx.error_codes.map(ecode => {
              newCreated = receive.timestampToCreated(ecode.timestamp, tx.added);
              return ecode.update({created: newCreated});
            });
            Promise.all(ecodeUpdates)
            .then(completedUpdates => {
              console.log(`${tx._id}:  updated error codes`)
            }).catch( err => {
              console.error(`${tx._id}:  error updating error codes: ${err}`)
            });

            // update data for transmission
            dataUpdates = tx.data.map(d => {
              newCreated = receive.timestampToCreated(d.payload.timestamp, tx.added);
              return d.update({created: newCreated});
            });
            Promise.all(dataUpdates)
            .then(completedUpdates => {
              console.log(`${tx._id}:  updated data`)
            }).catch( err => {
              console.error(`${tx._id}:  error updating data: ${err}`)
            });

            // update current info for transmission
            newCreated = receive.timestampToCreated(tx.current_info.timestamp, tx.added);
            tx.current_info.update({created: newCreated})
            .then(completedUpdate => {
              console.log(`${tx._id}:  updated cur info`)
            }).catch( err => {
              console.error(`${tx._id}:  error updating cur info: ${err}`)
            });

          })
          .catch(err => {
            console.error(`${tx._id}: error updating transmissions: ${err}`);
          });
      }

    });
    console.log(`average difference (added vs. new created): ${(sumOfDiffs/numTimestamps)} num=${numTimestamps}`);

  })
  .catch(err => {
    console.error(err);
  });
}
