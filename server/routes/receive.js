var router = require('express').Router();

var ErrorCode = require('../db/models/errorCode');
var Data = require('../db/models/data');
var CurrentInfo = require('../db/models/currentInfo');
var Transmission = require('../db/models/transmission');
var cuid = require('cuid');
var chalk = require('chalk');

router.post('/', function (req, res, next) {
  try {
    var raw = req.body.raw;
    var corrected = req.body.corrected;

    // convert raw here
    // for testing, json is directly on the req.body
    var transmission = req.body.transmission;

    var station_name = req.body.station_name ? req.body.station_name : 'unknown' // if station_name exists on the body, otherwise use unknown

    // First find if the transmission has been received before
    Transmission.findOne()
    .where('corrected').equals(corrected)
    .exec()
    .then(checkTransmission => {
      // If transmission with same corrected string exists
      if (checkTransmission) {
        // Add station_name to the list of station names
        checkTransmission.station_names.push(station_name);

        // Append raw to list of raws
        checkTransmission.raws.push(raw);

        checkTransmission.save()
        .then(() => {
          console.log(chalk.green('Transmission already exists - appended information'));
          res.status(201).end();
        })
        .catch(err => {
          next(err);
        })
      } else {
        var dataType = transmission.preamble.message_type;

        // unique identifier
        var transmissionCuid = cuid();

        var newTransmission = new Transmission({
          raws: [raw],
          cuid: transmissionCuid,
          preamble: transmission.preamble,
          corrected: corrected,
          station_names: [station_name]
        });

        // An array of Promises for Error Code database saves
        var newErrorCodePromises = transmission.errors.map(errorCode => {
          var newErrorCode = new ErrorCode(errorCode);
          newErrorCode.transmission_cuid = transmissionCuid;
          return newErrorCode.save();
        });

        Promise.all(newErrorCodePromises)
        .then(savedErrorCodes => {
          // Add Reference Object IDs to transmission
          newTransmission.error_codes = savedErrorCodes.map(errorCode => {
            return errorCode._id;
          });

          console.log(chalk.green('Error Codes Saved'));

          var newCurrentInfo = new CurrentInfo(transmission.current_info);
          newCurrentInfo.transmission_cuid = transmissionCuid;

          return newCurrentInfo.save();
        })
        .then(savedCurrentInfo => {
          newTransmission.current_info = savedCurrentInfo._id;

          console.log(chalk.green('Current Info Saved'));

          // If the Data is an Array Value
          if (Array.isArray(transmission.data)) {
            var newDataPromises = transmission.data.map(data => {
              var newData = new Data({
                payload: data,
                data_type: dataType,
                transmission_cuid: transmissionCuid
              });
              return newData.save();
            })

            return Promise.all(newDataPromises);
          } else {
            // Otherwise the transmission.data is an Object and not an array of objects
            var newData = new Data({
              payload: transmission.data,
              data_type: dataType,
              transmission_cuid: transmissionCuid
            });
            return newData.save();
          }
        })
        .then(savedData => {
          if (Array.isArray(savedData)) {
            newTransmission.data = savedData.map(data => {
              return data._id;
            });
          } else {
            // It must be an array format
            newTransmission.data = [savedData._id];
          }


          console.log(chalk.green('Data Saved'));

          // Save the transmission model at the end once it has the rest of its Object IDs
          return newTransmission.save();
        })
        .then(savedTransmission => {
          console.log(chalk.green('Transmission Saved'));
          res.end();
        })
        .catch(err => {
          next(err);
        })
      }
    })
    .catch(err => {
      next(err);
    })

  } catch (err) {
    err.status = 400;
    next(err);
  }

})

module.exports = router;
