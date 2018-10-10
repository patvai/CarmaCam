'use strict';

/* eslint-disable no-underscore-dangle */
$('#phone').intlTelInput();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {
  var backendUrl = 'https://cloudserver.carma-cam.com';

  $http.get(backendUrl + '/loginWithCookie', { withCredentials: true }).then(function (res) {
    if (res.error || !res.data || !res.data._id) {
      return;
    }

    window.location = 'myAccount.html?_id=' + res.data._id;
  });

  $scope.signup = function () {
    window.location = 'register.html';
  };

  $scope.forgotPassword = function () {
    window.location = 'forgotPassword.html';
  };

  $scope.submitData = function () {
    if ($scope.phone === '' || $scope.password === '') {
      $scope.error = 'Please enter all the details';
      return;
    }

    // TODO: find a way to notify that country is not selected (sometimes the flag area is gray)
    var countryData = $('#phone').intlTelInput('getSelectedCountryData');
    var dialCode = countryData.dialCode;


    $http({
      method: 'POST',
      url: backendUrl + '/login',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true,
      transformRequest: function transformRequest() {
        var str = [];
        str.push('phone=' + dialCode + $scope.phone);
        str.push('password=' + $scope.password);
        return str.join('&');
      }
    }).success(function (res) {
      if (res.error) {
        $scope.error = res.error;
        return;
      }

      window.location = 'myAccount.html?accountId=' + res._id;
    }).error(function (err) {
      // server response with an error status also goes here
      var errorMsg = err.error ? err.error : err;
      $scope.error = 'Server error: ' + errorMsg;
    });
  };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxvZ2luLmpzIl0sIm5hbWVzIjpbIiQiLCJpbnRsVGVsSW5wdXQiLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29udHJvbGxlciIsIiRzY29wZSIsIiRodHRwIiwiYmFja2VuZFVybCIsImdldCIsIndpdGhDcmVkZW50aWFscyIsInRoZW4iLCJyZXMiLCJlcnJvciIsImRhdGEiLCJfaWQiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsInNpZ251cCIsImZvcmdvdFBhc3N3b3JkIiwic3VibWl0RGF0YSIsInBob25lIiwicGFzc3dvcmQiLCJjb3VudHJ5RGF0YSIsImRpYWxDb2RlIiwibWV0aG9kIiwidXJsIiwiaGVhZGVycyIsInRyYW5zZm9ybVJlcXVlc3QiLCJzdHIiLCJwdXNoIiwiam9pbiIsInN1Y2Nlc3MiLCJlcnIiLCJlcnJvck1zZyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBQSxFQUFFLFFBQUYsRUFBWUMsWUFBWjs7QUFFQSxJQUFNQyxNQUFNQyxRQUFRQyxNQUFSLENBQWUsT0FBZixFQUF3QixFQUF4QixDQUFaO0FBQ0FGLElBQUlHLFVBQUosQ0FBZSxRQUFmLEVBQXlCLFVBQUNDLE1BQUQsRUFBU0MsS0FBVCxFQUFtQjtBQUMxQyxNQUFNQyxhQUFhLG1DQUFuQjs7QUFFQUQsUUFBTUUsR0FBTixDQUNLRCxVQURMLHVCQUVFLEVBQUVFLGlCQUFpQixJQUFuQixFQUZGLEVBR0VDLElBSEYsQ0FHTyxVQUFDQyxHQUFELEVBQVM7QUFDZCxRQUFJQSxJQUFJQyxLQUFKLElBQWEsQ0FBQ0QsSUFBSUUsSUFBbEIsSUFBMEIsQ0FBQ0YsSUFBSUUsSUFBSixDQUFTQyxHQUF4QyxFQUE2QztBQUMzQztBQUNEOztBQUVEQyxXQUFPQyxRQUFQLDJCQUF3Q0wsSUFBSUUsSUFBSixDQUFTQyxHQUFqRDtBQUNELEdBVEQ7O0FBV0FULFNBQU9ZLE1BQVAsR0FBZ0IsWUFBTTtBQUNwQkYsV0FBT0MsUUFBUCxHQUFrQixlQUFsQjtBQUNELEdBRkQ7O0FBSUFYLFNBQU9hLGNBQVAsR0FBd0IsWUFBTTtBQUM1QkgsV0FBT0MsUUFBUCxHQUFrQixxQkFBbEI7QUFDRCxHQUZEOztBQUlBWCxTQUFPYyxVQUFQLEdBQW9CLFlBQU07QUFDeEIsUUFBSWQsT0FBT2UsS0FBUCxLQUFpQixFQUFqQixJQUF1QmYsT0FBT2dCLFFBQVAsS0FBb0IsRUFBL0MsRUFBbUQ7QUFDakRoQixhQUFPTyxLQUFQLEdBQWUsOEJBQWY7QUFDQTtBQUNEOztBQUVEO0FBQ0EsUUFBTVUsY0FBY3ZCLEVBQUUsUUFBRixFQUFZQyxZQUFaLENBQXlCLHdCQUF6QixDQUFwQjtBQVB3QixRQVFoQnVCLFFBUmdCLEdBUUhELFdBUkcsQ0FRaEJDLFFBUmdCOzs7QUFVeEJqQixVQUFNO0FBQ0prQixjQUFRLE1BREo7QUFFSkMsV0FBUWxCLFVBQVIsV0FGSTtBQUdKbUIsZUFBUztBQUNQLHdCQUFnQjtBQURULE9BSEw7QUFNSmpCLHVCQUFpQixJQU5iO0FBT0prQixzQkFQSSw4QkFPZTtBQUNqQixZQUFNQyxNQUFNLEVBQVo7QUFDQUEsWUFBSUMsSUFBSixZQUFrQk4sUUFBbEIsR0FBNkJsQixPQUFPZSxLQUFwQztBQUNBUSxZQUFJQyxJQUFKLGVBQXFCeEIsT0FBT2dCLFFBQTVCO0FBQ0EsZUFBT08sSUFBSUUsSUFBSixDQUFTLEdBQVQsQ0FBUDtBQUNEO0FBWkcsS0FBTixFQWFHQyxPQWJILENBYVcsVUFBQ3BCLEdBQUQsRUFBUztBQUNsQixVQUFJQSxJQUFJQyxLQUFSLEVBQWU7QUFDYlAsZUFBT08sS0FBUCxHQUFlRCxJQUFJQyxLQUFuQjtBQUNBO0FBQ0Q7O0FBRURHLGFBQU9DLFFBQVAsaUNBQThDTCxJQUFJRyxHQUFsRDtBQUNELEtBcEJELEVBb0JHRixLQXBCSCxDQW9CUyxVQUFDb0IsR0FBRCxFQUFTO0FBQ2hCO0FBQ0EsVUFBTUMsV0FBWUQsSUFBSXBCLEtBQUwsR0FBY29CLElBQUlwQixLQUFsQixHQUEwQm9CLEdBQTNDO0FBQ0EzQixhQUFPTyxLQUFQLHNCQUFnQ3FCLFFBQWhDO0FBQ0QsS0F4QkQ7QUF5QkQsR0FuQ0Q7QUFvQ0QsQ0ExREQiLCJmaWxlIjoibG9naW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlcnNjb3JlLWRhbmdsZSAqL1xuJCgnI3Bob25lJykuaW50bFRlbElucHV0KCk7XG5cbmNvbnN0IGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdteUFwcCcsIFtdKTtcbmFwcC5jb250cm9sbGVyKCdteUN0cmwnLCAoJHNjb3BlLCAkaHR0cCkgPT4ge1xuICBjb25zdCBiYWNrZW5kVXJsID0gJ2h0dHBzOi8vY2xvdWRzZXJ2ZXIuY2FybWEtY2FtLmNvbSc7XG5cbiAgJGh0dHAuZ2V0KFxuICAgIGAke2JhY2tlbmRVcmx9L2xvZ2luV2l0aENvb2tpZWAsXG4gICAgeyB3aXRoQ3JlZGVudGlhbHM6IHRydWUgfSxcbiAgKS50aGVuKChyZXMpID0+IHtcbiAgICBpZiAocmVzLmVycm9yIHx8ICFyZXMuZGF0YSB8fCAhcmVzLmRhdGEuX2lkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2luZG93LmxvY2F0aW9uID0gYG15QWNjb3VudC5odG1sP19pZD0ke3Jlcy5kYXRhLl9pZH1gO1xuICB9KTtcblxuICAkc2NvcGUuc2lnbnVwID0gKCkgPT4ge1xuICAgIHdpbmRvdy5sb2NhdGlvbiA9ICdyZWdpc3Rlci5odG1sJztcbiAgfTtcblxuICAkc2NvcGUuZm9yZ290UGFzc3dvcmQgPSAoKSA9PiB7XG4gICAgd2luZG93LmxvY2F0aW9uID0gJ2ZvcmdvdFBhc3N3b3JkLmh0bWwnO1xuICB9O1xuXG4gICRzY29wZS5zdWJtaXREYXRhID0gKCkgPT4ge1xuICAgIGlmICgkc2NvcGUucGhvbmUgPT09ICcnIHx8ICRzY29wZS5wYXNzd29yZCA9PT0gJycpIHtcbiAgICAgICRzY29wZS5lcnJvciA9ICdQbGVhc2UgZW50ZXIgYWxsIHRoZSBkZXRhaWxzJztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBmaW5kIGEgd2F5IHRvIG5vdGlmeSB0aGF0IGNvdW50cnkgaXMgbm90IHNlbGVjdGVkIChzb21ldGltZXMgdGhlIGZsYWcgYXJlYSBpcyBncmF5KVxuICAgIGNvbnN0IGNvdW50cnlEYXRhID0gJCgnI3Bob25lJykuaW50bFRlbElucHV0KCdnZXRTZWxlY3RlZENvdW50cnlEYXRhJyk7XG4gICAgY29uc3QgeyBkaWFsQ29kZSB9ID0gY291bnRyeURhdGE7XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogYCR7YmFja2VuZFVybH0vbG9naW5gLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICAgICB9LFxuICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgdHJhbnNmb3JtUmVxdWVzdCgpIHtcbiAgICAgICAgY29uc3Qgc3RyID0gW107XG4gICAgICAgIHN0ci5wdXNoKGBwaG9uZT0ke2RpYWxDb2RlfSR7JHNjb3BlLnBob25lfWApO1xuICAgICAgICBzdHIucHVzaChgcGFzc3dvcmQ9JHskc2NvcGUucGFzc3dvcmR9YCk7XG4gICAgICAgIHJldHVybiBzdHIuam9pbignJicpO1xuICAgICAgfSxcbiAgICB9KS5zdWNjZXNzKChyZXMpID0+IHtcbiAgICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgICAgJHNjb3BlLmVycm9yID0gcmVzLmVycm9yO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGBteUFjY291bnQuaHRtbD9hY2NvdW50SWQ9JHtyZXMuX2lkfWA7XG4gICAgfSkuZXJyb3IoKGVycikgPT4ge1xuICAgICAgLy8gc2VydmVyIHJlc3BvbnNlIHdpdGggYW4gZXJyb3Igc3RhdHVzIGFsc28gZ29lcyBoZXJlXG4gICAgICBjb25zdCBlcnJvck1zZyA9IChlcnIuZXJyb3IpID8gZXJyLmVycm9yIDogZXJyO1xuICAgICAgJHNjb3BlLmVycm9yID0gYFNlcnZlciBlcnJvcjogJHtlcnJvck1zZ31gO1xuICAgIH0pO1xuICB9O1xufSk7XG4iXX0=
