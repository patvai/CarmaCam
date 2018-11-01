/* eslint-disable no-underscore-dangle */

const argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const wrapper = require('./inc/db');
const mongodb = require('mongodb');
const Grid = require('gridfs-stream');
// needed for req.files
const busboyBodyParser = require('busboy-body-parser');
const bodyParser = require('body-parser');
// const smtpTransport = require('nodemailer-smtp-transport');
const nodemailer = require('nodemailer');
const moment = require('moment');
const cookieSession = require('cookie-session');

const { ObjectId } = mongodb;
const morgan = require('morgan');
const logger = require('./inc/logger');
const helmet = require('helmet');

const loginRouter = require('./routes/login');
const accountsRouter = require('./routes/accounts');
const emergencyAlertsRouter = require('./routes/emergencyAlerts');
const baddriverreportsRouter = require('./routes/baddriverreports');

//TODO: does this code have a data module? or directly read from the 

const serverPort = (argv.port) ? argv.port : 9001;
// changing "localhost" to "0.0.0.0" for AWS EC2 config
const serverIp = '0.0.0.0';

// using express for RESTful communcation
const app = express();
// HTTP request is still used hence do not use hsts now
// TODO: use hsts one day
app.use(helmet({ hsts: false }));
app.use(morgan('combined'));
app.use(busboyBodyParser());
app.use(cookieSession({
  name: 'mySession',
  keys: ['ppKey1pp'],
  // 60 minutes
  maxAge: 60 * 60 * 1000,
  httpOnly: false,
}));

// custom middleware to enable CORS
app.use((req, res, next) => {
  // origin is null if html file is opened locally
  // origin is http://localhost:port if using MAMP
  res.header('Access-Control-Allow-Origin', req.get('origin'));
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
app.use(bodyParser.json());

app.use('/', loginRouter);
app.use('/', accountsRouter);
app.use('/', emergencyAlertsRouter);
app.use('/', baddriverreportsRouter);

/*
Following are the CRUD endpoints for simple JSON data
*/
// <<<<<<< HEAD
// app.get('/ping', (req, res) => {
//   res.send('Hello BDR Team! The NEW NodeJS server is up. test test test');
// // =======
// app.get('*/ping', (req, res) => {
//   res.send('Hello BDR Team! The NEW NodeJS server is up.');
// // >>>>>>> eb8d3cf3ee610530e8300dca1ed32a8e39607151
// });


function sendMail(reporterEmail, text) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'baddriverreportin@gmail.com',
      clientId: '979953451007-im0st7trhcgkueic3m66tc1082rie9od.apps.googleusercontent.com',
      clientSecret: 'wDz0VQf339Ofxu49nFkH0H8G',
      refreshToken: '1/7AFZ4rS0vFTr06FxOMG0ad9_N8PIiMrtcMXrnD15wIw',
    },
  });

  const mailOptions = {
    from: 'baddriverreportin@gmail.com',
    to: reporterEmail,
    subject: 'Bad Driver Report uploaded',
    // eslint-disable-next-line object-shorthand
    text: text,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      logger.error(`Send email error, ${err}`);
    }
  });
}

/*
Following are the endpoints for handling large file uploads
*/
// create an endpoint for file upload
app.post('*/uploadVideo', (req, res) => {
  const metadata = JSON.parse(req.body.metadata);
  const videoClip = req.files.filefield;
  let reporterEmail;
  let reporterName;

  logger.debug('Received video.');
  // check if Account exist for given phone number
  wrapper.db.collection('account').findOne({
    phone: metadata.phoneNumber,
  }, (err, account) => {
    // if no account, then send "202" and exit
    if (err || account == null) {
      logger.error(`Account null, phone number: ${metadata.phoneNumber}`);
      res.status(202).send({
        message: 'Incorrect account or account does not exist. Upload FAIL.',
      });
    } else {
      // account exists, upload video and send emails
      reporterEmail = account.email;
      reporterName = `${account.fname} ${account.lname}`;
      try {
        const fileId = new ObjectId();
        const gfs = new Grid(wrapper.db, mongodb);
        const writeStream = gfs.createWriteStream({
          _id: fileId,
          mode: 'w',
          content_type: videoClip.mimetype,
          metadata: {
            duration: metadata.duration,
            framesPerSecond: metadata.framesPerSecond,
            isImmediateHazard: metadata.isImmediateHazard,
            locationRecorded: metadata.locationRecorded,
            sizeInMB: metadata.sizeInMB,
            speedInMPH: metadata.speedInMPH,
            timeOfRecording: metadata.timeOfRecording,
            phoneNumber: metadata.phoneNumber,
          },
        });

        writeStream.write(videoClip.data);
        writeStream.on('close', (file, error) => {
          if (error) {
            logger.error(`Error closing writeStream for video upload: ${error}`);
          }

          const msg = 'Upload Successful';

          // creating BDR report
          const report = {
            aggregateReviewScore: 0,
            capturedImage: null,
            category: null,
            date: moment().format('MM/DD/YYYY'),
            incidentDescription: null,
            licensePlateNumber: null,
            licenseState: null,
            location: metadata.locationRecorded,
            numApprovedReviews: 0,
            numRejectedReviews: 0,
            postingAccount: metadata.phoneNumber,
            // eslint-disable-next-line object-shorthand
            reporterName: reporterName,
            severity: null,
            status: 'uploaded',
            time: metadata.timeOfRecording,
            vehicleDescripton: null,
            videoClip: file._id,
          };

          // eslint-disable-next-line no-shadow
          wrapper.db.collection('baddriverreports').insertOne(report, (err, r) => {
            if (!err) {
              let text = `Hello,\n\n The Bad Driver Report is now available on: 
              http://www.carma-cam.com/post-report.html?r_id=${r.insertedId}\n\n`;

              // additional link till web UI is up
              // var videoLink = 'You can view the video here: http://ec2-35-164-242-197.us-west-2.compute.amazonaws.com:9001/downloadFile/' + file._id + '\n';

              // check if this was an Emergency ALert. Then create alert.
              if (metadata.isImmediateHazard === 1) {
                const alrt = {
                  reportedAt: new Date(),
                  location: {
                    type: 'Point',
                    coordinates: metadata.locationRecorded.split(',').map(i => parseFloat(i)),
                  },
                  report: r.insertedId,
                };

                // eslint-disable-next-line no-shadow,no-unused-vars
                wrapper.db.collection('emergencyalerts').insert(alrt, (err, r) => {
                  if (!err) {
                    text += 'It\'s reported as an emergency alerts.\n\nThank you.\n\n';
                  }
                });
              }

              sendMail(reporterEmail, text);
            }
          });

          // Creation of BDR report and sending of emails done. Send success code to Mobile App
          res.status(200).send({
            message: msg,
          });
        });
        writeStream.end();
      } catch (error) {
        logger.error(error.stack);
      }
    }
  });
});

// API or endpoint to retrieve video file and captured license plate image, using their _id
// eslint-disable-next-line consistent-return
app.get('*/downloadFile/:id', (req, res) => {
  try {
    const gfs = new Grid(wrapper.db, mongodb);
    gfs.findOne({
      _id: req.params.id,
      // eslint-disable-next-line consistent-return
    }, (err, file) => {
      logger.debug(`Received file id: ${req.param.id} for downloading files`);
      if (file == null) {
        return res.status(400).send({
          message: 'File not found',
        });
      }
      res.set('Content-Type', file.contentType);
      const readstream = gfs.createReadStream({
        // eslint-disable-next-line no-underscore-dangle
        _id: file._id,
      });
      readstream.on('error', (error) => {
        logger.error(`Error processing readStream for /downloadFile: ${error}`);
        res.end();
      });
      readstream.pipe(res);
    });
  } catch (err) {
    logger.error(`Exception thrown in /downloadFile: ${err}`);
    return res.status(400).send({ message: 'Exception encountered' });
  }
});

// endpoint for uploading captured image of license plate
app.post('*/uploadImage', (req, res) => {
  const image = req.body.file;
  const model = JSON.parse(req.body.model);
  // TODO: should put new ObjectId() inside a try block since it will throw error
  const reportId = new ObjectId(model.reportId);

  const gfs = new Grid(wrapper.db, mongodb);
  const writeStream = gfs.createWriteStream({
    mode: 'w', content_type: 'image/png',
  });

  writeStream.write(image);
  logger.debug('Captured Image uploaded to MongoDB.');
  logger.debug(`Report id: ${reportId} has been updated`);
  writeStream.on('close', (file) => {
    // update the BDR report with the capturedImage ID
    wrapper.db.collection('baddriverreports').findOne({ _id: reportId }, (err, doc) => {
      if (doc != null) {
        // eslint-disable-next-line no-underscore-dangle
        const newData = { capturedImage: file._id };
        // eslint-disable-next-line no-underscore-dangle
        const conditions = { _id: doc._id };
        wrapper.db.collection('baddriverreports').updateOne(
          conditions,
          { $set: newData },
          // eslint-disable-next-line no-shadow,no-unused-vars
          (err, result) => {
            if (err) {
              res.status(400).send({
                message: 'ERROR encountered while updating',
              });
            } else {
              res.status(200).send({
                message: 'UPDATE successful',
              });
            }
          },
        );
      } else {
        res.status(400).send({
          message: 'Report ID NOT FOUND',
        });
      }
    });
  });
  writeStream.end();
});

// This method of start is for HTTP server
const server = app.listen(serverPort, serverIp, () => {
  const { address, port } = server.address();
  logger.info(`App listening at http://${address}:${port}`);
});
