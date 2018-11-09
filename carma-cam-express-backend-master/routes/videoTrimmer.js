const ffmpeg = require("fluent-ffmpeg");


ffmpeg('../../src/img/testvideo.mp4')
    .setStartTime('0')
    .setDuration('10')
    .output('../../src/img/testvideo121212.mp4')

    .on('end', function(err) {   
        if(!err)
        {
          console.log('conversion Done');
        }                 

    })
    .on('error', function(err){
        console.log('error: ', +err);

    }).run();


// const conv = new ffmpeg({ source: "../../src/img/testvideo.mp4" });
// conv
// .setStartTime(2) //Can be in "HH:MM:SS" format also
// .setDuration(10) 
// .on("start", function() {
//     console.log("Spawned FFmpeg with command: ");
// })
// .on("error", function(err) {
//     console.log("error: ", +err);
// })
// .on("end", function(err) {
//     if (!err) {
//         console.log("conversion Done");
//     }
// })
// .saveToFile("outputpath");