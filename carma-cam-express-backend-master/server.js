/* eslint-disable no-underscore-dangle */

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const logger = require('./inc/logger');
const helmet = require('helmet');

const loginRouter = require('./routes/login');
const videoTrimmerRouter = require('./routes/videoTrimmer');


const serverPort = 9001;
const app = express();

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + serverPort + '/api');
  });



