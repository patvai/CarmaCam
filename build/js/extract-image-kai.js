'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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
    var backendUrl = 'https://cloudserver.carma-cam.com';

    $scope.myCroppedImage = '';
    $scope.updateImage = function (dataURL) {
        $scope.myImage = dataURL;
    };

    var current_img = new Image();

    $scope.getVideo = function () {
        var videoId = window.location.search.split('&')[0].split('=')[1];
        $scope.reportId = window.location.search.split('&')[1].split('=')[1];
        var vid = document.getElementById('video');
        vid.src = backendUrl + '/downloadFile/' + videoId;
    };

    $scope.back = function () {
        var _window$location$sear = window.location.search.split('&'),
            _window$location$sear2 = _slicedToArray(_window$location$sear, 3),
            videoData = _window$location$sear2[0],
            reportData = _window$location$sear2[1],
            accountData = _window$location$sear2[2];

        var _videoData$split = videoData.split('='),
            _videoData$split2 = _slicedToArray(_videoData$split, 2),
            videoId = _videoData$split2[1];

        var _reportData$split = reportData.split('='),
            _reportData$split2 = _slicedToArray(_reportData$split, 2),
            reportId = _reportData$split2[1];

        var _accountData$split = accountData.split('='),
            _accountData$split2 = _slicedToArray(_accountData$split, 2),
            accountId = _accountData$split2[1];

        window.location = 'post-report.html?reportId=' + reportId + '&accountId=' + accountId;
    };

    var redraw_canvas = function redraw_canvas() {
        var canvas = document.getElementById("my_canvas");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(current_img, 0, 0, canvas.width, canvas.height);
        Caman("#my_canvas", function () {
            this.reloadCanvasData();
            this.render();
        });
    };

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
    };

    // brightness slider
    $scope.brightness_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function getSelectionBarColor(value) {
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
            onEnd: function onEnd() {
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

        // contrast slider
    };$scope.contrast_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function getSelectionBarColor(value) {
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
            onEnd: function onEnd() {
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

        // exposure slider
    };$scope.exposure_slider = {
        value: 0,
        options: {
            floor: -100,
            ceil: 100,
            showSelectionBar: true,
            getSelectionBarColor: function getSelectionBarColor(value) {
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
            onEnd: function onEnd(value) {
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

        // reset function and redraw canvas data
    };$scope.reset_config = function () {
        $scope.brightness_slider.value = 0;
        $scope.contrast_slider.value = 0;
        $scope.exposure_slider.value = 0;
        // redraw canvas data
        redraw_canvas();
    };

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
            reportId: window.location.search.split('&')[1].split('=')[1]
        });

        var config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        $scope.model = {
            reportId: window.location.search.split('&')[1].split('=')[1]
        };

        $http({
            method: 'POST',
            url: backendUrl + '/uploadImage',
            headers: { 'Content-type': undefined },
            transformRequest: function transformRequest(data) {
                var formdata = new FormData();
                formdata.append('model', angular.toJson(data.model));
                formdata.append('file', data.files);
                return formdata;
            },
            data: { model: $scope.model, files: upload_img }
        }).success(function (data, status, header, config) {
            // .html?videoId=xxx&reportId=xxx&accountId=xxx
            var _window$location$sear3 = window.location.search.split('&'),
                _window$location$sear4 = _slicedToArray(_window$location$sear3, 3),
                videoData = _window$location$sear4[0],
                reportData = _window$location$sear4[1],
                accountData = _window$location$sear4[2];

            var _videoData$split3 = videoData.split('='),
                _videoData$split4 = _slicedToArray(_videoData$split3, 2),
                videoId = _videoData$split4[1];

            var _reportData$split3 = reportData.split('='),
                _reportData$split4 = _slicedToArray(_reportData$split3, 2),
                reportId = _reportData$split4[1];

            var _accountData$split3 = accountData.split('='),
                _accountData$split4 = _slicedToArray(_accountData$split3, 2),
                accountId = _accountData$split4[1];

            console.log('move!');
            // if upload success, auto goes to post-report.html (go back)
            window.location = 'post-report.html?reportId=' + reportId + '&accountId=' + accountId;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV4dHJhY3QtaW1hZ2Uta2FpLmpzIl0sIm5hbWVzIjpbImRhdGFVUkwiLCJkcmF3IiwidmlkZW8iLCJ0aGVjYW52YXMiLCJ3aWR0aCIsInZpZGVvV2lkdGgiLCJoZWlnaHQiLCJ2aWRlb0hlaWdodCIsImNvbnRleHQiLCJnZXRDb250ZXh0IiwiZHJhd0ltYWdlIiwidG9EYXRhVVJMIiwiY2xlYXJSZWN0Iiwic2NvcGUiLCJhbmd1bGFyIiwiZWxlbWVudCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCIkYXBwbHkiLCJ1cGRhdGVJbWFnZSIsImFwcCIsIm1vZHVsZSIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCIkc2NlIiwiJGh0dHAiLCJiYWNrZW5kVXJsIiwibXlDcm9wcGVkSW1hZ2UiLCJteUltYWdlIiwiY3VycmVudF9pbWciLCJJbWFnZSIsImdldFZpZGVvIiwidmlkZW9JZCIsIndpbmRvdyIsImxvY2F0aW9uIiwic2VhcmNoIiwic3BsaXQiLCJyZXBvcnRJZCIsInZpZCIsInNyYyIsImJhY2siLCJ2aWRlb0RhdGEiLCJyZXBvcnREYXRhIiwiYWNjb3VudERhdGEiLCJhY2NvdW50SWQiLCJyZWRyYXdfY2FudmFzIiwiY2FudmFzIiwiQ2FtYW4iLCJyZWxvYWRDYW52YXNEYXRhIiwicmVuZGVyIiwiaGFuZGxlX2Nyb3AiLCIkZGF0YVVSSSIsImJyaWdodG5lc3Nfc2xpZGVyIiwidmFsdWUiLCJjb250cmFzdF9zbGlkZXIiLCJleHBvc3VyZV9zbGlkZXIiLCJvbmxvYWQiLCJjb25zb2xlIiwibG9nIiwib3B0aW9ucyIsImZsb29yIiwiY2VpbCIsInNob3dTZWxlY3Rpb25CYXIiLCJnZXRTZWxlY3Rpb25CYXJDb2xvciIsIm9uRW5kIiwiYnJpZ2h0bmVzcyIsImNvbnRyYXN0IiwiZXhwb3N1cmUiLCJyZXNldF9jb25maWciLCJ1cGxvYWRJbWFnZSIsInVwbG9hZF9jYW52YXMiLCJ1cGxvYWRfY29udGV4dCIsInVwbG9hZF9pbWciLCJkYXRhIiwiJCIsInBhcmFtIiwiZmlsZWZpZWxkIiwiY29uZmlnIiwiaGVhZGVycyIsIm1vZGVsIiwibWV0aG9kIiwidXJsIiwidW5kZWZpbmVkIiwidHJhbnNmb3JtUmVxdWVzdCIsImZvcm1kYXRhIiwiRm9ybURhdGEiLCJhcHBlbmQiLCJ0b0pzb24iLCJmaWxlcyIsInN1Y2Nlc3MiLCJzdGF0dXMiLCJoZWFkZXIiLCJlcnJvciIsImJvb3Rib3giLCJhbGVydCIsIm9uIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUEsSUFBSUEsT0FBSjs7QUFFQSxTQUFTQyxJQUFULENBQWNDLEtBQWQsRUFBcUJDLFNBQXJCLEVBQWdDO0FBQzVCQSxjQUFVQyxLQUFWLEdBQWtCRixNQUFNRyxVQUF4QjtBQUNBRixjQUFVRyxNQUFWLEdBQW1CSixNQUFNSyxXQUF6QjtBQUNBO0FBQ0EsUUFBSUMsVUFBVUwsVUFBVU0sVUFBVixDQUFxQixJQUFyQixDQUFkOztBQUVBO0FBQ0FELFlBQVFFLFNBQVIsQ0FBa0JSLEtBQWxCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCQSxNQUFNRyxVQUFyQyxFQUFpREgsTUFBTUssV0FBdkQ7O0FBRUE7QUFDQVAsY0FBVUcsVUFBVVEsU0FBVixDQUFvQixXQUFwQixDQUFWOztBQUVBO0FBQ0FILFlBQVFJLFNBQVIsQ0FBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0JWLE1BQU1HLFVBQTlCLEVBQTBDSCxNQUFNSyxXQUFoRDs7QUFFQSxRQUFJTSxRQUFRQyxRQUFRQyxPQUFSLENBQWdCQyxTQUFTQyxjQUFULENBQXdCLGNBQXhCLENBQWhCLEVBQXlESixLQUF6RCxFQUFaO0FBQ0FBLFVBQU1LLE1BQU4sQ0FBYSxZQUFZO0FBQ3JCTCxjQUFNTSxXQUFOLENBQWtCbkIsT0FBbEI7QUFDSCxLQUZEO0FBR0g7O0FBR0Q7QUFDQSxJQUFJb0IsTUFBTU4sUUFBUU8sTUFBUixDQUFlLEtBQWYsRUFBc0IsQ0FBQyxXQUFELEVBQWMsVUFBZCxDQUF0QixDQUFWO0FBQ0FELElBQUlFLFVBQUosQ0FBZSxNQUFmLEVB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TS9DYSxvQkFBUUMsR0FBUixDQUFZLE9BQVo7QUFDQTtBQUNBekIsbUJBQU9DLFFBQVAsa0NBQStDRyxRQUEvQyxtQkFBcUVPLFNBQXJFO0FBQ0gsU0FwQkQsRUFvQkdnRCxLQXBCSCxDQW9CUyxVQUFVbkIsSUFBVixFQUFnQmlCLE1BQWhCLEVBQXdCQyxNQUF4QixFQUFnQ2QsTUFBaEMsRUFBd0M7QUFDN0NnQixvQkFBUUMsS0FBUixDQUFjLFdBQVdyQixJQUF6QjtBQUNILFNBdEJEO0FBdUJILEtBakREO0FBbURILENBdk5EOztBQXlOQXhDLE9BQU91QixNQUFQLEdBQWdCLFlBQVk7QUFDeEI7QUFDQSxRQUFJckQsWUFBWWEsU0FBU0MsY0FBVCxDQUF3QixXQUF4QixDQUFoQjs7QUFFQXlELE1BQUUsVUFBRixFQUFjcUIsRUFBZCxDQUFpQixPQUFqQixFQUEwQixZQUFZO0FBQ2xDOUYsYUFBS0MsS0FBTCxFQUFZQyxTQUFaO0FBQ0gsS0FGRDtBQUdILENBUEQiLCJmaWxlIjoiZXh0cmFjdC1pbWFnZS1rYWkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgZGF0YVVSTDtcblxuZnVuY3Rpb24gZHJhdyh2aWRlbywgdGhlY2FudmFzKSB7XG4gICAgdGhlY2FudmFzLndpZHRoID0gdmlkZW8udmlkZW9XaWR0aDtcbiAgICB0aGVjYW52YXMuaGVpZ2h0ID0gdmlkZW8udmlkZW9IZWlnaHQ7XG4gICAgLy8gZ2V0IHRoZSBjYW52YXMgY29udGV4dCBmb3IgZHJhd2luZ1xuICAgIHZhciBjb250ZXh0ID0gdGhlY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBkcmF3IHRoZSB2aWRlbyBjb250ZW50cyBpbnRvIHRoZSBjYW52YXMgeCwgeSwgd2lkdGgsIGhlaWdodFxuICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCB2aWRlby52aWRlb1dpZHRoLCB2aWRlby52aWRlb0hlaWdodCk7XG5cbiAgICAvLyBnZXQgdGhlIGltYWdlIGRhdGEgZnJvbSB0aGUgY2FudmFzIG9iamVjdFxuICAgIGRhdGFVUkwgPSB0aGVjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcblxuICAgIC8vIGNsZWFyIHRoZSBjYW52YXNcbiAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB2aWRlby52aWRlb1dpZHRoLCB2aWRlby52aWRlb0hlaWdodCk7XG5cbiAgICB2YXIgc2NvcGUgPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ215Y29udHJvbGxlcicpKS5zY29wZSgpO1xuICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNjb3BlLnVwZGF0ZUltYWdlKGRhdGFVUkwpO1xuICAgIH0pO1xufVxuXG5cbi8vIGluaXRpYWxpemUgY29udHJvbGxlclxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nSW1nQ3JvcCcsICdyek1vZHVsZSddKTtcbmFwcC5jb250cm9sbGVyKCdDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgJHNjZSwgJGh0dHApIHtcbiAgICAvLyBjb25zdCBiYWNrZW5kVXJsID0gJ2h0dHBzOi8vY2FybWEtY2FtLXRlc3QtYmFja2VuZC55ajgzbGVldGVzdC5zcGFjZS85MDEwJztcbiAgICBjb25zdCBiYWNrZW5kVXJsID0gJ2h0dHBzOi8vY2xvdWRzZXJ2ZXIuY2FybWEtY2FtLmNvbSc7XG5cbiAgICAkc2NvcGUubXlDcm9wcGVkSW1hZ2UgPSAnJztcbiAgICAkc2NvcGUudXBkYXRlSW1hZ2UgPSBmdW5jdGlvbiAoZGF0YVVSTCkge1xuICAgICAgICAkc2NvcGUubXlJbWFnZSA9IGRhdGFVUkw7XG4gICAgfTtcblxuICAgIHZhciBjdXJyZW50X2ltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgJHNjb3BlLmdldFZpZGVvID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCB2aWRlb0lkID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5zcGxpdCgnJicpWzBdLnNwbGl0KCc9JylbMV07XG4gICAgICAgICRzY29wZS5yZXBvcnRJZCA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guc3BsaXQoJyYnKVsxXS5zcGxpdCgnPScpWzFdO1xuICAgICAgICB2YXIgdmlkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ZpZGVvJyk7XG4gICAgICAgIHZpZC5zcmMgPSBiYWNrZW5kVXJsICsgJy9kb3dubG9hZEZpbGUvJyArIHZpZGVvSWQ7XG4gICAgfTtcblxuICAgICRzY29wZS5iYWNrID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBbdmlkZW9EYXRhLCByZXBvcnREYXRhLCBhY2NvdW50RGF0YV0gPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNwbGl0KCcmJyk7XG4gICAgICAgIGNvbnN0IFssIHZpZGVvSWRdID0gdmlkZW9EYXRhLnNwbGl0KCc9Jyk7XG4gICAgICAgIGNvbnN0IFssIHJlcG9ydElkXSA9IHJlcG9ydERhdGEuc3BsaXQoJz0nKTtcbiAgICAgICAgY29uc3QgWywgYWNjb3VudElkXSA9IGFjY291bnREYXRhLnNwbGl0KCc9Jyk7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGBwb3N0LXJlcG9ydC5odG1sP3JlcG9ydElkPSR7cmVwb3J0SWR9JmFjY291bnRJZD0ke2FjY291bnRJZH1gO1xuICAgIH07XG5cbiAgICB2YXIgcmVkcmF3X2NhbnZhcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibXlfY2FudmFzXCIpO1xuICAgICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGN1cnJlbnRfaW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBDYW1hbihcIiNteV9jYW52YXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5yZWxvYWRDYW52YXNEYXRhKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgaW1hZ2UgY3JvcHBpbmcuXG4gICAgJHNjb3BlLmhhbmRsZV9jcm9wID0gZnVuY3Rpb24gKCRkYXRhVVJJKSB7XG4gICAgICAgIC8vIHJlc2V0IHNsaWRlciB2YWx1ZXNcbiAgICAgICAgJHNjb3BlLmJyaWdodG5lc3Nfc2xpZGVyLnZhbHVlID0gMDtcbiAgICAgICAgJHNjb3BlLmNvbnRyYXN0X3NsaWRlci52YWx1ZSA9IDA7XG4gICAgICAgICRzY29wZS5leHBvc3VyZV9zbGlkZXIudmFsdWUgPSAwO1xuICAgICAgICAvLyByZXNldCBpbWFnZSBzb3VyY2VzXG4gICAgICAgIGN1cnJlbnRfaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGN1cnJlbnRfaW1nLnNyYyA9ICRkYXRhVVJJO1xuICAgICAgICBjdXJyZW50X2ltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyByZWRyYXcgYW5kIHJlbG9hZCB0aGUgY2FudmFzIGRhdGFcbiAgICAgICAgICAgIHJlZHJhd19jYW52YXMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibmV3IGltZyB1cGRhdGVkLCBpbWFnZV9yYXcgdXBkYXRlZFwiKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBicmlnaHRuZXNzIHNsaWRlclxuICAgICRzY29wZS5icmlnaHRuZXNzX3NsaWRlciA9IHtcbiAgICAgICAgdmFsdWU6IDAsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGZsb29yOiAtMTAwLFxuICAgICAgICAgICAgY2VpbDogMTAwLFxuICAgICAgICAgICAgc2hvd1NlbGVjdGlvbkJhcjogdHJ1ZSxcbiAgICAgICAgICAgIGdldFNlbGVjdGlvbkJhckNvbG9yOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPD0gLTUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAncmVkJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd5ZWxsb3cnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPD0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdvcmFuZ2UnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJyMyQUUwMkEnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uRW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IHRvIG9yaWdpbmFsIGltYWdlIHRoZW4gYXBwbHkgbmV3IGZpbHRlclxuICAgICAgICAgICAgICAgIHJlZHJhd19jYW52YXMoKTtcbiAgICAgICAgICAgICAgICBDYW1hbihcIiNteV9jYW52YXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJyaWdodG5lc3MoJHNjb3BlLmJyaWdodG5lc3Nfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cmFzdCgkc2NvcGUuY29udHJhc3Rfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBvc3VyZSgkc2NvcGUuZXhwb3N1cmVfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZXQgaW1hZ2UgYnJpZ2h0bmVzcyB0bzogXCIgKyAkc2NvcGUuYnJpZ2h0bmVzc19zbGlkZXIudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNvbnRyYXN0IHNsaWRlclxuICAgICRzY29wZS5jb250cmFzdF9zbGlkZXIgPSB7XG4gICAgICAgIHZhbHVlOiAwLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBmbG9vcjogLTEwMCxcbiAgICAgICAgICAgIGNlaWw6IDEwMCxcbiAgICAgICAgICAgIHNob3dTZWxlY3Rpb25CYXI6IHRydWUsXG4gICAgICAgICAgICBnZXRTZWxlY3Rpb25CYXJDb2xvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIDw9IC01MCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3JlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAneWVsbG93JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIDw9IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnb3JhbmdlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICcjMkFFMDJBJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIHNldCB0byBvcmlnaW5hbCBpbWFnZSB0aGVuIGFwcGx5IG5ldyBmaWx0ZXJcbiAgICAgICAgICAgICAgICByZWRyYXdfY2FudmFzKCk7XG4gICAgICAgICAgICAgICAgQ2FtYW4oXCIjbXlfY2FudmFzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icmlnaHRuZXNzKCRzY29wZS5icmlnaHRuZXNzX3NsaWRlci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udHJhc3QoJHNjb3BlLmNvbnRyYXN0X3NsaWRlci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwb3N1cmUoJHNjb3BlLmV4cG9zdXJlX3NsaWRlci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2V0IGltYWdlIGNvbnRyYXN0IHRvOiBcIiArICRzY29wZS5jb250cmFzdF9zbGlkZXIudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGV4cG9zdXJlIHNsaWRlclxuICAgICRzY29wZS5leHBvc3VyZV9zbGlkZXIgPSB7XG4gICAgICAgIHZhbHVlOiAwLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBmbG9vcjogLTEwMCxcbiAgICAgICAgICAgIGNlaWw6IDEwMCxcbiAgICAgICAgICAgIHNob3dTZWxlY3Rpb25CYXI6IHRydWUsXG4gICAgICAgICAgICBnZXRTZWxlY3Rpb25CYXJDb2xvcjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIDw9IC01MCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3JlZCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAneWVsbG93JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIDw9IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnb3JhbmdlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICcjMkFFMDJBJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkVuZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0IHRvIG9yaWdpbmFsIGltYWdlIHRoZW4gYXBwbHkgbmV3IGZpbHRlclxuICAgICAgICAgICAgICAgIHJlZHJhd19jYW52YXMoKTtcbiAgICAgICAgICAgICAgICBDYW1hbihcIiNteV9jYW52YXNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJyaWdodG5lc3MoJHNjb3BlLmJyaWdodG5lc3Nfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250cmFzdCgkc2NvcGUuY29udHJhc3Rfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBvc3VyZSgkc2NvcGUuZXhwb3N1cmVfc2xpZGVyLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzZXQgaW1hZ2UgZXhwb3N1cmUgdG86IFwiICsgJHNjb3BlLmV4cG9zdXJlX3NsaWRlci52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmVzZXQgZnVuY3Rpb24gYW5kIHJlZHJhdyBjYW52YXMgZGF0YVxuICAgICRzY29wZS5yZXNldF9jb25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5icmlnaHRuZXNzX3NsaWRlci52YWx1ZSA9IDA7XG4gICAgICAgICRzY29wZS5jb250cmFzdF9zbGlkZXIudmFsdWUgPSAwO1xuICAgICAgICAkc2NvcGUuZXhwb3N1cmVfc2xpZGVyLnZhbHVlID0gMDtcbiAgICAgICAgLy8gcmVkcmF3IGNhbnZhcyBkYXRhXG4gICAgICAgIHJlZHJhd19jYW52YXMoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBsb2FkSW1hZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGFkZCBjaGVjayBoZXJlIHRvIGRlY2lkZSBpZiBpbWFnZSB0byBiZSBzZW50IHRvIHJlcG9ydCBjb2xsZWN0aW9uIG9yIGFsZXJ0cyBjb2xsZWN0aW9uLFxuICAgICAgICAvLyB3aGVuIGVtZXJnZW5jeSBhbGVydHMgYXJlIGVuYWJsZWRcbiAgICAgICAgLy8gY2hhbmdlIHRvIHVzZSBhY3R1YWwgc2F2ZWQgaW1hZ2VcbiAgICAgICAgdmFyIHVwbG9hZF9jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm15X2NhbnZhc1wiKTtcbiAgICAgICAgdmFyIHVwbG9hZF9jb250ZXh0ID0gdXBsb2FkX2NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIHZhciB1cGxvYWRfaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIHVwbG9hZF9pbWcgPSB1cGxvYWRfY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcImNoZWNrIGRhdGEgdXJsOiBcIiArIHVwbG9hZF9pbWcpO1xuICAgICAgICAvLyBFcnJvcjogJ2NsaWNrJyBjYWxsZWQgb24gYW4gb2JqZWN0IHRoYXQgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBIVE1MRWxlbWVudC5cbiAgICAgICAgdmFyIGRhdGEgPSAkLnBhcmFtKHtcbiAgICAgICAgICAgIGZpbGVmaWVsZDogdXBsb2FkX2ltZyxcbiAgICAgICAgICAgIHJlcG9ydElkOiB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNwbGl0KCcmJylbMV0uc3BsaXQoJz0nKVsxXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5tb2RlbCA9IHtcbiAgICAgICAgICAgIHJlcG9ydElkOiB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNwbGl0KCcmJylbMV0uc3BsaXQoJz0nKVsxXSxcbiAgICAgICAgfTtcblxuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogYmFja2VuZFVybCArICcvdXBsb2FkSW1hZ2UnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC10eXBlJzogdW5kZWZpbmVkIH0sXG4gICAgICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0OiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBmb3JtZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICAgICAgICAgIGZvcm1kYXRhLmFwcGVuZCgnbW9kZWwnLCBhbmd1bGFyLnRvSnNvbihkYXRhLm1vZGVsKSk7XG4gICAgICAgICAgICAgICAgZm9ybWRhdGEuYXBwZW5kKCdmaWxlJywgZGF0YS5maWxlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1kYXRhO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IHsgbW9kZWw6ICRzY29wZS5tb2RlbCwgZmlsZXM6IHVwbG9hZF9pbWcgfSxcbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSwgc3RhdHVzLCBoZWFkZXIsIGNvbmZpZykge1xuICAgICAgICAgICAgLy8gLmh0bWw/dmlkZW9JZD14eHgmcmVwb3J0SWQ9eHh4JmFjY291bnRJZD14eHhcbiAgICAgICAgICAgIGNvbnN0IFt2aWRlb0RhdGEsIHJlcG9ydERhdGEsIGFjY291bnREYXRhXSA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guc3BsaXQoJyYnKTtcbiAgICAgICAgICAgIGNvbnN0IFssIHZpZGVvSWRdID0gdmlkZW9EYXRhLnNwbGl0KCc9Jyk7XG4gICAgICAgICAgICBjb25zdCBbLCByZXBvcnRJZF0gPSByZXBvcnREYXRhLnNwbGl0KCc9Jyk7XG4gICAgICAgICAgICBjb25zdCBbLCBhY2NvdW50SWRdID0gYWNjb3VudERhdGEuc3BsaXQoJz0nKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtb3ZlIScpO1xuICAgICAgICAgICAgLy8gaWYgdXBsb2FkIHN1Y2Nlc3MsIGF1dG8gZ29lcyB0byBwb3N0LXJlcG9ydC5odG1sIChnbyBiYWNrKVxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gYHBvc3QtcmVwb3J0Lmh0bWw/cmVwb3J0SWQ9JHtyZXBvcnRJZH0mYWNjb3VudElkPSR7YWNjb3VudElkfWA7XG4gICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uIChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSB7XG4gICAgICAgICAgICBib290Ym94LmFsZXJ0KCdFcnJvciEnICsgZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbn0pO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIHZhciB2aWRlbyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWRlbycpO1xuICAgIHZhciB0aGVjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlY2FudmFzJyk7XG5cbiAgICAkKCcjY2FwdHVyZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZHJhdyh2aWRlbywgdGhlY2FudmFzKTtcbiAgICB9KTtcbn07XG4iXX0=
