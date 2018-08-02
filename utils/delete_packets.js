// WARNING: modifies database significantly
// MAKE SURE TO BACK UP DB BEFORE USING
var path = require("path");
var result = require('dotenv').config({path: path.resolve(process.cwd(), "../.env")});
var connectDb = require('../server/db');
var mongoose = require('mongoose');
var routes = require('../server/routes'); // needed for transmission
var Transmission = require('../server/db/models/transmission');
var receive = require('../server/routes/receive.js');

ACTUALLY_DELETE = true
CUIDS_TO_DELETE = [];

connectDb
.then(() => {
  console.log('Connected to MongoDB')
  run()
})
.catch(err => {
  console.error(err);
});

function run() {
  for (var i = 0; i < CUIDS_TO_DELETE.length; i++) {
    deleteTransmission(CUIDS_TO_DELETE[i]);
  }
}

function deleteTransmission(cuid) {
  var query = Transmission.find({"cuid": cuid}).populate('data').populate('error_codes').populate('current_info')

  query.exec()
  .then(transmissions => {
    // delete tranmissions (should only be one)
    var transmissionUpdates = transmissions.map(tx => {
      console.log(`Deleting packets with CUID: ${cuid} (${transmissions.length} found)`)

      if (ACTUALLY_DELETE) {
        tx.remove().then(update => {
            console.log(`${cuid}: removed transmission`)

            // remove error codes for transmission
            ecodeRemoves = tx.error_codes.map(ecode => {
              return ecode.remove();
            });
            Promise.all(ecodeRemoves)
            .then(completedUpdates => {
              console.log(`${cuid}:  removed error codes`)
            }).catch( err => {
              console.error(`${cuid}:  error removing error codes: ${err}`)
            });

            // remove data for transmission
            dataRemoves = tx.data.map(d => {
              return d.remove();
            });
            Promise.all(dataRemoves)
            .then(completedUpdates => {
              console.log(`${cuid}:  removed data`)
            }).catch( err => {
              console.error(`${cuid}:  error removing data: ${err}`)
            });

            // remove current info for transmission
            tx.current_info.remove()
            .then(completedUpdate => {
              console.log(`${cuid}:  removed cur info`)
            }).catch( err => {
              console.error(`${cuid}:  error removed cur info: ${err}`)
            });
          })
          .catch(err => {
            console.error(`${tx._id}: error removing transmissions: ${err}`);
          });
      }
    });
  })
  .catch(err => {
    console.error(err);
  });
}
