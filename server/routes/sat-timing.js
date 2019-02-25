
/** config ***/
// see here: https://docs.google.com/spreadsheets/d/13SVh82FDTeVK_eZtC0jzgTHDbhu1vs8-Ng0xXUJIyNE/edit#gid=1271394227
SATELLITE_FIRST_BOOT_DATE_UTC = new Date("7/13/2018 14:20:30 UTC");
SATELLITE_CLOCK_SPEED_FACTOR = 1.00645417105269000 // real sec / satellite sec (sat is slow)

// satellite clock jump-aheads due to buggy timestamp wraparound logic
/* to find these:
  0) Use this sheet https://docs.google.com/spreadsheets/d/13SVh82FDTeVK_eZtC0jzgTHDbhu1vs8-Ng0xXUJIyNE/edit#gid=1407150828
  1) find the sat timestamp right before the jump occured
  2) subtract the timestamp right after the jump from the timestamp right
  before the jump to get an estimate of the jump duration
  3) looking at the actual timestamps corresponding to these two timestamps,
  find the actual time difference between these two timestamps (in seconds)
  4) subtract the delta from #3 from the delta from #2 to get the actual
  duration of the jump (corrected for the actual time betwen the timestamps we read)

  NOTE: if there are multiple timestamps surrounding the jump, take the largest
  of the smaller and the smallest of the larger (we want to get as close as possible
  to the actual jump point)
*/
SATELLITE_TIME_JUMPS = [
  {
    "timestamp": 2168614, // secs since launch
    "amount": 8954537.50 // sec length of jump
  },
  {
    "timestamp": 11419288,
    "amount": 2558023.87
  },
  {
    "timestamp": 14395992,
    "amount": 4220240.67
  },
  {
    "timestamp": 19410671,
    "amount": 3432417.53
  },
  {
    "timestamp": 23344593,
    "amount": 4093181.34
  },
  {
    "timestamp": 27757912,
    "amount": 3792258.16
  },
  {
    "timestamp": 40270434,
    "amount": 2177046.66
  },
  { // use another one to fudge the latest values to be correct
    "timestamp": 40270434,
    "amount": 100117.25
  },
]

/* generates a received date object from a satellite timestamp,
based on the 0-date specified above and known sat clock time jumps */
function timestampToCreated(timestamp_s, added) {
  // packet_timestamp_s unused right now

  // compute the total jump aheads from the normal linear trend up to this timestamp
  total_jump_ahead_s = 0
  for (let i = 0; i < SATELLITE_TIME_JUMPS.length; i++) {
    jmp = SATELLITE_TIME_JUMPS[i];
    if (timestamp_s > jmp["timestamp"]) {
      total_jump_ahead_s += jmp["amount"];
    } else {
      break;
    }
  }

  newCreated = new Date(
    SATELLITE_FIRST_BOOT_DATE_UTC.getTime()
    + SATELLITE_CLOCK_SPEED_FACTOR*timestamp_s*1000
    - total_jump_ahead_s*1000
  )
  // convert from automatic local date to UTC date
  newCreated.setTime(newCreated.getTime() + newCreated.getTimezoneOffset()*60*1000)

  if (newCreated.getTime() > added) {
    console.log("WARNING: calculated created timestamp was after added timestamp");
    newCreated = new Date(added);
  }
  return newCreated;
}

/* computes real created time from timestamp relative to known _packet_ timestamp real-time correspondence
used for timestamps in packet data/error fields */
function timestampToCreatedRelative(timestamp_s, packet_created, packet_timestamp_s) {
  // packet_timestamp_s unused right now
  sat_delta_s = packet_timestamp_s - timestamp_s
  newCreated = new Date(packet_created.getTime() - SATELLITE_CLOCK_SPEED_FACTOR*sat_delta_s*1000)

  // don't update to newCreated if greater than packet timestamp, just used packet time
  if (newCreated.getTime() > packet_created) {
    console.log("WARNING: calculated timestamp was after packet creation timestamp");
    newCreated = packet_created;
  }
  return newCreated;
}

module.exports["timestampToCreated"] = timestampToCreated;
module.exports["timestampToCreatedRelative"] = timestampToCreatedRelative;
