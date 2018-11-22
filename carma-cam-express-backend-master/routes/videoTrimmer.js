const ffmpeg = require("fluent-ffmpeg");
const express = require('express');
const mongodb = require('mongodb');
const router = express.Router();

   
// ffmpeg('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testVideo.mp4')
//     .setStartTime(0)
//     .setDuration(10)
//     .output('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/')
//     .on('start', function() {   
//         console.log('conversion start');
        
//     })
//     .on('end', function(err) {   
//         if(!err)
//         {
//           console.log('conversion Done');
//         }                 

//     })
//     .on('error', function(err){
//         console.log('error323: ', +err.message);

//     }).run();

router.post('*/videoTrimmer', (req, res) => {
      ffmpeg('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testVideo.mp4')
      .setStartTime(0)
      .setDuration(10)
      .save('/Users/akankshapriya/eclipse-workspace/carmacam/CarmaCam/src/img/testabc.mp4')
      .on('start', function() {
          console.log('start : ');
      })
      .on('progress', function() {
          console.log('In Progress !!' + Date());
      })
      .on('end', function() {
          console.log("downlaod resolved");
          //return resolve(params.clippedFile);

      })
      .on('error', function(err) {
          console.log("reject"+err);
          //return reject(err);
      });
    
    
  });


module.exports = ffmpeg;