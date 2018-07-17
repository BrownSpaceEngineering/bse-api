var router = require('express').Router();
var CurrentInfo = require('../db/models/currentInfo');

/*
  Req Query has the following possible parameters
  end_date: Date, default None
  start_date: Date, default None
  fields: comma delimited String, default everything
*/
router.get('/', function (req, res, next) {
  try {
    var query = CurrentInfo.find();

    // Check if end date property exists
    if (req.query.end_date) {
      query = query.where({
        recorded: {
          $lte: new Date(Number(req.query.end_date))  // created property is less than that date
        }
      })
    }

    // Check if start date property exists
    if (req.query.start_date) {
      query = query.where({
        recorded: {
          $gte: new Date(Number(req.query.start_date))  // created property is greater than that date
        }
      })
    }

    query = query.sort('+recorded') // ascending order


    query.exec() // Execute Query
    .then(currentInfos => {
      // Filter for only selected fields
      if (req.query.fields) {
        var fields = req.query.fields.split(',');

        currentInfos = currentInfos.map(currentInfo => {
          // Copy over only the ones user selected

          var filteredCurrentInfo = {
            created: currentInfo.created,
            recorded: currentInfo.recorded,
            timestamp: currentInfo.timestamp,
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
    var query = CurrentInfo.find().sort('-recorded');

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
            recorded: currentInfo.recorded,
            timestamp: currentInfo.timestamp,
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

router.get('/:transmissionCuid', function (req, res, next) {
  try {
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
  } catch (err) {
    err.status = 400;
    next(err);
  }

})

module.exports = router;
