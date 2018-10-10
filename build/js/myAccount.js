'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var app = angular.module('AccountApp', []);
app.controller('displayData', ['$scope', '$http', function ($scope, $http) {
  var backendUrl = 'https://cloudserver.carma-cam.com';

  // .html?accountId=xxx

  var _window$location$sear = window.location.search.split('='),
      _window$location$sear2 = _slicedToArray(_window$location$sear, 2),
      accountId = _window$location$sear2[1];

  $scope.stack = [];
  $scope.result = [];
  $scope.stac = [];
  $scope.center_lat = '';
  $scope.center_lng = '';
  $scope.loadHello = function () {
    $http({
      method: 'GET',
      url: backendUrl + '/accounts/' + encodeURIComponent(accountId),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (response) {
      if (!response.zipcode || response.zipcode === '') {
        // if there is no zipcode field or zipcode is invalid set default center to campus
        $scope.center_lat = '34.022352';
        $scope.center_lng = '-118.285117';
      } else {
        var address = response.zipcode;
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            $scope.center_lat = results[0].geometry.location.lat();
            $scope.center_lng = results[0].geometry.location.lng();
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });
      }

      $scope.name = response.fname + ' ' + response.lname;
      $scope.licensePlateNo = response.licensePlate;
      $scope.phoneNo = response.phone;
      $scope.rewards = response.rewards;
      $scope.zipcode = response.zipcode;
      $scope.getReports();
    }).error(function () {});
  };

  var reportsIdList = []; // getting all reports objects under this user
  var AllReportsUrlList = []; // collecting link url
  var failedUrlList = []; // failed reports url list
  var successUrlList = []; // success reports url list
  var pendingUrlList = []; // under audit prograss reports url list
  var inReviewUrlList = []; // reports in review process

  var reportImgIdList = [];

  var reportsIndex = void 0; // All reports url index, remove later if no use
  var pendingUrlIndex = void 0; // pending reports url index
  var passedUrlIndex = void 0; // passed reports url index
  var failedUrlIndex = void 0; // failed reports url index
  var inReviewUrlIndex = void 0; // reports in review process url index

  $scope.getReports = function () {
    $http({
      method: 'GET',
      url: backendUrl + '/accounts/' + $scope.phoneNo + '/baddriverreports',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (response) {
      var _$scope$allReportsUrl, _$scope$allReportsUrl2, _$scope$allReportsUrl3;

      //console.log(response);
      pendingUrlIndex = 0;
      inReviewUrlIndex = 0;
      passedUrlIndex = 0;
      failedUrlIndex = 0;

      // eslint-disable-next-line no-plusplus

      var _loop = function _loop() {
        // eslint-disable-next-line no-underscore-dangle
        reportsIdList[reportsIndex] = response[reportsIndex]._id;
        var aimList = '';
        var aimListIdx = '';
        if (response[reportsIndex].status === 'uploaded') {
          aimList = pendingUrlList;
          aimListIdx = pendingUrlIndex;
          // eslint-disable-next-line no-plusplus
          //var curIndex = pendingUrlIndex;
          pendingUrlList[pendingUrlIndex++] = {
            isDelete: false,
            url: 'post-report.html?reportId=' + reportsIdList[reportsIndex] + '&accountId=' + accountId,
            imgsrc: '',
            time: response[reportsIndex].time
          };
        }
        if (response[reportsIndex].status === 'reported') {
          aimList = inReviewUrlList;
          aimListIdx = inReviewUrlIndex;
          // eslint-disable-next-line no-plusplus
          //var curIndex = pendingUrlIndex;
          inReviewUrlList[inReviewUrlIndex++] = {
            isDelete: false,
            url: 'post-report.html?reportId=' + reportsIdList[reportsIndex] + '&accountId=' + accountId,
            imgsrc: '',
            time: response[reportsIndex].time
          };
        }
        if (response[reportsIndex].status === 'success') {
          aimList = successUrlList;
          aimListIdx = passedUrlIndex;
          // eslint-disable-next-line no-plusplus
          successUrlList[passedUrlIndex++] = {
            isDelete: false,
            url: 'post-report.html?reportId=' + reportsIdList[reportsIndex] + '&accountId=' + accountId,
            imgsrc: '',
            time: response[reportsIndex].time
          };
        }

        if (response[reportsIndex].status === 'failure') {
          aimList = failedUrlList;
          aimListIdx = failedUrlIndex;
          // eslint-disable-next-line no-plusplus
          failedUrlList[failedUrlIndex++] = {
            isDelete: false,
            url: 'post-report.html?reportId=' + reportsIdList[reportsIndex] + '&accountId=' + accountId,
            imgsrc: '',
            time: response[reportsIndex].time
          };
        }
        $http.get('https://cloudserver.carma-cam.com/downloadFile/' + response[reportsIndex].capturedImage).then(function (downloadFileRes) {
          //$scope.imgtest = downloadFileRes.data;
          aimList[aimListIdx].imgsrc = downloadFileRes.data;
          //console.log(response[reportsIndex]);           ///// ?????????????
        });
        AllReportsUrlList[reportsIndex] = 'post-report.html?id=' + reportsIdList[reportsIndex];
      };

      for (reportsIndex = 0; reportsIndex < response.length; reportsIndex++) {
        _loop();
      }

      $scope.reportSum = response.length;
      $scope.pendingSum = pendingUrlList.length;
      $scope.inReviewSum = inReviewUrlList.length;
      $scope.passedSum = successUrlList.length;
      $scope.failedSum = failedUrlList.length;
      $scope.pendingReportsUrl = pendingUrlList;
      $scope.inReviewReportsUrl = inReviewUrlList;
      $scope.passedReportsUrl = successUrlList;
      $scope.failedReportsUrl = failedUrlList;

      $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
      (_$scope$allReportsUrl = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl, _toConsumableArray($scope.inReviewReportsUrl));
      (_$scope$allReportsUrl2 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl2, _toConsumableArray($scope.passedReportsUrl));
      (_$scope$allReportsUrl3 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl3, _toConsumableArray($scope.failedReportsUrl));

      /* Remove lat-lng coordinates that are older than 30 days. */
      var today = Date.now();
      var dat = new Date(today - 30 * 24 * 60 * 60 * 1000);
      var dd = dat.getDate();
      var mm = dat.getMonth() + 1; //January is 0!
      var yyyy = dat.getFullYear();

      if (dd < 10) {
        dd = '0' + dd;
      }

      if (mm < 10) {
        mm = '0' + mm;
      }

      var expire = mm + '/' + dd + '/' + yyyy;
      //console.log("expire "+expire);

      for (var i = 0; i < response.length; i++) {
        $scope.stac.push(response[i].location.split(','));
        /*Has all lat-lng coordinates (including older than 30 days) .*/
        //console.log(response[i].date);
        if (response[i].date > expire) {
          $scope.stack.push(response[i].location.split(','));
          /*Has coordinates that are only in the last 30 days.*/
          //console.log("no expire");
        }
      }
      /* Removing duplicate lat-lng coordinates */
      var lookup = {};
      var items = $scope.stack;
      for (var item, i = 0; item = items[i++];) {

        var unique_latlng = item;
        if (!(unique_latlng in lookup)) {
          lookup[unique_latlng] = 1;
          $scope.result.push(unique_latlng);
        }
      }
    }).error(function () {});
  };

  $scope.removePendingReports = function () {
    var _$scope$allReportsUrl4, _$scope$allReportsUrl5, _$scope$allReportsUrl6;

    var newDataList = [];
    angular.forEach($scope.pendingReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        var reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: backendUrl + '/deleteBaddriverreports/' + reportId,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }).success(function (data, status, header, config) {
          // console.log('SUCCESS');
        }).error(function (data, status, header, config) {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.pendingReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl4 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl4, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl5 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl5, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl6 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl6, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removeInReviewReports = function () {
    var _$scope$allReportsUrl7, _$scope$allReportsUrl8, _$scope$allReportsUrl9;

    var newDataList = [];
    angular.forEach($scope.inReviewReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        var reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: backendUrl + '/deleteBaddriverreports/' + reportId,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }).success(function (data, status, header, config) {
          // console.log('SUCCESS');
        }).error(function (data, status, header, config) {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.inReviewReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl7 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl7, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl8 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl8, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl9 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl9, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removePassedReports = function () {
    var _$scope$allReportsUrl10, _$scope$allReportsUrl11, _$scope$allReportsUrl12;

    var newDataList = [];
    angular.forEach($scope.passedReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        var reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: backendUrl + '/deleteBaddriverreports/' + reportId,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }).success(function (data, status, header, config) {
          // console.log('SUCCESS');
        }).error(function (data, status, header, config) {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.passedReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl10 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl10, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl11 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl11, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl12 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl12, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removeFailedReports = function () {
    var _$scope$allReportsUrl13, _$scope$allReportsUrl14, _$scope$allReportsUrl15;

    var newDataList = [];
    angular.forEach($scope.failedReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        // .../post_report.html?reportId=xxx&
        var reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: backendUrl + '/deleteBaddriverreports/' + reportId,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true
        }).success(function (data, status, header, config) {
          // console.log('SUCCESS');
        }).error(function (data, status, header, config) {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.failedReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl13 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl13, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl14 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl14, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl15 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl15, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.logout = function () {
    $http.get(backendUrl + '/logout', { withCredentials: true }).then(function () {
      // logout success
      window.location = 'index.html';
    });
  };

  $scope.removeCurPendingReport = function (i) {
    var _$scope$allReportsUrl16, _$scope$allReportsUrl17, _$scope$allReportsUrl18;

    var reportId = pendingUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
      method: 'POST',
      url: backendUrl + '/deleteBaddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (data, status, header, config) {
      // console.log('SUCCESS');
    }).error(function (data, status, header, config) {
      // console.log('status : ' + status);
    });

    pendingUrlList.splice(i, 1);
    $scope.pendingReportsUrl = pendingUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl16 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl16, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl17 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl17, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl18 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl18, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removeCurInReviewReport = function (i) {
    var _$scope$allReportsUrl19, _$scope$allReportsUrl20, _$scope$allReportsUrl21;

    var reportId = inReviewUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
      method: 'POST',
      url: backendUrl + '/deleteBaddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (data, status, header, config) {
      // console.log('SUCCESS');
    }).error(function (data, status, header, config) {
      // console.log('status : ' + status);
    });

    inReviewUrlList.splice(i, 1);
    $scope.inReviewReportsUrl = inReviewUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl19 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl19, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl20 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl20, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl21 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl21, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removeCurPassedReport = function (i) {
    var _$scope$allReportsUrl22, _$scope$allReportsUrl23, _$scope$allReportsUrl24;

    var reportId = successUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
      method: 'POST',
      url: backendUrl + '/deleteBaddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (data, status, header, config) {
      // console.log('SUCCESS');
    }).error(function (data, status, header, config) {
      // console.log('status : ' + status);
    });

    successUrlList.splice(i, 1);
    $scope.passedReportsUrl = successUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl22 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl22, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl23 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl23, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl24 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl24, _toConsumableArray($scope.failedReportsUrl));
  };

  $scope.removeCurfailedReport = function (i) {
    var _$scope$allReportsUrl25, _$scope$allReportsUrl26, _$scope$allReportsUrl27;

    var reportId = failedUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
      method: 'POST',
      url: backendUrl + '/deleteBaddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (data, status, header, config) {
      // console.log('SUCCESS');
    }).error(function (data, status, header, config) {
      // console.log('status : ' + status);
    });

    failedUrlList.splice(i, 1);
    $scope.failedReportsUrl = failedUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    (_$scope$allReportsUrl25 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl25, _toConsumableArray($scope.inReviewReportsUrl));
    (_$scope$allReportsUrl26 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl26, _toConsumableArray($scope.passedReportsUrl));
    (_$scope$allReportsUrl27 = $scope.allReportsUrl).push.apply(_$scope$allReportsUrl27, _toConsumableArray($scope.failedReportsUrl));
  };
}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm15QWNjb3VudC5qcyJdLCJuYW1lcyI6WyJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29udHJvbGxlciIsIiRzY29wZSIsIiRodHRwIiwiYmFja2VuZFVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwic2VhcmNoIiwic3BsaXQiLCJhY2NvdW50SWQiLCJzdGFjayIsInJlc3VsdCIsInN0YWMiLCJjZW50ZXJfbGF0IiwiY2VudGVyX2xuZyIsImxvYWRIZWxsbyIsIm1ldGhvZCIsInVybCIsImVuY29kZVVSSUNvbXBvbmVudCIsImhlYWRlcnMiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzdWNjZXNzIiwicmVzcG9uc2UiLCJ6aXBjb2RlIiwiYWRkcmVzcyIsImdlb2NvZGVyIiwiZ29vZ2xlIiwibWFwcyIsIkdlb2NvZGVyIiwiZ2VvY29kZSIsInJlc3VsdHMiLCJzdGF0dXMiLCJHZW9jb2RlclN0YXR1cyIsIk9LIiwiZ2VvbWV0cnkiLCJsYXQiLCJsbmciLCJhbGVydCIsIm5hbWUiLCJmbmFtZSIsImxuYW1lIiwibGljZW5zZVBsYXRlTm8iLCJsaWNlbnNlUGxhdGUiLCJwaG9uZU5vIiwicGhvbmUiLCJyZXdhcmRzIiwiZ2V0UmVwb3J0cyIsImVycm9yIiwicmVwb3J0c0lkTGlzdCIsIkFsbFJlcG9ydHNVcmxMaXN0IiwiZmFpbGVkVXJsTGlzdCIsInN1Y2Nlc3NVcmxMaXN0IiwicGVuZGluZ1VybExpc3QiLCJpblJldmlld1VybExpc3QiLCJyZXBvcnRJbWdJZExpc3QiLCJyZXBvcnRzSW5kZXgiLCJwZW5kaW5nVXJsSW5kZXgiLCJwYXNzZWRVcmxJbmRleCIsImZhaWxlZFVybEluZGV4IiwiaW5SZXZpZXdVcmxJbmRleCIsIl9pZCIsImFpbUxpc3QiLCJhaW1MaXN0SWR4IiwiaXNEZWxldGUiLCJpbWdzcmMiLCJ0aW1lIiwiZ2V0IiwiY2FwdHVyZWRJbWFnZSIsInRoZW4iLCJkb3dubG9hZEZpbGVSZXMiLCJkYXRhIiwibGVuZ3RoIiwicmVwb3J0U3VtIiwicGVuZGluZ1N1bSIsImluUmV2aWV3U3VtIiwicGFzc2VkU3VtIiwiZmFpbGVkU3VtIiwicGVuZGluZ1JlcG9ydHNVcmwiLCJpblJldmlld1JlcG9ydHNVcmwiLCJwYXNzZWRSZXBvcnRzVXJsIiwiZmFpbGVkUmVwb3J0c1VybCIsImFsbFJlcG9ydHNVcmwiLCJjb3B5IiwicHVzaCIsInRvZGF5IiwiRGF0ZSIsIm5vdyIsImRhdCIsImRkIiwiZ2V0RGF0ZSIsIm1tIiwiZ2V0TW9udGgiLCJ5eXl5IiwiZ2V0RnVsbFllYXIiLCJleHBpcmUiLCJpIiwiZGF0ZSIsImxvb2t1cCIsIml0ZW1zIiwiaXRlbSIsInVuaXF1ZV9sYXRsbmciLCJyZW1vdmVQZW5kaW5nUmVwb3J0cyIsIm5ld0RhdGFMaXN0IiwiZm9yRWFjaCIsInYiLCJyZXBvcnRJZCIsImhlYWRlciIsImNvbmZpZyIsInJlbW92ZUluUmV2aWV3UmVwb3J0cyIsInJlbW92ZVBhc3NlZFJlcG9ydHMiLCJyZW1vdmVGYWlsZWRSZXBvcnRzIiwibG9nb3V0IiwicmVtb3ZlQ3VyUGVuZGluZ1JlcG9ydCIsInNwbGljZSIsInJlbW92ZUN1ckluUmV2aWV3UmVwb3J0IiwicmVtb3ZlQ3VyUGFzc2VkUmVwb3J0IiwicmVtb3ZlQ3VyZmFpbGVkUmVwb3J0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxNQUFNQyxRQUFRQyxNQUFSLENBQWUsWUFBZixFQUE2QixFQUE3QixDQUFaO0FBQ0FGLElBQUlHLFVBQUosQ0FBZSxhQUFmLEVBQThCLENBQUMsUUFBRCxFQUFXLE9BQVgsRUFBb0IsVUFBQ0MsTUFBRCxFQUFTQyxLQUFULEVBQW1CO0FBQ25FLE1BQU1DLGFBQWEsbUNBQW5COztBQUVBOztBQUhtRSw4QkFJN0NDLE9BQU9DLFFBQVAsQ0FBZ0JDLE1BQWhCLENBQXVCQyxLQUF2QixDQUE2QixHQUE3QixDQUo2QztBQUFBO0FBQUEsTUFJMURDLFNBSjBEOztBQUtuRVAsU0FBT1EsS0FBUCxHQUFlLEVBQWY7QUFDQVIsU0FBT1MsTUFBUCxHQUFnQixFQUFo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QTVELENBQWpCO0FBQ0FMLFVBQU07QUFDQWEsY0FBUSxNQURSO0FBRUFDLFdBQVFiLFVBQVIsZ0NBQTZDcUcsUUFGN0M7QUFHQXRGLGVBQVMsRUFBRSxnQkFBZ0IsbUNBQWxCLEVBSFQ7QUFJQUMsdUJBQWlCO0FBSmpCLEtBQU4sRUFLT0MsT0FMUCxDQUtlLFVBQUNpRCxJQUFELEVBQU92QyxNQUFQLEVBQWUyRSxNQUFmLEVBQXVCQyxNQUF2QixFQUFrQztBQUMzQztBQUNELEtBUEwsRUFPTzVELEtBUFAsQ0FPYSxVQUFDdUIsSUFBRCxFQUFPdkMsTUFBUCxFQUFlMkUsTUFBZixFQUF1QkMsTUFBdkIsRUFBa0M7QUFDekM7QUFDRCxLQVRMOztBQVdBekQsa0JBQWMrRCxNQUFkLENBQXFCbEIsQ0FBckIsRUFBd0IsQ0FBeEI7QUFDQTdGLFdBQU84RSxnQkFBUCxHQUEwQjlCLGFBQTFCO0FBQ0FoRCxXQUFPK0UsYUFBUCxHQUF1QmxGLFFBQVFtRixJQUFSLENBQWFoRixPQUFPMkUsaUJBQXBCLENBQXZCO0FBQ0Esc0NBQU9JLGFBQVAsRUFBcUJFLElBQXJCLG1EQUE2QmpGLE9BQU80RSxrQkFBcEM7QUFDQSxzQ0FBT0csYUFBUCxFQUFxQkUsSUFBckIsbURBQTZCakYsT0FBTzZFLGdCQUFwQztBQUNBLHNDQUFPRSxhQUFQLEVBQXFCRSxJQUFyQixtREFBNkJqRixPQUFPOEUsZ0JBQXBDO0FBQ0QsR0FwQkQ7QUFzQkQsQ0E1WTZCLENBQTlCIiwiZmlsZSI6Im15QWNjb3VudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdBY2NvdW50QXBwJywgW10pO1xuYXBwLmNvbnRyb2xsZXIoJ2Rpc3BsYXlEYXRhJywgWyckc2NvcGUnLCAnJGh0dHAnLCAoJHNjb3BlLCAkaHR0cCkgPT4ge1xuICBjb25zdCBiYWNrZW5kVXJsID0gJ2h0dHBzOi8vY2xvdWRzZXJ2ZXIuY2FybWEtY2FtLmNvbSc7XG5cbiAgLy8gLmh0bWw/YWNjb3VudElkPXh4eFxuICBjb25zdCBbLCBhY2NvdW50SWRdID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5zcGxpdCgnPScpO1xuICAkc2NvcGUuc3RhY2sgPSBbXTtcbiAgJHNjb3BlLnJlc3VsdCA9IFtdO1xuICAkc2NvcGUuc3RhYyA9IFtdO1xuICAkc2NvcGUuY2VudGVyX2xhdCA9ICcnO1xuICAkc2NvcGUuY2VudGVyX2xuZyA9ICcnO1xuICAkc2NvcGUubG9hZEhlbGxvID0gKCkgPT4ge1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IGAke2JhY2tlbmRVcmx9L2FjY291bnRzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGFjY291bnRJZCl9YCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSkuc3VjY2VzcygocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmICghcmVzcG9uc2UuemlwY29kZSB8fCByZXNwb25zZS56aXBjb2RlID09PSAnJykge1xuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyB6aXBjb2RlIGZpZWxkIG9yIHppcGNvZGUgaXMgaW52YWxpZCBzZXQgZGVmYXVsdCBjZW50ZXIgdG8gY2FtcHVzXG4gICAgICAgICRzY29wZS5jZW50ZXJfbGF0ID0gJzM0LjAyMjM1Mic7XG4gICAgICAgICRzY29wZS5jZW50ZXJfbG5nID0gJy0xMTguMjg1MTE3JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGFkZHJlc3MgPSByZXNwb25zZS56aXBjb2RlO1xuICAgICAgICBjb25zdCBnZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xuICAgICAgICBnZW9jb2Rlci5nZW9jb2RlKHsgYWRkcmVzcyB9LCAocmVzdWx0cywgc3RhdHVzKSA9PiB7XG4gICAgICAgICAgaWYgKHN0YXR1cyA9PT0gZ29vZ2xlLm1hcHMuR2VvY29kZXJTdGF0dXMuT0spIHtcbiAgICAgICAgICAgICRzY29wZS5jZW50ZXJfbGF0ID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbi5sYXQoKTtcbiAgICAgICAgICAgICRzY29wZS5jZW50ZXJfbG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbi5sbmcoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWxlcnQoYEdlb2NvZGUgd2FzIG5vdCBzdWNjZXNzZnVsIGZvciB0aGUgZm9sbG93aW5nIHJlYXNvbjogJHtzdGF0dXN9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLm5hbWUgPSBgJHtyZXNwb25zZS5mbmFtZX0gJHtyZXNwb25zZS5sbmFtZX1gO1xuICAgICAgJHNjb3BlLmxpY2Vuc2VQbGF0ZU5vID0gcmVzcG9uc2UubGljZW5zZVBsYXRlO1xuICAgICAgJHNjb3BlLnBob25lTm8gPSByZXNwb25zZS5waG9uZTtcbiAgICAgICRzY29wZS5yZXdhcmRzID0gcmVzcG9uc2UucmV3YXJkcztcbiAgICAgICRzY29wZS56aXBjb2RlID0gcmVzcG9uc2UuemlwY29kZTtcbiAgICAgICRzY29wZS5nZXRSZXBvcnRzKCk7XG4gICAgfSkuZXJyb3IoKCkgPT4ge1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcG9ydHNJZExpc3QgPSBbXTsgLy8gZ2V0dGluZyBhbGwgcmVwb3J0cyBvYmplY3RzIHVuZGVyIHRoaXMgdXNlclxuICBjb25zdCBBbGxSZXBvcnRzVXJsTGlzdCA9IFtdOyAvLyBjb2xsZWN0aW5nIGxpbmsgdXJsXG4gIGNvbnN0IGZhaWxlZFVybExpc3QgPSBbXTsgLy8gZmFpbGVkIHJlcG9ydHMgdXJsIGxpc3RcbiAgY29uc3Qgc3VjY2Vzc1VybExpc3QgPSBbXTsgLy8gc3VjY2VzcyByZXBvcnRzIHVybCBsaXN0XG4gIGNvbnN0IHBlbmRpbmdVcmxMaXN0ID0gW107IC8vIHVuZGVyIGF1ZGl0IHByb2dyYXNzIHJlcG9ydHMgdXJsIGxpc3RcbiAgY29uc3QgaW5SZXZpZXdVcmxMaXN0ID0gW107IC8vIHJlcG9ydHMgaW4gcmV2aWV3IHByb2Nlc3NcblxuICBjb25zdCByZXBvcnRJbWdJZExpc3QgPSBbXTtcblxuICBsZXQgcmVwb3J0c0luZGV4OyAvLyBBbGwgcmVwb3J0cyB1cmwgaW5kZXgsIHJlbW92ZSBsYXRlciBpZiBubyB1c2VcbiAgbGV0IHBlbmRpbmdVcmxJbmRleDsgLy8gcGVuZGluZyByZXBvcnRzIHVybCBpbmRleFxuICBsZXQgcGFzc2VkVXJsSW5kZXg7IC8vIHBhc3NlZCByZXBvcnRzIHVybCBpbmRleFxuICBsZXQgZmFpbGVkVXJsSW5kZXg7IC8vIGZhaWxlZCByZXBvcnRzIHVybCBpbmRleFxuICBsZXQgaW5SZXZpZXdVcmxJbmRleDsgLy8gcmVwb3J0cyBpbiByZXZpZXcgcHJvY2VzcyB1cmwgaW5kZXhcblxuICAkc2NvcGUuZ2V0UmVwb3J0cyA9ICgpID0+IHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9hY2NvdW50cy8keyRzY29wZS5waG9uZU5vfS9iYWRkcml2ZXJyZXBvcnRzYCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSkuc3VjY2VzcygocmVzcG9uc2UpID0+IHtcbiAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgcGVuZGluZ1VybEluZGV4ID0gMDtcbiAgICAgIGluUmV2aWV3VXJsSW5kZXggPSAwO1xuICAgICAgcGFzc2VkVXJsSW5kZXggPSAwO1xuICAgICAgZmFpbGVkVXJsSW5kZXggPSAwO1xuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGx1c3BsdXNcbiAgICAgIGZvciAocmVwb3J0c0luZGV4ID0gMDsgcmVwb3J0c0luZGV4IDwgcmVzcG9uc2UubGVuZ3RoOyByZXBvcnRzSW5kZXgrKykge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICAgICAgcmVwb3J0c0lkTGlzdFtyZXBvcnRzSW5kZXhdID0gcmVzcG9uc2VbcmVwb3J0c0luZGV4XS5faWQ7XG4gICAgICAgIGxldCBhaW1MaXN0ID0gJyc7XG4gICAgICAgIGxldCBhaW1MaXN0SWR4ID0gJyc7XG4gICAgICAgIGlmIChyZXNwb25zZVtyZXBvcnRzSW5kZXhdLnN0YXR1cyA9PT0gJ3VwbG9hZGVkJykge1xuICAgICAgICAgIGFpbUxpc3QgPSBwZW5kaW5nVXJsTGlzdDtcbiAgICAgICAgICBhaW1MaXN0SWR4ID0gcGVuZGluZ1VybEluZGV4O1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wbHVzcGx1c1xuICAgICAgICAgIC8vdmFyIGN1ckluZGV4ID0gcGVuZGluZ1VybEluZGV4O1xuICAgICAgICAgIHBlbmRpbmdVcmxMaXN0W3BlbmRpbmdVcmxJbmRleCsrXSA9IHtcbiAgICAgICAgICAgIGlzRGVsZXRlOiBmYWxzZSxcbiAgICAgICAgICAgIHVybDogYHBvc3QtcmVwb3J0Lmh0bWw/cmVwb3J0SWQ9JHtyZXBvcnRzSWRMaXN0W3JlcG9ydHNJbmRleF19JmFjY291bnRJZD0ke2FjY291bnRJZH1gLFxuICAgICAgICAgICAgaW1nc3JjOiAnJyxcbiAgICAgICAgICAgIHRpbWU6IHJlc3BvbnNlW3JlcG9ydHNJbmRleF0udGltZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwb25zZVtyZXBvcnRzSW5kZXhdLnN0YXR1cyA9PT0gJ3JlcG9ydGVkJykge1xuICAgICAgICAgIGFpbUxpc3QgPSBpblJldmlld1VybExpc3Q7XG4gICAgICAgICAgYWltTGlzdElkeCA9IGluUmV2aWV3VXJsSW5kZXg7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBsdXNwbHVzXG4gICAgICAgICAgLy92YXIgY3VySW5kZXggPSBwZW5kaW5nVXJsSW5kZXg7XG4gICAgICAgICAgaW5SZXZpZXdVcmxMaXN0W2luUmV2aWV3VXJsSW5kZXgrK10gPSB7XG4gICAgICAgICAgICBpc0RlbGV0ZTogZmFsc2UsXG4gICAgICAgICAgICB1cmw6IGBwb3N0LXJlcG9ydC5odG1sP3JlcG9ydElkPSR7cmVwb3J0c0lkTGlzdFtyZXBvcnRzSW5kZXhdfSZhY2NvdW50SWQ9JHthY2NvdW50SWR9YCxcbiAgICAgICAgICAgIGltZ3NyYzogJycsXG4gICAgICAgICAgICB0aW1lOiByZXNwb25zZVtyZXBvcnRzSW5kZXhdLnRpbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzcG9uc2VbcmVwb3J0c0luZGV4XS5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgIGFpbUxpc3QgPSBzdWNjZXNzVXJsTGlzdDtcbiAgICAgICAgICBhaW1MaXN0SWR4ID0gcGFzc2VkVXJsSW5kZXg7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBsdXNwbHVzXG4gICAgICAgICAgc3VjY2Vzc1VybExpc3RbcGFzc2VkVXJsSW5kZXgrK10gPSB7XG4gICAgICAgICAgICBpc0RlbGV0ZTogZmFsc2UsXG4gICAgICAgICAgICB1cmw6IGBwb3N0LXJlcG9ydC5odG1sP3JlcG9ydElkPSR7cmVwb3J0c0lkTGlzdFtyZXBvcnRzSW5kZXhdfSZhY2NvdW50SWQ9JHthY2NvdW50SWR9YCxcbiAgICAgICAgICAgIGltZ3NyYzogJycsXG4gICAgICAgICAgICB0aW1lOiByZXNwb25zZVtyZXBvcnRzSW5kZXhdLnRpbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXNwb25zZVtyZXBvcnRzSW5kZXhdLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnKSB7XG4gICAgICAgICAgYWltTGlzdCA9IGZhaWxlZFVybExpc3Q7XG4gICAgICAgICAgYWltTGlzdElkeCA9IGZhaWxlZFVybEluZGV4O1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wbHVzcGx1c1xuICAgICAgICAgIGZhaWxlZFVybExpc3RbZmFpbGVkVXJsSW5kZXgrK10gPSB7XG4gICAgICAgICAgICBpc0RlbGV0ZTogZmFsc2UsXG4gICAgICAgICAgICB1cmw6IGBwb3N0LXJlcG9ydC5odG1sP3JlcG9ydElkPSR7cmVwb3J0c0lkTGlzdFtyZXBvcnRzSW5kZXhdfSZhY2NvdW50SWQ9JHthY2NvdW50SWR9YCxcbiAgICAgICAgICAgIGltZ3NyYzogJycsXG4gICAgICAgICAgICB0aW1lOiByZXNwb25zZVtyZXBvcnRzSW5kZXhdLnRpbWUsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICAkaHR0cC5nZXQoYGh0dHBzOi8vY2xvdWRzZXJ2ZXIuY2FybWEtY2FtLmNvbS9kb3dubG9hZEZpbGUvJHtyZXNwb25zZVtyZXBvcnRzSW5kZXhdLmNhcHR1cmVkSW1hZ2V9YClcbiAgICAgICAgICAudGhlbigoZG93bmxvYWRGaWxlUmVzKSA9PiB7XG4gICAgICAgICAgICAvLyRzY29wZS5pbWd0ZXN0ID0gZG93bmxvYWRGaWxlUmVzLmRhdGE7XG4gICAgICAgICAgICBhaW1MaXN0W2FpbUxpc3RJZHhdLmltZ3NyYyA9IGRvd25sb2FkRmlsZVJlcy5kYXRhO1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXNwb25zZVtyZXBvcnRzSW5kZXhdKTsgICAgICAgICAgIC8vLy8vID8/Pz8/Pz8/Pz8/Pz9cbiAgICAgICAgICB9KTtcbiAgICAgICAgQWxsUmVwb3J0c1VybExpc3RbcmVwb3J0c0luZGV4XSA9IGBwb3N0LXJlcG9ydC5odG1sP2lkPSR7cmVwb3J0c0lkTGlzdFtyZXBvcnRzSW5kZXhdfWA7XG4gICAgICB9XG5cbiAgICAgICRzY29wZS5yZXBvcnRTdW0gPSByZXNwb25zZS5sZW5ndGg7XG4gICAgICAkc2NvcGUucGVuZGluZ1N1bSA9IHBlbmRpbmdVcmxMaXN0Lmxlbmd0aDtcbiAgICAgICRzY29wZS5pblJldmlld1N1bSA9IGluUmV2aWV3VXJsTGlzdC5sZW5ndGg7XG4gICAgICAkc2NvcGUucGFzc2VkU3VtID0gc3VjY2Vzc1VybExpc3QubGVuZ3RoO1xuICAgICAgJHNjb3BlLmZhaWxlZFN1bSA9IGZhaWxlZFVybExpc3QubGVuZ3RoO1xuICAgICAgJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsID0gcGVuZGluZ1VybExpc3Q7XG4gICAgICAkc2NvcGUuaW5SZXZpZXdSZXBvcnRzVXJsID0gaW5SZXZpZXdVcmxMaXN0O1xuICAgICAgJHNjb3BlLnBhc3NlZFJlcG9ydHNVcmwgPSBzdWNjZXNzVXJsTGlzdDtcbiAgICAgICRzY29wZS5mYWlsZWRSZXBvcnRzVXJsID0gZmFpbGVkVXJsTGlzdDtcblxuICAgICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsKTtcbiAgICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmluUmV2aWV3UmVwb3J0c1VybCk7XG4gICAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5wYXNzZWRSZXBvcnRzVXJsKTtcbiAgICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmZhaWxlZFJlcG9ydHNVcmwpO1xuXG4gICAgICAvKiBSZW1vdmUgbGF0LWxuZyBjb29yZGluYXRlcyB0aGF0IGFyZSBvbGRlciB0aGFuIDMwIGRheXMuICovXG4gICAgICB2YXIgdG9kYXkgPSBEYXRlLm5vdygpO1xuICAgICAgdmFyIGRhdCA9IG5ldyBEYXRlKHRvZGF5IC0gKDMwICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgICAgdmFyIGRkID0gZGF0LmdldERhdGUoKTtcbiAgICAgIHZhciBtbSA9IGRhdC5nZXRNb250aCgpICsgMTsgLy9KYW51YXJ5IGlzIDAhXG4gICAgICB2YXIgeXl5eSA9IGRhdC5nZXRGdWxsWWVhcigpO1xuXG4gICAgICBpZiAoZGQgPCAxMCkge1xuICAgICAgICBkZCA9ICcwJyArIGRkO1xuICAgICAgfVxuXG4gICAgICBpZiAobW0gPCAxMCkge1xuICAgICAgICBtbSA9ICcwJyArIG1tO1xuICAgICAgfVxuXG4gICAgICB2YXIgZXhwaXJlID0gbW0gKyAnLycgKyBkZCArICcvJyArIHl5eXk7XG4gICAgICAvL2NvbnNvbGUubG9nKFwiZXhwaXJlIFwiK2V4cGlyZSk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgJHNjb3BlLnN0YWMucHVzaChyZXNwb25zZVtpXS5sb2NhdGlvbi5zcGxpdCgnLCcpKTtcbiAgICAgICAgLypIYXMgYWxsIGxhdC1sbmcgY29vcmRpbmF0ZXMgKGluY2x1ZGluZyBvbGRlciB0aGFuIDMwIGRheXMpIC4qL1xuICAgICAgICAvL2NvbnNvbGUubG9nKHJlc3BvbnNlW2ldLmRhdGUpO1xuICAgICAgICBpZiAocmVzcG9uc2VbaV0uZGF0ZSA+IGV4cGlyZSkge1xuICAgICAgICAgICRzY29wZS5zdGFjay5wdXNoKHJlc3BvbnNlW2ldLmxvY2F0aW9uLnNwbGl0KCcsJykpO1xuICAgICAgICAgIC8qSGFzIGNvb3JkaW5hdGVzIHRoYXQgYXJlIG9ubHkgaW4gdGhlIGxhc3QgMzAgZGF5cy4qL1xuICAgICAgICAgIC8vY29uc29sZS5sb2coXCJubyBleHBpcmVcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8qIFJlbW92aW5nIGR1cGxpY2F0ZSBsYXQtbG5nIGNvb3JkaW5hdGVzICovXG4gICAgICB2YXIgbG9va3VwID0ge307XG4gICAgICB2YXIgaXRlbXMgPSAkc2NvcGUuc3RhY2s7XG4gICAgICBmb3IgKHZhciBpdGVtLCBpID0gMDsgaXRlbSA9IGl0ZW1zW2krK107KSB7XG5cbiAgICAgICAgdmFyIHVuaXF1ZV9sYXRsbmcgPSBpdGVtO1xuICAgICAgICBpZiAoISh1bmlxdWVfbGF0bG5nIGluIGxvb2t1cCkpIHtcbiAgICAgICAgICBsb29rdXBbdW5pcXVlX2xhdGxuZ10gPSAxO1xuICAgICAgICAgICRzY29wZS5yZXN1bHQucHVzaCh1bmlxdWVfbGF0bG5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlUGVuZGluZ1JlcG9ydHMgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV3RGF0YUxpc3QgPSBbXTtcbiAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsLCBmdW5jdGlvbiAodikge1xuICAgICAgaWYgKHYuaXNEZWxldGUpIHtcbiAgICAgICAgdi5pc0RlbGV0ZSA9IGZhbHNlO1xuICAgICAgICBjb25zdCByZXBvcnRJZCA9IHYudXJsLnNwbGl0KCc/JylbMV0uc3BsaXQoJyYnKVswXS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9kZWxldGVCYWRkcml2ZXJyZXBvcnRzLyR7cmVwb3J0SWR9YCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgfSkuc3VjY2VzcygoZGF0YSwgc3RhdHVzLCBoZWFkZXIsIGNvbmZpZykgPT4ge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTVUNDRVNTJyk7XG4gICAgICAgIH0pLmVycm9yKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3N0YXR1cyA6ICcgKyBzdGF0dXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0RhdGFMaXN0LnB1c2godik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsID0gbmV3RGF0YUxpc3Q7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5pblJldmlld1JlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLnBhc3NlZFJlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmZhaWxlZFJlcG9ydHNVcmwpO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVJblJldmlld1JlcG9ydHMgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV3RGF0YUxpc3QgPSBbXTtcbiAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLmluUmV2aWV3UmVwb3J0c1VybCwgZnVuY3Rpb24gKHYpIHtcbiAgICAgIGlmICh2LmlzRGVsZXRlKSB7XG4gICAgICAgIHYuaXNEZWxldGUgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgcmVwb3J0SWQgPSB2LnVybC5zcGxpdCgnPycpWzFdLnNwbGl0KCcmJylbMF0uc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIHVybDogYCR7YmFja2VuZFVybH0vZGVsZXRlQmFkZHJpdmVycmVwb3J0cy8ke3JlcG9ydElkfWAsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgIH0pLnN1Y2Nlc3MoKGRhdGEsIHN0YXR1cywgaGVhZGVyLCBjb25maWcpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnU1VDQ0VTUycpO1xuICAgICAgICB9KS5lcnJvcigoZGF0YSwgc3RhdHVzLCBoZWFkZXIsIGNvbmZpZykgPT4ge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdzdGF0dXMgOiAnICsgc3RhdHVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdEYXRhTGlzdC5wdXNoKHYpO1xuICAgICAgfVxuICAgIH0pO1xuICAgICRzY29wZS5pblJldmlld1JlcG9ydHNVcmwgPSBuZXdEYXRhTGlzdDtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybCA9IGFuZ3VsYXIuY29weSgkc2NvcGUucGVuZGluZ1JlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmluUmV2aWV3UmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUucGFzc2VkUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuZmFpbGVkUmVwb3J0c1VybCk7XG4gIH07XG5cbiAgJHNjb3BlLnJlbW92ZVBhc3NlZFJlcG9ydHMgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV3RGF0YUxpc3QgPSBbXTtcbiAgICBhbmd1bGFyLmZvckVhY2goJHNjb3BlLnBhc3NlZFJlcG9ydHNVcmwsICh2KSA9PiB7XG4gICAgICBpZiAodi5pc0RlbGV0ZSkge1xuICAgICAgICB2LmlzRGVsZXRlID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHJlcG9ydElkID0gdi51cmwuc3BsaXQoJz8nKVsxXS5zcGxpdCgnJicpWzBdLnNwbGl0KCc9JylbMV07XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6IGAke2JhY2tlbmRVcmx9L2RlbGV0ZUJhZGRyaXZlcnJlcG9ydHMvJHtyZXBvcnRJZH1gLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB9KS5zdWNjZXNzKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ1NVQ0NFU1MnKTtcbiAgICAgICAgfSkuZXJyb3IoKGRhdGEsIHN0YXR1cywgaGVhZGVyLCBjb25maWcpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RhdHVzIDogJyArIHN0YXR1cyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3RGF0YUxpc3QucHVzaCh2KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAkc2NvcGUucGFzc2VkUmVwb3J0c1VybCA9IG5ld0RhdGFMaXN0O1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsID0gYW5ndWxhci5jb3B5KCRzY29wZS5wZW5kaW5nUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuaW5SZXZpZXdSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5wYXNzZWRSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5mYWlsZWRSZXBvcnRzVXJsKTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlRmFpbGVkUmVwb3J0cyA9ICgpID0+IHtcbiAgICBjb25zdCBuZXdEYXRhTGlzdCA9IFtdO1xuICAgIGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuZmFpbGVkUmVwb3J0c1VybCwgKHYpID0+IHtcbiAgICAgIGlmICh2LmlzRGVsZXRlKSB7XG4gICAgICAgIHYuaXNEZWxldGUgPSBmYWxzZTtcbiAgICAgICAgLy8gLi4uL3Bvc3RfcmVwb3J0Lmh0bWw/cmVwb3J0SWQ9eHh4JlxuICAgICAgICBjb25zdCByZXBvcnRJZCA9IHYudXJsLnNwbGl0KCc/JylbMV0uc3BsaXQoJyYnKVswXS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9kZWxldGVCYWRkcml2ZXJyZXBvcnRzLyR7cmVwb3J0SWR9YCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgfSkuc3VjY2VzcygoZGF0YSwgc3RhdHVzLCBoZWFkZXIsIGNvbmZpZykgPT4ge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTVUNDRVNTJyk7XG4gICAgICAgIH0pLmVycm9yKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3N0YXR1cyA6ICcgKyBzdGF0dXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0RhdGFMaXN0LnB1c2godik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgJHNjb3BlLmZhaWxlZFJlcG9ydHNVcmwgPSBuZXdEYXRhTGlzdDtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybCA9IGFuZ3VsYXIuY29weSgkc2NvcGUucGVuZGluZ1JlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmluUmV2aWV3UmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUucGFzc2VkUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuZmFpbGVkUmVwb3J0c1VybCk7XG4gIH07XG5cbiAgJHNjb3BlLmxvZ291dCA9ICgpID0+IHtcbiAgICAkaHR0cC5nZXQoYCR7YmFja2VuZFVybH0vbG9nb3V0YCwgeyB3aXRoQ3JlZGVudGlhbHM6IHRydWUgfSkudGhlbigoKSA9PiB7XG4gICAgICAvLyBsb2dvdXQgc3VjY2Vzc1xuICAgICAgd2luZG93LmxvY2F0aW9uID0gJ2luZGV4Lmh0bWwnO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVDdXJQZW5kaW5nUmVwb3J0ID0gKGkpID0+IHtcblxuICAgIGNvbnN0IHJlcG9ydElkID0gcGVuZGluZ1VybExpc3RbaV0udXJsLnNwbGl0KCc/JylbMV0uc3BsaXQoJyYnKVswXS5zcGxpdCgnPScpWzFdO1xuICAgICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6IGAke2JhY2tlbmRVcmx9L2RlbGV0ZUJhZGRyaXZlcnJlcG9ydHMvJHtyZXBvcnRJZH1gLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB9KS5zdWNjZXNzKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ1NVQ0NFU1MnKTtcbiAgICAgICAgfSkuZXJyb3IoKGRhdGEsIHN0YXR1cywgaGVhZGVyLCBjb25maWcpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RhdHVzIDogJyArIHN0YXR1cyk7XG4gICAgICAgIH0pO1xuXG4gICAgcGVuZGluZ1VybExpc3Quc3BsaWNlKGksIDEpO1xuICAgICRzY29wZS5wZW5kaW5nUmVwb3J0c1VybCA9IHBlbmRpbmdVcmxMaXN0O1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsID0gYW5ndWxhci5jb3B5KCRzY29wZS5wZW5kaW5nUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuaW5SZXZpZXdSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5wYXNzZWRSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5mYWlsZWRSZXBvcnRzVXJsKTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlQ3VySW5SZXZpZXdSZXBvcnQgPSAoaSkgPT4ge1xuXG4gICAgY29uc3QgcmVwb3J0SWQgPSBpblJldmlld1VybExpc3RbaV0udXJsLnNwbGl0KCc/JylbMV0uc3BsaXQoJyYnKVswXS5zcGxpdCgnPScpWzFdO1xuICAgICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6IGAke2JhY2tlbmRVcmx9L2RlbGV0ZUJhZGRyaXZlcnJlcG9ydHMvJHtyZXBvcnRJZH1gLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB9KS5zdWNjZXNzKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ1NVQ0NFU1MnKTtcbiAgICAgICAgfSkuZXJyb3IoKGRhdGEsIHN0YXR1cywgaGVhZGVyLCBjb25maWcpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RhdHVzIDogJyArIHN0YXR1cyk7XG4gICAgICAgIH0pO1xuXG4gICAgaW5SZXZpZXdVcmxMaXN0LnNwbGljZShpLCAxKTtcbiAgICAkc2NvcGUuaW5SZXZpZXdSZXBvcnRzVXJsID0gaW5SZXZpZXdVcmxMaXN0O1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsID0gYW5ndWxhci5jb3B5KCRzY29wZS5wZW5kaW5nUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuaW5SZXZpZXdSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5wYXNzZWRSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5mYWlsZWRSZXBvcnRzVXJsKTtcbiAgfTtcblxuICAkc2NvcGUucmVtb3ZlQ3VyUGFzc2VkUmVwb3J0ID0gKGkpID0+IHtcblxuICAgIGNvbnN0IHJlcG9ydElkID0gc3VjY2Vzc1VybExpc3RbaV0udXJsLnNwbGl0KCc/JylbMV0uc3BsaXQoJyYnKVswXS5zcGxpdCgnPScpWzFdO1xuICAgICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICB1cmw6IGAke2JhY2tlbmRVcmx9L2RlbGV0ZUJhZGRyaXZlcnJlcG9ydHMvJHtyZXBvcnRJZH1gLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB9KS5zdWNjZXNzKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ1NVQ0NFU1MnKTtcbiAgICAgICAgfSkuZXJyb3IoKGRhdGEsIHN0YXR1cywgaGVhZGVyLCBjb25maWcpID0+IHtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RhdHVzIDogJyArIHN0YXR1cyk7XG4gICAgICAgIH0pO1xuXG4gICAgc3VjY2Vzc1VybExpc3Quc3BsaWNlKGksIDEpO1xuICAgICRzY29wZS5wYXNzZWRSZXBvcnRzVXJsID0gc3VjY2Vzc1VybExpc3Q7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnBlbmRpbmdSZXBvcnRzVXJsKTtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybC5wdXNoKC4uLiRzY29wZS5pblJldmlld1JlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLnBhc3NlZFJlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmZhaWxlZFJlcG9ydHNVcmwpO1xuICB9O1xuXG4gICRzY29wZS5yZW1vdmVDdXJmYWlsZWRSZXBvcnQgPSAoaSkgPT4ge1xuXG4gICAgY29uc3QgcmVwb3J0SWQgPSBmYWlsZWRVcmxMaXN0W2ldLnVybC5zcGxpdCgnPycpWzFdLnNwbGl0KCcmJylbMF0uc3BsaXQoJz0nKVsxXTtcbiAgICAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9kZWxldGVCYWRkcml2ZXJyZXBvcnRzLyR7cmVwb3J0SWR9YCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgfSkuc3VjY2VzcygoZGF0YSwgc3RhdHVzLCBoZWFkZXIsIGNvbmZpZykgPT4ge1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTVUNDRVNTJyk7XG4gICAgICAgIH0pLmVycm9yKChkYXRhLCBzdGF0dXMsIGhlYWRlciwgY29uZmlnKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ3N0YXR1cyA6ICcgKyBzdGF0dXMpO1xuICAgICAgICB9KTtcblxuICAgIGZhaWxlZFVybExpc3Quc3BsaWNlKGksIDEpO1xuICAgICRzY29wZS5mYWlsZWRSZXBvcnRzVXJsID0gZmFpbGVkVXJsTGlzdDtcbiAgICAkc2NvcGUuYWxsUmVwb3J0c1VybCA9IGFuZ3VsYXIuY29weSgkc2NvcGUucGVuZGluZ1JlcG9ydHNVcmwpO1xuICAgICRzY29wZS5hbGxSZXBvcnRzVXJsLnB1c2goLi4uJHNjb3BlLmluUmV2aWV3UmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUucGFzc2VkUmVwb3J0c1VybCk7XG4gICAgJHNjb3BlLmFsbFJlcG9ydHNVcmwucHVzaCguLi4kc2NvcGUuZmFpbGVkUmVwb3J0c1VybCk7XG4gIH07XG5cbn1dKTtcbiJdfQ==
