const app = angular.module('myfirstangularapp', []);

app.controller('mycontroller', ['$scope', '$http', '$sce', ($scope, $http, $sce) => {
  // const backendUrl = 'https://cloudserver.carma-cam.com';
  const backendUrl = 'http://0.0.0.0:9001';
  // ?reportId=xx&accountId=xx
  const [reportData, accountData] = window.location.search.split('&');
  const [, reportId] = reportData.split('=');
  const [, accountId] = accountData.split('=');

  $scope.loadVideo = () => {
    $http({
      method: 'GET',
      url: `${backendUrl}/baddriverreports/${reportId}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true,
    }).success((response) => {
      const timestamp = response.time;
      const times = timestamp.split(' ');
      [$scope.date, $scope.time] = times;
      $scope.location = response.location;
      // eslint-disable-next-line no-undef
      initMap();
      $scope.vidId = response.videoClip;
      // eslint-disable-next-line no-underscore-dangle
      $scope.reportId = response._id;
      if (response.capturedImage !== null) {
        const img = document.getElementById('image');
        $http.get(`${backendUrl}/downloadFile/${response.capturedImage}`)
        // TODO: maybe can just set ref without doing get request, like what we did to vid.src below
          .then((downloadFileRes) => {
            img.src = downloadFileRes.data;
          });
      }

      if (response.status === 'reported') {
        $scope.category = response.category;
        $scope.lpnumber = response.licensePlateNumber;
        $scope.severity = response.severity;
        $scope.vdesc = response.vehicleDescription;
        $scope.idesc = response.incidentDescription;
        $scope.state = response.licenseState;
      }

      const vid = document.getElementById('video');
      vid.src = `${backendUrl}/downloadFile/${$scope.vidId}`;
    });
  };

  $scope.postResults = () => {
    $http({
      method: 'POST',
      url: `${backendUrl}/updateBaddriverreports/${reportId}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest() {
        const str = [];
        str.push(`licensePlateNumber=${$scope.lpnumber}`);
        str.push(`vehicleDescription=${$scope.vdesc}`);
        str.push(`licenseState=${$scope.state}`);
        str.push(`severity=${$scope.severity}`);
        str.push(`category=${$scope.category}`);
        str.push(`incidentDescription=${$scope.idesc}`);
        return str.join('&');
      },
      withCredentials: true,
    }).success(() => {
      bootbox.alert('Report was posted successfully.');
    });
  };

  $scope.callCapture = () => {
    window.location = `extract-image.html?videoId=${$scope.vidId}&reportId=${reportId}&accountId=${accountId}`;
  };

  $scope.clickHome = () => {
    window.location = `myAccount.html?accountId=${accountId}`;
  };

  $scope.cancelReport = () => {
    bootbox.confirm({
      message: 'Are you sure you want to cancel the report? All changes will be lost.',
      buttons: {
        confirm: {
          label: 'Yes',
          className: 'btn-success',
        },
        cancel: {
          label: 'No',
          className: 'btn-danger',
        },
      },
      callback: (confirmed) => {
        if (confirmed) {
          window.location = `myAccount.html?accountId=${accountId}`;
        }
      },
    });
  };
}]);
