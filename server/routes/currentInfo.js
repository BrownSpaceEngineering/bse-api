var router = require('express').Router();
var CurrentInfo = require('../db/models/currentInfo');

/*
  Req Query has the following possible parameters
  limit: integer, default everything
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  try {
    var query = CurrentInfo.find();

    // Check if limit property exists
    if (req.query.limit) query = query.limit(+req.query.limit) // cast to number

    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        created: {
          $lte: new Date(req.query.end_date)  // created property is less than that date
        }
      })
    }

    // Check if end date property exists
    if (req.query.start_date) {
      query = query.where({
        created: {
          $gte: new Date(req.query.start_date)  // created property is greater than that date
        }
      })
    }


    query.exec() // Execute Query
    .then(currentInfos => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        currentInfos = currentInfos.map(currentInfo => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = currentInfo.payload[field];
          })

          currentInfo.payload = filteredPayload;
          return currentInfo;
        })
      }

      res.json(currentInfos);
    })
    .catch(err => {
      next(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }
})

router.get('/:transmissionCuid', function (req, res, next) {
  var transmissionCuid = req.params.transmissionCuid;

  CurrentInfo.findOne({
    transmission_cuid: transmissionCuid
  }).then(currentInfo => {
    if (currentInfo) {
      res.json(currentInfo);
    } else {
      res.status(400).send('Current Info not found');
    }
  })
  .catch(err => {
    next(err);
  })
})

module.exports = router;
