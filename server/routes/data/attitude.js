var router = require('express').Router();
var Data = require('../../db/models/data');

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  var ATTITUDE = 'ATTITUDE';
  try {
    var query = Data.find({
    	data_type: ATTITUDE
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


module.exports = router
