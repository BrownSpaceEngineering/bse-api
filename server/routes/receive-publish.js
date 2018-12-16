/** Packet publishing helpers */
var email = require('emailjs');
var request = require('request');
var Twit = require('twit');
var config = require("../../config.js");
var chalk = require('chalk');

// connect to email server
var server = email.server.connect(config.EMAIL_CONFIG);

// twitter posting setup
var T = new Twit(config.TWIT_CONFIG);

TRANSMISSION_ROUTE_PREFIX = "http://api.brownspace.org/equisat/transmissions/"

/* publishes a received transmission to email and webhooks */
function publishTransmission(body, transmissionCuid, duplicate=false) {
  // post to slack
  // postToSlackWebhook(body, transmissionCuid, duplicate);

  // sent Tweet
  if (!duplicate) {
    postTweet(body);
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

function postTweet(body) {
  var tweet = getTweetMessage(body);
  console.log(tweet);
  T.post('statuses/update', { status: tweet }, function(err, data, response) {
    if (err) {
      console.log(chalk.red(`error posting tweet: ${err}`));
      console.log(chalk.red(response));
    }
  });
}

function getTweetMessage(body) {
  var preamble = body.transmission.preamble;
  var cur = body.transmission.current_info;
  var flashInfo = cur.time_to_flash == 255 ? "not flashing" : cur.time_to_flash + "s to next flash";
  var lionInfo = `${lionVoltageToPercentage(cur.L1_REF/1000.0)}% ${lionVoltageToPercentage(cur.L2_REF/1000.0)}% (${cur.L1_TEMP}°C ${cur.L2_TEMP}°C)`;
  var lifepoInfo = `${lifepo4VoltageToPercentage(cur.LF1REF/1000.0)}% ${lifepo4VoltageToPercentage(cur.LF2REF/1000.0)}% ${lifepo4VoltageToPercentage(cur.LF3REF/1000.0)}% ${lifepo4VoltageToPercentage(cur.LF4REF/1000.0)}%`;
  var sunInfo = cur.PANELREF > 5500 ? "in sunlight" : "in darkness";

  // Example:
  // EQUiSat update: in IDLE FLASH mode | 30s to next flash | LiOn batteries: 81% 82% (23°C 25°C) | LiFePO batteries: 90% 50% 87% 90% | in sunlight | 23 reboots | equisat.brownspace.org/data
  return `EQUiSat update: in ${preamble.satellite_state} mode \
| ${flashInfo} \
| LiOn batteries: ${lionInfo} \
| LiFePO batteries: ${lifepoInfo} \
| ${sunInfo} \
| ${cur.boot_count} reboots \
| equisat.brownspace.org/data`;
}

// voltage to percent converters
// copied from https://github.com/BrownSpaceEngineering/mobile-app/blob/25f4fbae006a2210017bd7e0fdcd8cd2a64a5e01/src/BatteryCircle.js#L54

function lionVoltageToPercentage(voltage) {
  //piecewise curve fit
  var percentage = 0.;
  if (voltage >= 3.986) {
    percentage = 495918.838867187*Math.pow(voltage, 6) - 12131731.9612119*Math.pow(voltage, 5) + 123643244.339164*Math.pow(voltage, 4) - 671989441.456614*Math.pow(voltage, 3) + 2054101328.6697*Math.pow(voltage, 2) - 3348296376.10735*voltage + 2273828011.07252;
  } else if (voltage < 3.986 && voltage >= 3.5985) {
    percentage = 14248.3732614517*Math.pow(voltage, 5) - 273888.006152098*Math.pow(voltage, 4) + 2105903.52769594*Math.pow(voltage, 3) - 8096118.96287537*Math.pow(voltage, 2) + 15563096.2967489*voltage - 11967212.7013982;
  } else if (voltage < 3.5985 && voltage >= 2.8) {
    percentage = 2942.12034556269*Math.pow(voltage, 5) - 48558.2340786669*Math.pow(voltage, 4) + 320492.380456582*Math.pow(voltage, 3) - 1057284.439237*Math.pow(voltage, 2) + 1743212.13657029*voltage - 1149073.13151426;
  } else {
    percentage = 0;
  }
  if (percentage < 0) {
    percentage = 0;
  }
  if (percentage > 100) {
    percentage = 100;
  }
  percentage = Math.round(percentage);
  return percentage;
}

function lifepo4VoltageToPercentage(voltage) {
  //piecewise curve fit
  var percentage = 0.;
  if (voltage >= 3.299) {
    percentage = 7481.35161972045*Math.pow(voltage, 5) - 129698.307311745*Math.pow(voltage, 4) + 899320.30659425*Math.pow(voltage, 3) - 3117698.8919505*Math.pow(voltage, 2) + 5403781.60634651*voltage - 3746176.3794266;
  } else if (voltage < 3.299 && voltage >= 3.168625) {
    percentage = -5538027.91287231*Math.pow(voltage, 5) + 89768047.5291653*Math.pow(voltage, 4) - 582052268.16249*Math.pow(voltage, 3) + 1887056369.17257*Math.pow(voltage, 2) - 3059070288.85044*voltage + 1983648268.20567;
  } else if (voltage < 3.168625 && voltage >= 2.4) {
    percentage = 9361.00030899047*Math.pow(voltage, 6) - 155484.297233582*Math.pow(voltage, 5) + 1074915.58123016*Math.pow(voltage, 4) - 3958921.17254791*Math.pow(voltage, 3) + 8192152.17593754*Math.pow(voltage, 2) - 9030097.66266999*voltage + 4142159.89895692;
  } else {
    percentage = 0;
  }
  if (percentage < 0) {
    percentage = 0;
  }
  if (percentage > 100) {
    percentage = 100;
  }
  percentage = Math.round(percentage);
  return percentage;
}

module.exports = publishTransmission;
