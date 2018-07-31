var router = require('express').Router();

var ErrorCode = require('../db/models/errorCode');
var Data = require('../db/models/data');
var CurrentInfo = require('../db/models/currentInfo');
var Transmission = require('../db/models/transmission');
var Dump = require('../db/models/dump');
var cuid = require('cuid');
var chalk = require('chalk');
var email = require('emailjs');
var config = require("../../config.js");

// connect to email server
var server = email.server.connect(config.EMAIL_CONFIG);

SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:23:06 UTC")

/* generates a received date object from a satellite timestamp, based on the 0-date specified above */
function timestampToCreated(timestamp_s) {
  return new Date(SATELLITE_FIRST_BOOT_DATE_UTC.getTime() + timestamp_s*1000)
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
            // send out emails (async) after response
            publishTransmission(req.body);
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
            res.end();
            // send out emails (async) after response
            publishTransmission(req.body);
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

/* publishes a received transmission to email and webhooks */
function publishTransmission(body) {
  if (config.EMAIL_RECIPIENTS != null && config.EMAIL_CONFIG != null) {


    // send the digest and full versions of the email to two seperate lists of people
    digest_recipients = [];
    full_recipients = [];
    for (email in config.EMAIL_RECIPIENTS) {
      if (config.EMAIL_RECIPIENTS[email] == "digest") {
        digest_recipients.push(email);
      } else { // full or incorrect
        full_recipients.push(email);
      }
    }

    sendPacketEmail(body, server, digest_recipients, full=false);
    sendPacketEmail(body, server, full_recipients, full=true);
  } else {
    console.log(chalk.red("didn't send email on packet becuase no recipients or no email config specified"));
  }
}

function sendPacketEmail(body, server, recipients, full=false) {
  if (recipients.length == 0) {
    return;
  }

  var subject = `EQUiStation '${body.station_name}' received a packet!`;

  // build message with optional full part
  var preamble = body.transmission.preamble;
  var cur = body.transmission.current_info;
  var message = `\
satellite state:\t${preamble.satellite_state}
message type:\t\t${preamble.message_type}
LiOns (mV):\t\t${cur.L1_REF} ${cur.L2_REF} (active: ${cur.L_REF})
LiFePos (mV):\t\t${cur.LF1REF} ${cur.LF2REF} ${cur.LF3REF} ${cur.LF4REF}
PANELREF (mV):\t\t${cur.PANELREF}
secs since launch:\t${preamble.timestamp}
boot count:\t\t${cur.boot_count}
memory was corrupted:\t${preamble.MRAM_CPY}
secs to flash:\t\t${cur.time_to_flash}`;

  if (full) {
    message = message + `

      raw:
      ${body.raw}

      corrected:
      ${body.corrected}

      parsed:
      ${JSON.stringify(body.transmission)}`
  }

  server.send({
    from: config.FROM_ADDRESS,
    to: recipients.join(","),
    subject: subject,
    text: message
  }, function(err, message) {
    if (err) {
      console.log(chalk.red("Email notification error: " + err));
    } else {
      console.log(chalk.green("Email notification success: " + JSON.stringify(message)));
    }
  });
}

module.exports = router;
