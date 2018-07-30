var router = require('express').Router();

var ErrorCode = require('../db/models/errorCode');
var Data = require('../db/models/data');
var CurrentInfo = require('../db/models/currentInfo');
var Transmission = require('../db/models/transmission');
var Dump = require('../db/models/dump');
var cuid = require('cuid');
var chalk = require('chalk');
var request = require('request');

SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:23:06 UTC")
/* generates a received date object from a satellite timestamp, based on the 0-date specified above */
function timestampToCreated(timestamp_s) {
  return new Date(SATELLITE_FIRST_BOOT_DATE_UTC.getTime() + timestamp_s*1000)
}

function postToSlackWebhook(stationName, satState, messageType, cuid) {
  var webHookURL = "https://hooks.slack.com/services/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";
  
  var payload = {
    text: stationName + " received a packet!",
    attachments: [
      {
        text: "State: " + satState + "\nMessage Type: " + messageType,
        actions: [
          {
            type: "button",
            text: "View Packet",
            url: "http://api.brownspace.org/equisat/transmissions/" + cuid
          }
        ]
      }
    ]
  };
  var clientServerOptions = {
    uri: webHookURL,
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  request(clientServerOptions, function (error, response) {
    if (error){console.log(error);}
    return;
  });
}

router.post('/', function (req, res, next) {
  try {

    // Save entire request body into Dump just for archival purposes
    Dump.create({
      payload: req.body
    })
    .then(() => {
      console.log(chalk.blue('Received a request and saved'));
    })
    .catch(err => {
      next(err);
    })

    // Check if the request has the correct secret password
    if (!req.body.secret || req.body.secret !== process.env.SECRET) {
      res.status(401).send('Invalid Credentials');
    } else {
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
          var transmissioncreated = timestampToCreated(transmission.preamble.timestamp);

          var newTransmission = new Transmission({
            created: transmissioncreated,
            raws: [raw],
            cuid: transmissionCuid,
            preamble: transmission.preamble,
            corrected: corrected,
            station_names: [station_name]
          });

          // An array of Promises for Error Code database saves
          var newErrorCodePromises = transmission.errors.map(errorCode => {
            var newErrorCode = new ErrorCode(errorCode);
            newErrorCode.created = timestampToCreated(errorCode.timestamp);
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
            newCurrentInfo.timestamp = transmission.preamble.timestamp;
            newCurrentInfo.created = transmissioncreated;
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
                  created: timestampToCreated(data.timestamp),
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
                created: timestampToCreated(transmission.data.timestamp),
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
            postToSlackWebhook(station_name, transmission.preamble.satellite_state, transmission.preamble.message_type, transmissionCuid);
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
    }
  } catch (err) {
    err.status = 400;
    next(err);
  }

})

module.exports = router;
