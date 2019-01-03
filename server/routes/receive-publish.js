/** Packet publishing helpers */
var email = require('emailjs');
var request = require('request');
var Twit = require('twit');
var config = require("../../config.js");
var chalk = require('chalk');

// connect to email server
var server = email.server.connect(config.EMAIL_CONFIG);

// twitter posting setup
if (config.TWIT_CONFIG == null) {
  var T = null;
} else {
  var T = new Twit(config.TWIT_CONFIG);
}

TRANSMISSION_ROUTE_PREFIX = "http://api.brownspace.org/equisat/transmissions/"

/* publishes a received transmission to email and webhooks */
function publishTransmission(body, transmission, storedTransmission, postPublicly=true, duplicate=false) {
  // post to slack
  postToSlackWebhook(body, transmission, storedTransmission, duplicate);

  // sent Tweet if posting publicly (default to yes)
  if (!duplicate && (postPublicly === undefined || postPublicly)) {
    postTweet(body, transmission, storedTransmission);
  }

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
    sendPacketEmail(body, transmission, storedTransmission, duplicate, server, digest_recipients, full=false);
    sendPacketEmail(body, transmission, storedTransmission, duplicate, server, full_recipients, full=true);
  } else {
    console.log(chalk.red("didn't send email on packet becuase no recipients or no email config specified"));
  }
}

function dateStr(dt) {
  res = dt.toISOString();
  res = res.substring(0, 16)
  res = res.replace("T", " ")
  return res + " UTC"
  // var yr = String(dt.getUTCFullYear()).substring(2);
  // return `${dt.getUTCMonth()+1}/${dt.getUTCDate()}/${yr} ${dt.getUTCHours()}:${dt.getUTCMinutes()} UTC`
  // return dt.toLocaleString('en-US', { timeZone: 'UTC' }) + " UTC";
}

function getPacketInfoMessage(body, transmission, storedTransmission) {
  var preamble = transmission.preamble;
  var cur = transmission.current_info;
  return `\
satellite state: ${preamble.satellite_state}
message type: ${preamble.message_type}
Li-ions (mV): ${cur.L1_REF} ${cur.L2_REF} (active: ${cur.L_REF})
LiFePO4 banks (mV): ${cur.LF1REF + cur.LF2REF} ${cur.LF3REF + cur.LF4REF}
PANELREF (mV): ${cur.PANELREF}
LiFePO4 cells (mV): ${cur.LF1REF} ${cur.LF2REF} ${cur.LF3REF} ${cur.LF4REF}
secs since launch: ${preamble.timestamp}
RX time: ${dateStr(storedTransmission.added)}
boot count: ${cur.boot_count}
memory was corrupted: ${preamble.MRAM_CPY}
secs to flash: ${cur.time_to_flash}`;
}

function sendPacketEmail(body, transmission, storedTransmission, duplicate, server, recipients, full=false) {
  if (recipients.length == 0) {
    return;
  }

  var subject = `EQUiStation '${body.station_name}' received a ${duplicate ? "duplicate packet" : "packet!"}`;
  // build message with optional full part
  var message = getPacketInfoMessage(body, transmission, storedTransmission);
  message = message + `\n\nfull packet: ${TRANSMISSION_ROUTE_PREFIX + storedTransmission.cuid}`

  if (full) {
    message = message + `

raw:
${body.raw}

corrected:
${body.corrected}

parsed:
${JSON.stringify(transmission, null, 4)}`
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

function postToSlackWebhook(body, transmission, storedTransmission, duplicate) {
  var stationName = body.station_name;
  var subject = stationName + (duplicate ? " received a duplicate packet" : " received a packet!");
  var message = duplicate ? "" : getPacketInfoMessage(body, transmission, storedTransmission);
  var payload = {
    text: subject,
    attachments: [
      {
        text: message,
        actions: [
          {
            type: "button",
            text: "View Packet",
            url: TRANSMISSION_ROUTE_PREFIX + storedTransmission.cuid
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

function postTweet(body, transmission, storedTransmission) {
  var tweet = getTweetMessage(body, transmission, storedTransmission);
  console.log(tweet);
  if (T !== null) {
    console.log(chalk.blue("Posting tweet"));
    T.post('statuses/update', { status: tweet }, function(err, data, response) {
       if (err) {
         console.log(chalk.red(`error posting tweet: ${err}`));
         console.log(chalk.red(response));
       }
     });
  }
}

var MAX_STATION_NAME_LEN = 30;
var EXPECTED_TIME_TO_API_S = 2;

function getTweetMessage(body, transmission, storedTransmission) {
  var preamble = transmission.preamble;
  var cur = transmission.current_info;
  var stationName = body.station_name.length < MAX_STATION_NAME_LEN ? body.station_name : body.station_name.slice(0, MAX_STATION_NAME_LEN);
  var flashInfo = cur.time_to_flash == 255 ? "not flashing" : `FLASHING in ${cur.time_to_flash-EXPECTED_TIME_TO_API_S}s`;
  var l1ref = (cur.L1_REF/1000.0).toFixed(2);
  var l2ref = (cur.L2_REF/1000.0).toFixed(2);
  var lionInfo = `${l1ref}V ${l2ref}V (${cur.L1_TEMP}°C ${cur.L2_TEMP}°C)`;
  var lf1ref = cur.LF1REF/1000.0;
  var lf2ref = cur.LF2REF/1000.0;
  var lf3ref = cur.LF3REF/1000.0;
  var lf4ref = cur.LF4REF/1000.0;
  var lifepoInfo = `${(lf1ref + lf2ref).toFixed(2)}V ${(lf3ref + lf4ref).toFixed(2)}V`;
  var sunInfo = cur.PANELREF > 5500 ? "in sunlight" : "in darkness";

  // Example:
  // EQUiSat update from Test Computer: in IDLE FLASH mode | FLASHING in 17s | Li-ion batteries: 4.06V 4.17V (-103°C -103°C) | LiFePO4 banks: 6.47V 6.42V | in sunlight | 2 reboots | rx time: 2019-01-03 02:34 UTC | equisat.brownspace.org/data
  return `EQUiSat update from ${stationName}: in ${preamble.satellite_state} mode \
| ${flashInfo} \
| Li-ion batteries: ${lionInfo} \
| LiFePO4 banks: ${lifepoInfo} \
| ${sunInfo} \
| ${cur.boot_count} reboots \
| RX time: ${dateStr(storedTransmission.added)} \
| equisat.brownspace.org/data`;
}

module.exports = publishTransmission;
