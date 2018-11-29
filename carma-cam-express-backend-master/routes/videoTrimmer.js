const ffmpeg = require("fluent-ffmpeg");
const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();


// ffmpeg('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testVideo.mp4')
//       .setStartTime(0)
//       .setDuration(10)
//       .save('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testabc.mp4')
//       .on('start', function() {
//           console.log('start : ');
//       })
//       .on('progress', function() {
//           console.log('In Progress !!' + Date());
//       })
//       .on('end', function() {
//           console.log("downlaod resolved");
//           //res.send({ result: 'success' });

//       })
//       .on('error', function(err) {
//           console.log("reject"+err);
//           //return reject(err);
//       });


router.post('*/videoTrimmer', (req, res) => {
    var start = parseInt(req.body.start);
    //console.log(start);
      ffmpeg('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testVideo.mp4')
      .setStartTime('00:00:01')
      .setDuration('00:00:02')
    //   .setStartTime(parseInt(req.body.start))
    //   .setDuration(parseInt(req.body.start))
      .save('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testabc.mp4')
      .on('start', function() {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
          console.log('start : '+parseInt(req.body.start));
      })
      .on('progress', function() {
          console.log('In Progress !!' + Date()+ parseInt(req.body.end));
      })
      .on('end', function() {
          console.log("download resolved");
          res.send({ result: 'success' });

      })
      .on('error', function(err) {
          console.log("reject"+err);
          res.send({ result: 'error' });
      });
    
    
  });


module.exports = router;