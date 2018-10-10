'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var app = angular.module('myfirstangularapp', []);

app.controller('mycontroller', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {
  var backendUrl = 'https://cloudserver.carma-cam.com';
  // ?reportId=xx&accountId=xx

  var _window$location$sear = window.location.search.split('&'),
      _window$location$sear2 = _slicedToArray(_window$location$sear, 2),
      reportData = _window$location$sear2[0],
      accountData = _window$location$sear2[1];

  var _reportData$split = reportData.split('='),
      _reportData$split2 = _slicedToArray(_reportData$split, 2),
      reportId = _reportData$split2[1];

  var _accountData$split = accountData.split('='),
      _accountData$split2 = _slicedToArray(_accountData$split, 2),
      accountId = _accountData$split2[1];

  $scope.loadVideo = function () {
    $http({
      method: 'GET',
      url: backendUrl + '/baddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true
    }).success(function (response) {
      var timestamp = response.time;
      var times = timestamp.split(' ');

      var _times = _slicedToArray(times, 2);

      $scope.date = _times[0];
      $scope.time = _times[1];

      $scope.location = response.location;
      // eslint-disable-next-line no-undef
      initMap();
      $scope.vidId = response.videoClip;
      // eslint-disable-next-line no-underscore-dangle
      $scope.reportId = response._id;
      if (response.capturedImage !== null) {
        var img = document.getElementById('image');
        $http.get(backendUrl + '/downloadFile/' + response.capturedImage)
        // TODO: maybe can just set ref without doing get request, like what we did to vid.src below
        .then(function (downloadFileRes) {
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

      var vid = document.getElementById('video');
      vid.src = backendUrl + '/downloadFile/' + $scope.vidId;
    });
  };

  $scope.postResults = function () {
    $http({
      method: 'POST',
      url: backendUrl + '/updateBaddriverreports/' + reportId,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest: function transformRequest() {
        var str = [];
        str.push('licensePlateNumber=' + $scope.lpnumber);
        str.push('vehicleDescription=' + $scope.vdesc);
        str.push('licenseState=' + $scope.state);
        str.push('severity=' + $scope.severity);
        str.push('category=' + $scope.category);
        str.push('incidentDescription=' + $scope.idesc);
        return str.join('&');
      },

      withCredentials: true
    }).success(function () {
      bootbox.alert('Report was posted successfully.');
    });
  };

  $scope.callCapture = function () {
    window.location = 'extract-image.html?videoId=' + $scope.vidId + '&reportId=' + reportId + '&accountId=' + accountId;
  };

  $scope.clickHome = function () {
    window.location = 'myAccount.html?accountId=' + accountId;
  };

  $scope.cancelReport = function () {
    bootbox.confirm({
      message: 'Are you sure you want to cancel the report? All changes will be lost.',
      buttons: {
        confirm: {
          label: 'Yes',
          className: 'btn-success'
        },
        cancel: {
          label: 'No',
          className: 'btn-danger'
        }
      },
      callback: function callback(confirmed) {
        if (confirmed) {
          window.location = 'myAccount.html?accountId=' + accountId;
        }
      }
    });
  };
}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvc3QtcmVwb3J0LmpzIl0sIm5hbWVzIjpbImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb250cm9sbGVyIiwiJHNjb3BlIiwiJGh0dHAiLCIkc2NlIiwiYmFja2VuZFVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwic2VhcmNoIiwic3BsaXQiLCJyZXBvcnREYXRhIiwiYWNjb3VudERhdGEiLCJyZXBvcnRJZCIsImFjY291bnRJZCIsImxvYWRWaWRlbyIsIm1ldGhvZCIsInVybCIsImhlYWRlcnMiLCJ3aXRoQ3JlZGVudGlhbHMiLCJzdWNjZXNzIiwicmVzcG9uc2UiLCJ0aW1lc3RhbXAiLCJ0aW1lIiwidGltZXMiLCJkYXRlIiwiaW5pdE1hcCIsInZpZElkIiwidmlkZW9DbGlwIiwiX2lkIiwiY2FwdHVyZWRJbWFnZSIsImltZyIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJnZXQiLCJ0aGVuIiwiZG93bmxvYWRGaWxlUmVzIiwic3JjIiwiZGF0YSIsInN0YXR1cyIsImNhdGVnb3J5IiwibHBudW1iZXIiLCJsaWNlbnNlUGxhdGVOdW1iZXIiLCJzZXZlcml0eSIsInZkZXNjIiwidmVoaWNsZURlc2NyaXB0aW9uIiwiaWRlc2MiLCJpbmNpZGVudERlc2NyaXB0aW9uIiwic3RhdGUiLCJsaWNlbnNlU3RhdGUiLCJ2aWQiLCJwb3N0UmVzdWx0cyIsInRyYW5zZm9ybVJlcXVlc3QiLCJzdHIiLCJwdXNoIiwiam9pbiIsImJvb3Rib3giLCJhbGVydCIsImNhbGxDYXB0dXJlIiwiY2xpY2tIb21lIiwiY2FuY2VsUmVwb3J0IiwiY29uZmlybSIsIm1lc3NhZ2UiLCJidXR0b25zIiwibGFiZWwiLCJjbGFzc05hbWUiLCJjYW5jZWwiLCJjYWxsYmFjayIsImNvbmZpcm1lZCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLE1BQU1DLFFBQVFDLE1BQVIsQ0FBZSxtQkFBZixFQUFvQyxFQUFwQyxDQUFaOztBQUVBRixJQUFJRyxVQUFKLENBQWUsY0FBZixF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NUI7QUFDQWEsWUFBSUMsSUFBSiwwQkFBZ0NuRCxPQUFPMkMsS0FBdkM7QUFDQSxlQUFPTyxJQUFJRSxJQUFKLENBQVMsR0FBVCxDQUFQO0FBQ0QsT0FiRzs7QUFjSnBDLHVCQUFpQjtBQWRiLEtBQU4sRUFlR0MsT0FmSCxDQWVXLFlBQU07QUFDZm9DLGNBQVFDLEtBQVIsQ0FBYyxpQ0FBZDtBQUNELEtBakJEO0FBa0JELEdBbkJEOztBQXFCQXRELFNBQU91RCxXQUFQLEdBQXFCLFlBQU07QUFDekJuRCxXQUFPQyxRQUFQLG1DQUFnREwsT0FBT3dCLEtBQXZELGtCQUF5RWQsUUFBekUsbUJBQStGQyxTQUEvRjtBQUNELEdBRkQ7O0FBSUFYLFNBQU93RCxTQUFQLEdBQW1CLFlBQU07QUFDdkJwRCxXQUFPQyxRQUFQLGlDQUE4Q00sU0FBOUM7QUFDRCxHQUZEOztBQUlBWCxTQUFPeUQsWUFBUCxHQUFzQixZQUFNO0FBQzFCSixZQUFRSyxPQUFSLENBQWdCO0FBQ2RDLGVBQVMsdUVBREs7QUFFZEMsZUFBUztBQUNQRixpQkFBUztBQUNQRyxpQkFBTyxLQURBO0FBRVBDLHFCQUFXO0FBRkosU0FERjtBQUtQQyxnQkFBUTtBQUNORixpQkFBTyxJQUREO0FBRU5DLHFCQUFXO0FBRkw7QUFMRCxPQUZLO0FBWWRFLGdCQUFVLGtCQUFDQyxTQUFELEVBQWU7QUFDdkIsWUFBSUEsU0FBSixFQUFlO0FBQ2I3RCxpQkFBT0MsUUFBUCxpQ0FBOENNLFNBQTlDO0FBQ0Q7QUFDRjtBQWhCYSxLQUFoQjtBQWtCRCxHQW5CRDtBQW9CRCxDQS9GOEIsQ0FBL0IiLCJmaWxlIjoicG9zdC1yZXBvcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnbXlmaXJzdGFuZ3VsYXJhcHAnLCBbXSk7XG5cbmFwcC5jb250cm9sbGVyKCdteWNvbnRyb2xsZXInLCBbJyRzY29wZScsICckaHR0cCcsICckc2NlJywgKCRzY29wZSwgJGh0dHAsICRzY2UpID0+IHtcbiAgY29uc3QgYmFja2VuZFVybCA9ICdodHRwczovL2Nsb3Vkc2VydmVyLmNhcm1hLWNhbS5jb20nO1xuICAvLyA/cmVwb3J0SWQ9eHgmYWNjb3VudElkPXh4XG4gIGNvbnN0IFtyZXBvcnREYXRhLCBhY2NvdW50RGF0YV0gPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNwbGl0KCcmJyk7XG4gIGNvbnN0IFssIHJlcG9ydElkXSA9IHJlcG9ydERhdGEuc3BsaXQoJz0nKTtcbiAgY29uc3QgWywgYWNjb3VudElkXSA9IGFjY291bnREYXRhLnNwbGl0KCc9Jyk7XG5cbiAgJHNjb3BlLmxvYWRWaWRlbyA9ICgpID0+IHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9iYWRkcml2ZXJyZXBvcnRzLyR7cmVwb3J0SWR9YCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgfSkuc3VjY2VzcygocmVzcG9uc2UpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IHJlc3BvbnNlLnRpbWU7XG4gICAgICBjb25zdCB0aW1lcyA9IHRpbWVzdGFtcC5zcGxpdCgnICcpO1xuICAgICAgWyRzY29wZS5kYXRlLCAkc2NvcGUudGltZV0gPSB0aW1lcztcbiAgICAgICRzY29wZS5sb2NhdGlvbiA9IHJlc3BvbnNlLmxvY2F0aW9uO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICBpbml0TWFwKCk7XG4gICAgICAkc2NvcGUudmlkSWQgPSByZXNwb25zZS52aWRlb0NsaXA7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICAgICRzY29wZS5yZXBvcnRJZCA9IHJlc3BvbnNlLl9pZDtcbiAgICAgIGlmIChyZXNwb25zZS5jYXB0dXJlZEltYWdlICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGltZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZScpO1xuICAgICAgICAkaHR0cC5nZXQoYCR7YmFja2VuZFVybH0vZG93bmxvYWRGaWxlLyR7cmVzcG9uc2UuY2FwdHVyZWRJbWFnZX1gKVxuICAgICAgICAvLyBUT0RPOiBtYXliZSBjYW4ganVzdCBzZXQgcmVmIHdpdGhvdXQgZG9pbmcgZ2V0IHJlcXVlc3QsIGxpa2Ugd2hhdCB3ZSBkaWQgdG8gdmlkLnNyYyBiZWxvd1xuICAgICAgICAgIC50aGVuKChkb3dubG9hZEZpbGVSZXMpID0+IHtcbiAgICAgICAgICAgIGltZy5zcmMgPSBkb3dubG9hZEZpbGVSZXMuZGF0YTtcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gJ3JlcG9ydGVkJykge1xuICAgICAgICAkc2NvcGUuY2F0ZWdvcnkgPSByZXNwb25zZS5jYXRlZ29yeTtcbiAgICAgICAgJHNjb3BlLmxwbnVtYmVyID0gcmVzcG9uc2UubGljZW5zZVBsYXRlTnVtYmVyO1xuICAgICAgICAkc2NvcGUuc2V2ZXJpdHkgPSByZXNwb25zZS5zZXZlcml0eTtcbiAgICAgICAgJHNjb3BlLnZkZXNjID0gcmVzcG9uc2UudmVoaWNsZURlc2NyaXB0aW9uO1xuICAgICAgICAkc2NvcGUuaWRlc2MgPSByZXNwb25zZS5pbmNpZGVudERlc2NyaXB0aW9uO1xuICAgICAgICAkc2NvcGUuc3RhdGUgPSByZXNwb25zZS5saWNlbnNlU3RhdGU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZpZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWRlbycpO1xuICAgICAgdmlkLnNyYyA9IGAke2JhY2tlbmRVcmx9L2Rvd25sb2FkRmlsZS8keyRzY29wZS52aWRJZH1gO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5wb3N0UmVzdWx0cyA9ICgpID0+IHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogYCR7YmFja2VuZFVybH0vdXBkYXRlQmFkZHJpdmVycmVwb3J0cy8ke3JlcG9ydElkfWAsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgdHJhbnNmb3JtUmVxdWVzdCgpIHtcbiAgICAgICAgY29uc3Qgc3RyID0gW107XG4gICAgICAgIHN0ci5wdXNoKGBsaWNlbnNlUGxhdGVOdW1iZXI9JHskc2NvcGUubHBudW1iZXJ9YCk7XG4gICAgICAgIHN0ci5wdXNoKGB2ZWhpY2xlRGVzY3JpcHRpb249JHskc2NvcGUudmRlc2N9YCk7XG4gICAgICAgIHN0ci5wdXNoKGBsaWNlbnNlU3RhdGU9JHskc2NvcGUuc3RhdGV9YCk7XG4gICAgICAgIHN0ci5wdXNoKGBzZXZlcml0eT0keyRzY29wZS5zZXZlcml0eX1gKTtcbiAgICAgICAgc3RyLnB1c2goYGNhdGVnb3J5PSR7JHNjb3BlLmNhdGVnb3J5fWApO1xuICAgICAgICBzdHIucHVzaChgaW5jaWRlbnREZXNjcmlwdGlvbj0keyRzY29wZS5pZGVzY31gKTtcbiAgICAgICAgcmV0dXJuIHN0ci5qb2luKCcmJyk7XG4gICAgICB9LFxuICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgIH0pLnN1Y2Nlc3MoKCkgPT4ge1xuICAgICAgYm9vdGJveC5hbGVydCgnUmVwb3J0IHdhcyBwb3N0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5jYWxsQ2FwdHVyZSA9ICgpID0+IHtcbiAgICB3aW5kb3cubG9jYXRpb24gPSBgZXh0cmFjdC1pbWFnZS5odG1sP3ZpZGVvSWQ9JHskc2NvcGUudmlkSWR9JnJlcG9ydElkPSR7cmVwb3J0SWR9JmFjY291bnRJZD0ke2FjY291bnRJZH1gO1xuICB9O1xuXG4gICRzY29wZS5jbGlja0hvbWUgPSAoKSA9PiB7XG4gICAgd2luZG93LmxvY2F0aW9uID0gYG15QWNjb3VudC5odG1sP2FjY291bnRJZD0ke2FjY291bnRJZH1gO1xuICB9O1xuXG4gICRzY29wZS5jYW5jZWxSZXBvcnQgPSAoKSA9PiB7XG4gICAgYm9vdGJveC5jb25maXJtKHtcbiAgICAgIG1lc3NhZ2U6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gY2FuY2VsIHRoZSByZXBvcnQ/IEFsbCBjaGFuZ2VzIHdpbGwgYmUgbG9zdC4nLFxuICAgICAgYnV0dG9uczoge1xuICAgICAgICBjb25maXJtOiB7XG4gICAgICAgICAgbGFiZWw6ICdZZXMnLFxuICAgICAgICAgIGNsYXNzTmFtZTogJ2J0bi1zdWNjZXNzJyxcbiAgICAgICAgfSxcbiAgICAgICAgY2FuY2VsOiB7XG4gICAgICAgICAgbGFiZWw6ICdObycsXG4gICAgICAgICAgY2xhc3NOYW1lOiAnYnRuLWRhbmdlcicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY2FsbGJhY2s6IChjb25maXJtZWQpID0+IHtcbiAgICAgICAgaWYgKGNvbmZpcm1lZCkge1xuICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGBteUFjY291bnQuaHRtbD9hY2NvdW50SWQ9JHthY2NvdW50SWR9YDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcbiAgfTtcbn1dKTtcbiJdfQ==
