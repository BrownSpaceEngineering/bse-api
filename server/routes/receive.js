var router = require('express').Router();

var ErrorCode = require('../db/models/errorCode');
var Data = require('../db/models/data');
var CurrentInfo = require('../db/models/currentInfo');
var Transmission = require('../db/models/transmission');
var Dump = require('../db/models/dump');
var cuid = require('cuid');
var chalk = require('chalk');
var profanity = require( 'profanity-util', { substring: "lite" } );
var publishTransmission = require('./receive-publish');
var packetparse = require('../packetparse/packetparse.js');
var security = require('./key-manager');

// config
SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:20:30 UTC");
SATELLITE_CLOCK_SPEED_FACTOR = 1.00464518434817

/* generates a received date object from a satellite timestamp, based on the 0-date specified above */
function timestampToCreated(timestamp_s, added) {
  newCreated = new Date(SATELLITE_FIRST_BOOT_DATE_UTC.getTime() + SATELLITE_CLOCK_SPEED_FACTOR*timestamp_s*1000)
  // don't update to newCreated if greater than added, just used added
  if (newCreated.getTime() > added) {
    newCreated = added;
  }
  return newCreated;
}

router.post('/', function (req, res, next) {
  receivePacket(req.body, req.body.transmission, req.body.rx_time, res, next);
})

router.post('/raw', function (req, res, next) {
  ret = packetparse.parse_packet(req.body.corrected);
  transmission = ret[0];
  errs = ret[1];
  if (errs.length !== 0) {
    msg = `Submitted packet had parse errors: ${errs}`
    res.status(401).send(msg);
    console.log(chalk.red(msg));
  } else {
    receivePacket(req.body, transmission, req.body.rx_time, res, next);
  }
})

function receivePacket(body, transmission, added, res, next) {
  try {

    // Save entire request body into Dump just for archival purposes
    Dump.create({
      payload: body
    })
    .then(() => {
      console.log(chalk.blue('Received a request and saved'));
    })
    .catch(err => {
      next(err);
    })

    // Check if the request has the correct secret password
    if (!body.secret || !(security.validateKey(body.secret) || body.secret == process.env.SECRET)) {
      res.status(401).send('Invalid Credentials');
    } else {

      if (added === null || added === undefined) {
        added = Date.now()
      }

      var station_name = body.station_name ? body.station_name : '[unknown]' // if station_name exists on the body, otherwise use unknown
      // filter just in case (stick with 'lite' substring matching above unless something happens)
      var station_name = profanity.purify(station_name)[0];

      var raw = body.raw;
      var corrected = body.corrected;
      var source = body.source !== undefined ? body.source : null
      var transmissioncreated = timestampToCreated(transmission.preamble.timestamp, added);
      var latitude = (body.latitude === undefined || body.latitude === 0) ? null : body.latitude
      var longitude = (body.longitude === undefined || body.longitude === 0) ? null : body.longitude
      // EQUiStation-specific data
      var pass_data = body.pass_data !== undefined ? body.pass_data : null
      var doppler_corrections = body.doppler_corrections !== undefined ? body.doppler_corrections : null
      var doppler_correction = body.doppler_correction !== undefined ? body.doppler_correction : null
      var latest_rssi = body.latest_rssi !== undefined ? body.latest_rssi : null
      var latest_packet_rssi = body.latest_packet_rssi !== undefined ? body.latest_packet_rssi : null
      var rx_since_pass_start = body.rx_since_pass_start !== undefined ? body.rx_since_pass_start : null

      var station_info = {
        request_time: Date.now(),
        added: added,
        created: transmissioncreated,
        raw: raw,
        name: station_name,
        source: source,
        latitude: latitude,
        longitude: longitude,
        pass_data: pass_data,
        doppler_corrections: doppler_corrections,
        doppler_correction: doppler_correction,
        latest_rssi: latest_rssi,
        latest_packet_rssi: latest_packet_rssi,
        rx_since_pass_start: rx_since_pass_start
      }

      // First find if the transmission has been received before
      Transmission.findOne()
      .where('corrected').equals(corrected)
      .exec()
      .then(checkTransmission => {
        // If transmission with same corrected string exists
        if (checkTransmission) {
          // Add station info to the list
          checkTransmission.station_info.push(station_info);
          // Add station name for backwards compatibility
          checkTransmission.station_names.push(station_name);

          checkTransmission.save()
          .then(() => {
            console.log(chalk.green('Transmission already exists - appended information'));
            res.status(201).end();
            // send out emails (async) after response
            publishTransmission(body, transmission, checkTransmission, postPublicly=body.post_publicly, duplicate=true);
          })
          .catch(err => {
            next(err);
          })
        } else {
          var dataType = transmission.preamble.message_type;

          // unique identifier
          var transmissionCuid = cuid();

          var newTransmission = new Transmission({
            station_info: station_info,
            station_names: [station_name], // for backwards compatibility
            added: added,
            created: transmissioncreated,
            cuid: transmissionCuid,
            preamble: transmission.preamble,
            corrected: corrected
          });

          // An array of Promises for Error Code database saves
          var newErrorCodePromises = transmission.errors.map(errorCode => {
            var newErrorCode = new ErrorCode(errorCode);
            newErrorCode.created = timestampToCreated(errorCode.timestamp, added);
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
                  added: added,
                  created: timestampToCreated(data.timestamp, added),
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
                added: added,
                created: timestampToCreated(transmission.data.timestamp, added),
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
            console.log(chalk.green(`Transmission Saved (cuid: ${savedTransmission.cuid})`));
            res.end();
            // send out packet notifications after response
            publishTransmission(body, transmission, savedTransmission, postPublicly=body.post_publicly);
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
}

module.exports = router;
module.exports["timestampToCreated"] = timestampToCreated
