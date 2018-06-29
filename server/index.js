// Loads environment variables from our .env file
require('dotenv').config(); // defaults to .env

var chalk = require('chalk');
var path = require('path');
var express = require('express');
var app = express();

var cors = require('cors');
app.use(cors());

var bodyParser = require('body-parser');
var morgan = require('morgan');
var routes = require('./routes');

var connectDb = require('./db');

// logging middleware
app.use(morgan('tiny'));
// body parsing middleware
app.use(bodyParser.json()); // would be for AJAX requests

// Attaches routes with /equisat prefix
app.use('/equisat', routes);

// Catcher Middleware for unfound routes
app.use('/*', function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error catching middleware
app.use(function (err, req, res, next) {
  if (err.status !== 404) console.error(err.stack); // do not log 404 errors
  res.status(err.status || 500).send(err.message || 'Internal Server Error');
});

connectDb
.then(() => {
  console.log(chalk.green('Connected to MongoDB'))
  app.listen(80, function (){
    console.log(chalk.blue('Server listening on port 80'));
  });
})
.catch(err => {
  console.error(err);
});

