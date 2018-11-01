const app = angular.module('AccountApp', []);
app.controller('displayData', ['$scope', '$http', ($scope, $http) => {
  const backendUrl = 'https://cloudserver.carma-cam.com';

  // .html?accountId=xxx
  const [, accountId] = window.location.search.split('=');
  $scope.stack = [];
  $scope.result = [];
  $scope.stac = [];
  $scope.center_lat = '';
  $scope.center_lng = '';
  $scope.loadHello = () => {
    $http({
      method: 'GET',
      url: `${backendUrl}/accounts/${encodeURIComponent(accountId)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'authorization': $scope.token}, // changed line
      withCredentials: true,
    }).success((response) => {
      if (!response.zipcode || response.zipcode === '') {
        // if there is no zipcode field or zipcode is invalid set default center to campus
        $scope.center_lat = '34.022352';
        $scope.center_lng = '-118.285117';
      } else {
        const address = response.zipcode;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK) {
            $scope.center_lat = results[0].geometry.location.lat();
            $scope.center_lng = results[0].geometry.location.lng();
          } else {
            alert(`Geocode was not successful for the following reason: ${status}`);
          }
        });
      }

      $scope.name = `${response.fname} ${response.lname}`;
      $scope.licensePlateNo = response.licensePlate;
      $scope.phoneNo = response.phone;
      $scope.rewards = response.rewards;
      $scope.zipcode = response.zipcode;
      $scope.getReports();
    }).error(() => {
       // server response with an error status also goes here
      const errorMsg = (err.error) ? err.error : err;
      $scope.error = `Server error: ${errorMsg}`;
    });
  };

  const reportsIdList = []; // getting all reports objects under this user
  const AllReportsUrlList = []; // collecting link url
  const failedUrlList = []; // failed reports url list
  const successUrlList = []; // success reports url list
  const pendingUrlList = []; // under audit prograss reports url list
  const inReviewUrlList = []; // reports in review process

  const reportImgIdList = [];

  let reportsIndex; // All reports url index, remove later if no use
  let pendingUrlIndex; // pending reports url index
  let passedUrlIndex; // passed reports url index
  let failedUrlIndex; // failed reports url index
  let inReviewUrlIndex; // reports in review process url index

  $scope.getReports = () => {
    $http({
      method: 'GET',
      url: `${backendUrl}/accounts/${$scope.phoneNo}/baddriverreports`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true,
    }).success((response) => {
      //console.log(response);
      pendingUrlIndex = 0;
      inReviewUrlIndex = 0;
      passedUrlIndex = 0;
      failedUrlIndex = 0;

      // eslint-disable-next-line no-plusplus
      for (reportsIndex = 0; reportsIndex < response.length; reportsIndex++) {
        // eslint-disable-next-line no-underscore-dangle
        reportsIdList[reportsIndex] = response[reportsIndex]._id;
        let aimList = '';
        let aimListIdx = '';
        if (response[reportsIndex].status === 'uploaded') {
          aimList = pendingUrlList;
          aimListIdx = pendingUrlIndex;
          // eslint-disable-next-line no-plusplus
          //var curIndex = pendingUrlIndex;
          pendingUrlList[pendingUrlIndex++] = {
            isDelete: false,
            url: `post-report.html?reportId=${reportsIdList[reportsIndex]}&accountId=${accountId}`,
            imgsrc: '',
            time: response[reportsIndex].time,
          };
        }
        if (response[reportsIndex].status === 'reported') {
          aimList = inReviewUrlList;
          aimListIdx = inReviewUrlIndex;
          // eslint-disable-next-line no-plusplus
          //var curIndex = pendingUrlIndex;
          inReviewUrlList[inReviewUrlIndex++] = {
            isDelete: false,
            url: `post-report.html?reportId=${reportsIdList[reportsIndex]}&accountId=${accountId}`,
            imgsrc: '',
            time: response[reportsIndex].time,
          };
        }
        if (response[reportsIndex].status === 'success') {
          aimList = successUrlList;
          aimListIdx = passedUrlIndex;
          // eslint-disable-next-line no-plusplus
          successUrlList[passedUrlIndex++] = {
            isDelete: false,
            url: `post-report.html?reportId=${reportsIdList[reportsIndex]}&accountId=${accountId}`,
            imgsrc: '',
            time: response[reportsIndex].time,
          };
        }

        if (response[reportsIndex].status === 'failure') {
          aimList = failedUrlList;
          aimListIdx = failedUrlIndex;
          // eslint-disable-next-line no-plusplus
          failedUrlList[failedUrlIndex++] = {
            isDelete: false,
            url: `post-report.html?reportId=${reportsIdList[reportsIndex]}&accountId=${accountId}`,
            imgsrc: '',
            time: response[reportsIndex].time,
          };
        }
        $http.get(`https://cloudserver.carma-cam.com/downloadFile/${response[reportsIndex].capturedImage}`)
          .then((downloadFileRes) => {
            //$scope.imgtest = downloadFileRes.data;
            aimList[aimListIdx].imgsrc = downloadFileRes.data;
            //console.log(response[reportsIndex]);           ///// ?????????????
          });
        AllReportsUrlList[reportsIndex] = `post-report.html?id=${reportsIdList[reportsIndex]}`;
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
      $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
      $scope.allReportsUrl.push(...$scope.passedReportsUrl);
      $scope.allReportsUrl.push(...$scope.failedReportsUrl);

      /* Remove lat-lng coordinates that are older than 30 days. */
      var today = Date.now();
      var dat = new Date(today - (30 * 24 * 60 * 60 * 1000));
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
    }).error(function () {
    });
  };

  $scope.removePendingReports = () => {
    const newDataList = [];
    angular.forEach($scope.pendingReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        const reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.pendingReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removeInReviewReports = () => {
    const newDataList = [];
    angular.forEach($scope.inReviewReportsUrl, function (v) {
      if (v.isDelete) {
        v.isDelete = false;
        const reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.inReviewReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removePassedReports = () => {
    const newDataList = [];
    angular.forEach($scope.passedReportsUrl, (v) => {
      if (v.isDelete) {
        v.isDelete = false;
        const reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.passedReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removeFailedReports = () => {
    const newDataList = [];
    angular.forEach($scope.failedReportsUrl, (v) => {
      if (v.isDelete) {
        v.isDelete = false;
        // .../post_report.html?reportId=xxx&
        const reportId = v.url.split('?')[1].split('&')[0].split('=')[1];
        $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });
      } else {
        newDataList.push(v);
      }
    });
    $scope.failedReportsUrl = newDataList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.logout = () => {
    $http.get(`${backendUrl}/logout`, { withCredentials: true }).then(() => {
      // logout success
      window.location = 'index.html';
    });
  };

  $scope.removeCurPendingReport = (i) => {

    const reportId = pendingUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });

    pendingUrlList.splice(i, 1);
    $scope.pendingReportsUrl = pendingUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removeCurInReviewReport = (i) => {

    const reportId = inReviewUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });

    inReviewUrlList.splice(i, 1);
    $scope.inReviewReportsUrl = inReviewUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removeCurPassedReport = (i) => {

    const reportId = successUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });

    successUrlList.splice(i, 1);
    $scope.passedReportsUrl = successUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

  $scope.removeCurfailedReport = (i) => {

    const reportId = failedUrlList[i].url.split('?')[1].split('&')[0].split('=')[1];
    $http({
          method: 'POST',
          url: `${backendUrl}/deleteBaddriverreports/${reportId}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          withCredentials: true,
        }).success((data, status, header, config) => {
          // console.log('SUCCESS');
        }).error((data, status, header, config) => {
          // console.log('status : ' + status);
        });

    failedUrlList.splice(i, 1);
    $scope.failedReportsUrl = failedUrlList;
    $scope.allReportsUrl = angular.copy($scope.pendingReportsUrl);
    $scope.allReportsUrl.push(...$scope.inReviewReportsUrl);
    $scope.allReportsUrl.push(...$scope.passedReportsUrl);
    $scope.allReportsUrl.push(...$scope.failedReportsUrl);
  };

}]);
