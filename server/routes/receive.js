var router = require('express').Router();

var ErrorCode = require('../db/models/errorCode');
var Data = require('../db/models/data');
var CurrentInfo = require('../db/models/currentInfo');
var Transmission = require('../db/models/transmission');
var Dump = require('../db/models/dump');
var cuid = require('cuid');
var chalk = require('chalk');
var request = require('request');
var email = require('emailjs');
var config = require("../../config.js");

// config
SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:20:30 UTC");
SATELLITE_CLOCK_SPEED_FACTOR = 1.00464518434817
TRANSMISSION_ROUTE_PREFIX = "http://api.brownspace.org/equisat/transmissions/"

// connect to email server
var server = email.server.connect(config.EMAIL_CONFIG);

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
      var added = Date.now()
      var transmission = req.body.transmission;

      var station_name = req.body.station_name ? req.body.station_name : 'unknown' // if station_name exists on the body, otherwise use unknown

console.log(req.body.doppler_correction);

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
            publishTransmission(req.body, checkTransmission.cuid, duplicate=true);
          })
          .catch(err => {
            next(err);
          })
        } else {
          var dataType = transmission.preamble.message_type;

          // unique identifier
          var transmissionCuid = cuid();
          var transmissioncreated = timestampToCreated(transmission.preamble.timestamp, added);
          var doppler_corrections = req.body.doppler_corrections !== undefined ? req.body.doppler_corrections : null
          var doppler_correction = req.body.doppler_correction !== undefined ? req.body.doppler_correction : null
          var latest_rssi = req.body.latest_rssi !== undefined ? req.body.latest_rssi : null
          var latest_packet_rssi = req.body.latest_packet_rssi !== undefined ? req.body.latest_packet_rssi : null
          var rx_since_pass_start = req.body.rx_since_pass_start !== undefined ? req.body.rx_since_pass_start : null

          var newTransmission = new Transmission({
            created: transmissioncreated,
            raws: [raw],
            cuid: transmissionCuid,
            preamble: transmission.preamble,
            corrected: corrected,
            station_names: [station_name],
            pass_data: req.body.pass_data,
            doppler_corrections: doppler_corrections,
            doppler_correction: doppler_correction,
            latest_rssi: latest_rssi,
            latest_packet_rssi: latest_packet_rssi,
            rx_since_pass_start: rx_since_pass_start
          });

          // add or update each error code
          var newErrorCodePromises = transmission.errors.map(errorCode => {
            return ErrorCode.findOne()
            .where('data_hash').equals(errorCode.data_hash)
            .exec()
            .then(checkErrorCode => {
              // if error code with exact data already exists, just add a link back to the transmission
              if (checkErrorCode) {
                // update, save, and then return promise to updated error code
                checkErrorCode.transmission_cuids.push(transmissionCuid);
                return checkErrorCode.save()
                .then((newErrorCode) => {
                  console.log(chalk.green('Error code already exists - appended information'));
                  return newErrorCode;
                });

              } else {
                // otherwise, create new one and save
                var newErrorCode = new ErrorCode(errorCode);
                newErrorCode.created = timestampToCreated(newErrorCode.timestamp, added);
                newErrorCode.transmission_cuids = [transmissionCuid];
                return newErrorCode.save();
              }
            })
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

            // create function to submit data secton to handle list/object formats
            var saveData = (data) => {
              return Data.findOne()
              .where('data_hash').equals(data.data_hash)
              .exec()
              .then(checkData => {
                // if data with exact data hash already exists, just add a link back to the transmission
                if (checkData) {
                  // update, save, and then return promise to updated data
                  checkData.transmission_cuids.push(transmissionCuid);
                  return checkData.save()
                  .then((newData) => {
                    console.log(chalk.green('Data element already exists - appended information'));
                    return newData;
                  });

                } else {
                  // otherwise, create new one and save
                  var newData = new Data({
                    created: timestampToCreated(data.timestamp, added),
                    payload: data,
                    data_type: dataType,
                    transmission_cuids: [transmissionCuid]
                  });
                  return newData.save();
                }
              });
            }

            // If the Data is an Array Value, collect all the save promises
            if (Array.isArray(transmission.data)) {
              var newDataPromises = transmission.data.map(data => {
                return saveData(data);
              })
              return Promise.all(newDataPromises);

            } else {
              // Otherwise the transmission.data is an Object and not an array of objects
              return saveData(transmission.data);
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
            publishTransmission(req.body, savedTransmission.cuid);
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

/**
 * Publishing helpers
 */

/* publishes a received transmission to email and webhooks */
function publishTransmission(body, transmissionCuid, duplicate=false) {
  // post to slack
  postToSlackWebhook(body, transmissionCuid, duplicate);

  // send emails
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
    sendPacketEmail(body, transmissionCuid, duplicate, server, digest_recipients, full=false);
    sendPacketEmail(body, transmissionCuid, duplicate, server, full_recipients, full=true);
  } else {
    console.log(chalk.red("didn't send email on packet becuase no recipients or no email config specified"));
  }
}

function getPacketInfoMessage(body) {
  var preamble = body.transmission.preamble;
  var cur = body.transmission.current_info;
  return `\
satellite state: ${preamble.satellite_state}
message type: ${preamble.message_type}
LiOns (mV): ${cur.L1_REF} ${cur.L2_REF} (active: ${cur.L_REF})
LiFePos (mV): ${cur.LF1REF} ${cur.LF2REF} ${cur.LF3REF} ${cur.LF4REF}
PANELREF (mV): ${cur.PANELREF}
secs since launch: ${preamble.timestamp}
boot count: ${cur.boot_count}
memory was corrupted: ${preamble.MRAM_CPY}
secs to flash: ${cur.time_to_flash}`;
}

function sendPacketEmail(body, transmissionCuid, duplicate, server, recipients, full=false) {
  if (recipients.length == 0) {
    return;
  }

  var subject = `EQUiStation '${body.station_name}' received a ${duplicate ? "duplicate packet" : "packet!"}`;
  // build message with optional full part
  var message = getPacketInfoMessage(body);
  message = message + `\n\nfull packet: ${TRANSMISSION_ROUTE_PREFIX + transmissionCuid}`

  if (full) {
    message = message + `

raw:
${body.raw}

corrected:
${body.corrected}

parsed:
${JSON.stringify(body.transmission, null, 4)}`
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

function postToSlackWebhook(body, cuid, duplicate) {
  var stationName = body.station_name;
  var subject = stationName + (duplicate ? " received a duplicate packet" : " received a packet!");
  var message = duplicate ? "" : getPacketInfoMessage(body);
  var payload = {
    text: subject,
    attachments: [
      {
        text: message,
        actions: [
          {
            type: "button",
            text: "View Packet",
            url: TRANSMISSION_ROUTE_PREFIX + cuid
          }
        ]
      }
    ]
  };
  var clientServerOptions = {
    uri: config.SLACK_WEBHOOK_URL,
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }
  request(clientServerOptions, function (error, response) {
    if (error){console.log(chalk.red(error));}
    return;
  });
}

module.exports = router;
module.exports["timestampToCreated"] = timestampToCreated
