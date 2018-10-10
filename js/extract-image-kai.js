var dataURL;

function draw(video, thecanvas) {
    thecanvas.width = video.videoWidth;
    thecanvas.height = video.videoHeight;
    // get the canvas context for drawing
    var context = thecanvas.getContext('2d');

    // draw the video contents into the canvas x, y, width, height
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // get the image data from the canvas object
    dataURL = thecanvas.toDataURL('image/png');

    // clear the canvas
    context.clearRect(0, 0, video.videoWidth, video.videoHeight);

    var scope = angular.element(document.getElementById('mycontroller')).scope();
    scope.$apply(function () {
        scope.updateImage(dataURL);
    });
}


// initialize controller
var app = angular.module('app', ['ngImgCrop', 'rzModule']);
app.controller('Ctrl', function ($scope, $sce, $http) {
    // const backendUrl = 'https://carma-cam-test-backend.yj83leetest.space/9010';
    const backendUrl = 'https://cloudserver.carma-cam.com';

    $scope.myCroppedImage = '';
    $scope.updateImage = function (dataURL) {
        $scope.myImage = dataURL;
    };

    var current_img = new Image();

    $scope.getVideo = function () {
        const videoId = window.location.search.split('&')[0].split('=')[1];
        $scope.reportId = window.location.search.split('&')[1].split('=')[1];
        var vid = document.getElementById('video');
        vid.src = backendUrl + '/downloadFile/' + videoId;
    };

    $scope.back = () => {
        const [videoData, reportData, accountData] = window.location.search.split('&');
        const [, videoId] = videoData.split('=');
        const [, reportId] = reportData.split('=');
        const [, accountId] = accountData.split('=');
        window.location = `post-report.html?reportId=${reportId}&accountId=${accountId}`;
    };

    var redraw_canvas = function () {
        var canvas = document.getElementById("my_canvas");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(current_img, 0, 0, canvas.width, canvas.height);
        Caman("#my_canvas", function () {
            this.reloadCanvasData();
            this.render();
        });
    }

    // handle image cropping.
    $scope.handle_crop = function ($dataURI) {
        // reset slider values
        $scope.brightness_slider.value = 0;
        $scope.contrast_slider.value = 0;
        $scope.exposure_slider.value = 0;
        // reset image sources
        current_img = new Image();
        current_img.src = $dataURI;
        current_img.onload = function () {
            // redraw and reload the canvas data
            redraw_canvas();
            console.log("new img updated, image_raw updated");
        };
    }

    // brightness slider
    $scope.brightness_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function (value) {
                if (value <= -50) {
                    return 'red';
                }
                if (value <= 0) {
                    return 'yellow';
                }
                if (value <= 50) {
                    return 'orange';
                }
                return '#2AE02A';
            },
            onEnd: function () {
                // set to original image then apply new filter
                redraw_canvas();
                Caman("#my_canvas", function () {
                    this.brightness($scope.brightness_slider.value);
                    this.contrast($scope.contrast_slider.value);
                    this.exposure($scope.exposure_slider.value);
                    this.render(function () {
                        console.log("set image brightness to: " + $scope.brightness_slider.value);
                    });
                });
            }
        }
    }

    // contrast slider
    $scope.contrast_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function (value) {
                if (value <= -50) {
                    return 'red';
                }
                if (value <= 0) {
                    return 'yellow';
                }
                if (value <= 50) {
                    return 'orange';
                }
                return '#2AE02A';
            },
            onEnd: function () {
                // set to original image then apply new filter
                redraw_canvas();
                Caman("#my_canvas", function () {
                    this.brightness($scope.brightness_slider.value);
                    this.contrast($scope.contrast_slider.value);
                    this.exposure($scope.exposure_slider.value);
                    this.render(function () {
                        console.log("set image contrast to: " + $scope.contrast_slider.value);
                    });
                });
            }
        }
    }

    // exposure slider
    $scope.exposure_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function (value) {
                if (value <= -50) {
                    return 'red';
                }
                if (value <= 0) {
                    return 'yellow';
                }
                if (value <= 50) {
                    return 'orange';
                }
                return '#2AE02A';
            },
            onEnd: function (value) {
                // set to original image then apply new filter
                redraw_canvas();
                Caman("#my_canvas", function () {
                    this.brightness($scope.brightness_slider.value);
                    this.contrast($scope.contrast_slider.value);
                    this.exposure($scope.exposure_slider.value);
                    this.render(function () {
                        console.log("set image exposure to: " + $scope.exposure_slider.value);
                    });
                });
            }
        }
    }

    // reset function and redraw canvas data
    $scope.reset_config = function () {
        $scope.brightness_slider.value = 0;
        $scope.contrast_slider.value = 0;
        $scope.exposure_slider.value = 0;
        // redraw canvas data
        redraw_canvas();
    }

    $scope.uploadImage = function () {
        // add check here to decide if image to be sent to report collection or alerts collection,
        // when emergency alerts are enabled
        // change to use actual saved image
        var upload_canvas = document.getElementById("my_canvas");
        var upload_context = upload_canvas.getContext("2d");
        var upload_img = new Image();
        upload_img = upload_canvas.toDataURL("image/png");

        console.log("check data url: " + upload_img);
        // Error: 'click' called on an object that does not implement interface HTMLElement.
        var data = $.param({
            filefield: upload_img,
            reportId: window.location.search.split('&')[1].split('=')[1],
        });

        var config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        $scope.model = {
            reportId: window.location.search.split('&')[1].split('=')[1],
        };

        $http({
            method: 'POST',
            url: backendUrl + '/uploadImage',
            headers: { 'Content-type': undefined },
            transformRequest: function (data) {
                var formdata = new FormData();
                formdata.append('model', angular.toJson(data.model));
                formdata.append('file', data.files);
                return formdata;
            },
            data: { model: $scope.model, files: upload_img },
        }).success(function (data, status, header, config) {
            // .html?videoId=xxx&reportId=xxx&accountId=xxx
            const [videoData, reportData, accountData] = window.location.search.split('&');
            const [, videoId] = videoData.split('=');
            const [, reportId] = reportData.split('=');
            const [, accountId] = accountData.split('=');
            console.log('move!');
            // if upload success, auto goes to post-report.html (go back)
            window.location = `post-report.html?reportId=${reportId}&accountId=${accountId}`;
        }).error(function (data, status, header, config) {
            bootbox.alert('Error!' + data);
        });
    };

});

window.onload = function () {
    // var video = document.getElementById('video');
    var thecanvas = document.getElementById('thecanvas');

    $('#capture').on('click', function () {
        draw(video, thecanvas);
    });
};
