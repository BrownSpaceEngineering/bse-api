// WARNING: modifies database significantly
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');
var timing = require('../server/routes/sat-timing.js');

ACTUALLY_UPDATE = false
CSV_OUTPUT = false

connectDb
.then(() => {
  if (!CSV_OUTPUT) console.log('Connected to MongoDB')
  run()
})
.catch(err => {
  console.error(err);
  process.exit(1);
});


function run() {

  // console.log(timing.timestampToCreated(46146177));
  // process.exit(0);

  var query = Transmission.find().populate('data').populate('error_codes').populate('current_info')

  query.exec()
  .then(transmissions => {
    if (!CSV_OUTPUT) {
      console.log(`num transmissions: ${transmissions.length}`);
    } else {
      console.log(`"cuid","added","added (ISO)","old created","old created (ISO)","new created","new created (ISO)","timestamp"`);
    }
    var startAveragingTimestamp = 978054;
    var maxDiff = 1400;
    var sumOfDiffs = 0;
    var numTimestamps = 0;
    var sumOfLaddDiffs = 0;
    var numLaddTimestamps = 0;

    // update transmission timestamps
    var transmissionUpdates = transmissions.map(tx => {
      if (!CSV_OUTPUT) console.log("")
      var newCreated = timing.timestampToCreated(tx.preamble.timestamp, tx.added)

      if (!CSV_OUTPUT) {
        console.log(`Updating packet ${tx.cuid} with timestamp ${tx.preamble.timestamp}`)
        console.log(`station: ${tx.station_names[0]}`)
        console.log("added: " + tx.added);
        console.log("created (before): " + tx.created)
        console.log("created (after ): " + newCreated)
      }

      if (tx.preamble.timestamp >= startAveragingTimestamp) {
        diff = tx.added.getTime()/1000 - newCreated.getTime()/1000
        if (!CSV_OUTPUT) console.log("added vs. new created diff (s): " + diff)

        absDiff = Math.abs(diff)
        if (absDiff <= maxDiff) {
          sumOfDiffs += absDiff;
          numTimestamps += 1;
        }
        if (tx.station_names[0] == "Ladd Observatory") {
          sumOfLaddDiffs += absDiff;
          numLaddTimestamps += 1;
        }
      }

      if (CSV_OUTPUT) {
        console.log(`${tx.cuid},${tx.added.getTime()},"${tx.added}",${tx.created.getTime()},"${tx.created}",${newCreated.getTime()},"${newCreated}",${tx.preamble.timestamp}`);
      }


      if (ACTUALLY_UPDATE) {
        tx.update({created: newCreated})
          .then(updated => {
            console.log(`${tx.cuid}: updated transmission`)

            // update error codes for transmission
            ecodeUpdates = tx.error_codes.map(ecode => {
              newErrorCreated = timing.timestampToCreatedRelative(ecode.timestamp, newCreated, tx.preamble.timestamp);
              return ecode.update({created: newErrorCreated});
            });
            Promise.all(ecodeUpdates)
            .then(completedUpdates => {
              console.log(`${tx.cuid}:  updated error codes`)
            }).catch( err => {
              console.error(`${tx.cuid}:  error updating error codes: ${err}`)
            });

            // update data for transmission
            dataUpdates = tx.data.map(d => {
              newDataCreated = timing.timestampToCreatedRelative(d.payload.timestamp, newCreated, tx.preamble.timestamp);
              return d.update({created: newDataCreated});
            });
            Promise.all(dataUpdates)
            .then(completedUpdates => {
              console.log(`${tx.cuid}:  updated data`)
            }).catch( err => {
              console.error(`${tx.cuid}:  error updating data: ${err}`)
            });

            // update current info for transmission
            // (use same timestamp as the transmission)
            tx.current_info.update({created: newCreated})
            .then(completedUpdate => {
              console.log(`${tx.cuid}:  updated cur info`)
            }).catch( err => {
              console.error(`${tx.cuid}:  error updating cur info: ${err}`)
            });

          })
          .catch(err => {
            console.error(`${tx.cuid}: error updating transmissions: ${err}`);
          });
      }

    });
    if (!CSV_OUTPUT) {
      console.log(`\naverage difference (added vs. new created): ${(sumOfDiffs/numTimestamps)}, num: ${numTimestamps}, ladd: ${sumOfLaddDiffs/numLaddTimestamps}, num: ${numLaddTimestamps}`);
    }

    if (CSV_OUTPUT && !ACTUALLY_UPDATE) process.exit(0);

  })
  .catch(err => {
    console.error(err);
  });
}
