var router = require('express').Router();
var Data = require('../../db/models/data');
var FLASH_BURST = 'FLASH_BURST';

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  try {
    var query = Data.find({
      data_type: FLASH_BURST
    });

    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        created: {
          $lte: new Date(req.query.end_date)  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      query = query.where({
        created: {
          $gte: new Date(req.query.start_date)  // created property is greater than that date
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

          var filteredBurst = [];
          burst = datum.payload.burst
          for(i = 0; i < burst.length; i++) {
            filteredMap = {}
            // For each field
            fields.forEach(field => {
              filteredMap[field] = burst[i][field]
            })
            filteredBurst.push(filteredMap)
          }

          datum.payload.burst = filteredBurst;
          return datum
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
});

/*
  Request Query
  limit: integer, default everything
  fields: comma delimited String, default everything
*/
router.get('/latest', function (req, res, next) {
  try {
    var query = Data.find({
      data_type: FLASH_BURST
    })
    .sort('-created');

    if (req.query.limit) {
      query = query.limit(+req.query.limit) // cast to number
    }

    query.exec()
    .then(data => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        data = data.map(datum => {
          // Copy over only the ones user selected

          var filteredBurst = [];
          burst = datum.payload.burst
          for(i = 0; i < burst.length; i++) {
            filteredMap = {}
            // For each field
            fields.forEach(field => {
              filteredMap[field] = burst[i][field]
            })
            filteredBurst.push(filteredMap)
          }

          datum.payload.burst = filteredBurst;
          return datum
        })
      }
      res.json(data);
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
