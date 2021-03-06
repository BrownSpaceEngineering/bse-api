var router = require('express').Router();
var Data = require('../../db/models/data');
var FLASH_CMP = 'FLASH CMP';

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  try {
    var query = Data.find({
    	data_type: FLASH_CMP
    });

    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        created: {
          $lte: new Date(Number(req.query.end_date))  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      query = query.where({
        created: {
          $gte: new Date(Number(req.query.start_date))  // created property is greater than that date
        }
      })
    }

    query = query.sort('+created') // ascending order

    query.exec() // Execute Query
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredPayload = {};

          fields.forEach(field => {
            filteredPayload[field] = datum.payload[field];
          })

          datum.payload = filteredPayload;
          return datum;
        })
      }

      res.json(data);
    })
    .catch(err => {
      next(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }
})

/*
  Request Query
  limit: integer, default everything
  fields: comma delimited String, default everything
*/
router.get('/latest', function (req, res, next) {
  try {
    var query = Data.find({
      data_type: FLASH_CMP
    })
    .sort('-created');

    if (req.query.limit) {
      query = query.limit(+req.query.limit) // cast to number
    }

    query.exec()
    .then(currentInfos => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        currentInfos = currentInfos.map(currentInfo => {
          // Copy over only the ones user selected

          var filteredCurrentInfo = {
            created: currentInfo.created,
            transmission_cuid: currentInfo.transmission_cuid
          };

          fields.forEach(field => {
            filteredCurrentInfo[field] = currentInfo[field];
          })

          return filteredCurrentInfo;
        })
      }

      res.json(currentInfos);
    })
    .catch(err => {
      console.error(err);
    })
  } catch (err) {
    err.status = 400;
    next(err);
  }
});


module.exports = router
