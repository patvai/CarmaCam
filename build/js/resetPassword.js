'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* eslint-disable no-underscore-dangle */
$('#phone').intlTelInput();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {
  var backendUrl = 'https://cloudserver.carma-cam.com';
  // ?pinCode=xx&email=xx

  var _window$location$sear = window.location.search.split('&'),
      _window$location$sear2 = _slicedToArray(_window$location$sear, 2),
      pinCodeData = _window$location$sear2[0],
      emailData = _window$location$sear2[1];

  var _pinCodeData$split = pinCodeData.split('='),
      _pinCodeData$split2 = _slicedToArray(_pinCodeData$split, 2),
      pinCode = _pinCodeData$split2[1];

  var _emailData$split = emailData.split('='),
      _emailData$split2 = _slicedToArray(_emailData$split, 2),
      email = _emailData$split2[1];

  $scope.pinCode = pinCode;
  $scope.email = email;
  $scope.phone = '';
  $scope.newPassword = '';
  $scope.newPasswordConfirm = '';

  $scope.resetPassword = function () {
    if ($scope.pinCode === '' || $scope.email === '' || $scope.phone === '' || $scope.newPassword === '' || $scope.newPasswordConfirm === '') {
      $scope.error = 'Please make sure no fields are blank';
      return;
    }

    if ($scope.newPassword !== $scope.newPasswordConfirm) {
      $scope.error = 'The passwords entered are not consistent.';
      return;
    }

    var countryData = $('#phone').intlTelInput('getSelectedCountryData');
    var dialCode = countryData.dialCode;


    $scope.error = '';
    $http({
      method: 'POST',
      url: backendUrl + '/updatePassword',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest: function transformRequest() {
        var str = [];
        str.push('pinCode=' + $scope.pinCode);
        str.push('email=' + $scope.email);
        str.push('phone=' + dialCode + $scope.phone);
        str.push('newPassword=' + $scope.newPassword);
        return str.join('&');
      }
    }).success(function (res) {
      window.alert('Successfully updated your password');
      window.location = 'login.html';
    }).error(function (err) {
      var errorMsg = err.error ? err.error : err;
      $scope.error = 'Server error: ' + errorMsg;
    });
  };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc2V0UGFzc3dvcmQuanMiXSwibmFtZXMiOlsiJCIsImludGxUZWxJbnB1dCIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb250cm9sbGVyIiwiJHNjb3BlIiwiJGh0dHAiLCJiYWNrZW5kVXJsIiwid2luZG93IiwibG9jYXRpb24iLCJzZWFyY2giLCJzcGxpdCIsInBpbkNvZGVEYXRhIiwiZW1haWxEYXRhIiwicGluQ29kZSIsImVtYWlsIiwicGhvbmUiLCJuZXdQYXNzd29yZCIsIm5ld1Bhc3N3b3JkQ29uZmlybSIsInJlc2V0UGFzc3dvcmQiLCJlcnJvciIsImNvdW50cnlEYXRhIiwiZGlhbENvZGUiLCJtZXRob2QiLCJ1cmwiLCJoZWFkZXJzIiwidHJhbnNmb3JtUmVxdWVzdCIsInN0ciIsInB1c2giLCJqb2luIiwic3VjY2VzcyIsInJlcyIsImFsZXJ0IiwiZXJyIiwiZXJyb3JNc2ciXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBQSxFQUFFLFFBQUYsRUFBWUMsWUFBWjs7QUFFQSxJQUFNQyxNQUFNQyxRQUFRQyxNQUFSLENBQWUsT0FBZixFQUF3QixFQUF4QixDQUFaO0FBQ0FGLElBQUlHLFVBQUosQ0FBZSxRQUFmLEVBQXlCLFVBQUNDLE1BQUQsRUFBU0MsS0FBVCxFQUFtQjtBQUMxQyxNQUFNQyxhQUFhLG1DQUFuQjtBQUNBOztBQUYwQyw4QkFHVEMsT0FBT0MsUUFBUCxDQUFnQkMsTUFBaEIsQ0FBdUJDLEtBQXZCLENBQTZCLEdBQTdCLENBSFM7QUFBQTtBQUFBLE1BR25DQyxXQUhtQztBQUFBLE1BR3RCQyxTQUhzQjs7QUFBQSwyQkFJdEJELFlBQVlELEtBQVosQ0FBa0IsR0FBbEIsQ0FKc0I7QUFBQTtBQUFBLE1BSWpDRyxPQUppQzs7QUFBQSx5QkFLeEJELFVBQVVGLEtBQVYsQ0FBZ0IsR0FBaEIsQ0FMd0I7QUFBQTtBQUFBLE1BS2pDSSxLQUxpQzs7QUFNMUNWLFNBQU9TLE9BQVAsR0FBaUJBLE9BQWpCO0FBQ0FULFNBQU9VLEtBQVAsR0FBZUEsS0FBZjtBQUNBVixTQUFPVyxLQUFQLEdBQWUsRUFBZjtBQUNBWCxTQUFPWSxXQUFQLEdBQXFCLEVBQXJCO0FBQ0FaLFNBQU9hLGtCQUFQLEdBQTRCLEVBQTVCOztBQUVBYixTQUFPYyxhQUFQLEdBQXVCLFlBQU07QUFDM0IsUUFBSWQsT0FBT1MsT0FBUCxLQUFtQixFQUFuQixJQUNDVCxPQUFPVSxLQUFQLEtBQWlCLEVBRGxCLElBRUNWLE9BQU9XLEtBQVAsS0FBaUIsRUFGbEIsSUFHQ1gsT0FBT1ksV0FBUCxLQUF1QixFQUh4QixJQUlDWixPQUFPYSxrQkFBUCxLQUE4QixFQUpuQyxFQUl1QztBQUNyQ2IsYUFBT2UsS0FBUCxHQUFlLHNDQUFmO0FBQ0E7QUFDRDs7QUFFRCxRQUFJZixPQUFPWSxXQUFQLEtBQXVCWixPQUFPYSxrQkFBbEMsRUFBc0Q7QUFDcERiLGFBQU9lLEtBQVAsR0FBZSwyQ0FBZjtBQUNBO0FBQ0Q7O0FBRUQsUUFBTUMsY0FBY3RCLEVBQUUsUUFBRixFQUFZQyxZQUFaLENBQXlCLHdCQUF6QixDQUFwQjtBQWYyQixRQWdCbkJzQixRQWhCbUIsR0FnQk5ELFdBaEJNLENBZ0JuQkMsUUFoQm1COzs7QUFrQjNCakIsV0FBT2UsS0FBUCxHQUFlLEVBQWY7QUFDQWQsVUFBTTtBQUNKaUIsY0FBUSxNQURKO0FBRUpDLFdBQVFqQixVQUFSLG9CQUZJO0FBR0prQixlQUFTLEVBQUUsZ0JBQWdCLG1DQUFsQixFQUhMO0FBSUpDLHdCQUFrQiw0QkFBTTtBQUN0QixZQUFNQyxNQUFNLEVBQVo7QUFDQUEsWUFBSUMsSUFBSixjQUFvQnZCLE9BQU9TLE9BQTNCO0FBQ0FhLFlBQUlDLElBQUosWUFBa0J2QixPQUFPVSxLQUF6QjtBQUNBWSxZQUFJQyxJQUFKLFlBQWtCTixRQUFsQixHQUE2QmpCLE9BQU9XLEtBQXBDO0FBQ0FXLFlBQUlDLElBQUosa0JBQXdCdkIsT0FBT1ksV0FBL0I7QUFDQSxlQUFPVSxJQUFJRSxJQUFKLENBQVMsR0FBVCxDQUFQO0FBQ0Q7QUFYRyxLQUFOLEVBWUdDLE9BWkgsQ0FZVyxVQUFDQyxHQUFELEVBQVM7QUFDbEJ2QixhQUFPd0IsS0FBUCxDQUFhLG9DQUFiO0FBQ0F4QixhQUFPQyxRQUFQLEdBQWtCLFlBQWxCO0FBQ0QsS0FmRCxFQWVHVyxLQWZILENBZVMsVUFBQ2EsR0FBRCxFQUFTO0FBQ2hCLFVBQU1DLFdBQVlELElBQUliLEtBQUwsR0FBY2EsSUFBSWIsS0FBbEIsR0FBMEJhLEdBQTNDO0FBQ0E1QixhQUFPZSxLQUFQLHNCQUFnQ2MsUUFBaEM7QUFDRCxLQWxCRDtBQW1CRCxHQXRDRDtBQXVDRCxDQW5ERCIsImZpbGUiOiJyZXNldFBhc3N3b3JkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tdW5kZXJzY29yZS1kYW5nbGUgKi9cbiQoJyNwaG9uZScpLmludGxUZWxJbnB1dCgpO1xuXG5jb25zdCBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnbXlBcHAnLCBbXSk7XG5hcHAuY29udHJvbGxlcignbXlDdHJsJywgKCRzY29wZSwgJGh0dHApID0+IHtcbiAgY29uc3QgYmFja2VuZFVybCA9ICdodHRwczovL2Nsb3Vkc2VydmVyLmNhcm1hLWNhbS5jb20nO1xuICAvLyA/cGluQ29kZT14eCZlbWFpbD14eFxuICBjb25zdCBbcGluQ29kZURhdGEsIGVtYWlsRGF0YV0gPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLnNwbGl0KCcmJyk7XG4gIGNvbnN0IFssIHBpbkNvZGVdID0gcGluQ29kZURhdGEuc3BsaXQoJz0nKTtcbiAgY29uc3QgWywgZW1haWxdID0gZW1haWxEYXRhLnNwbGl0KCc9Jyk7XG4gICRzY29wZS5waW5Db2RlID0gcGluQ29kZTtcbiAgJHNjb3BlLmVtYWlsID0gZW1haWw7XG4gICRzY29wZS5waG9uZSA9ICcnO1xuICAkc2NvcGUubmV3UGFzc3dvcmQgPSAnJztcbiAgJHNjb3BlLm5ld1Bhc3N3b3JkQ29uZmlybSA9ICcnO1xuXG4gICRzY29wZS5yZXNldFBhc3N3b3JkID0gKCkgPT4ge1xuICAgIGlmICgkc2NvcGUucGluQ29kZSA9PT0gJydcbiAgICAgIHx8ICRzY29wZS5lbWFpbCA9PT0gJydcbiAgICAgIHx8ICRzY29wZS5waG9uZSA9PT0gJydcbiAgICAgIHx8ICRzY29wZS5uZXdQYXNzd29yZCA9PT0gJydcbiAgICAgIHx8ICRzY29wZS5uZXdQYXNzd29yZENvbmZpcm0gPT09ICcnKSB7XG4gICAgICAkc2NvcGUuZXJyb3IgPSAnUGxlYXNlIG1ha2Ugc3VyZSBubyBmaWVsZHMgYXJlIGJsYW5rJztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoJHNjb3BlLm5ld1Bhc3N3b3JkICE9PSAkc2NvcGUubmV3UGFzc3dvcmRDb25maXJtKSB7XG4gICAgICAkc2NvcGUuZXJyb3IgPSAnVGhlIHBhc3N3b3JkcyBlbnRlcmVkIGFyZSBub3QgY29uc2lzdGVudC4nO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvdW50cnlEYXRhID0gJCgnI3Bob25lJykuaW50bFRlbElucHV0KCdnZXRTZWxlY3RlZENvdW50cnlEYXRhJyk7XG4gICAgY29uc3QgeyBkaWFsQ29kZSB9ID0gY291bnRyeURhdGE7XG5cbiAgICAkc2NvcGUuZXJyb3IgPSAnJztcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogYCR7YmFja2VuZFVybH0vdXBkYXRlUGFzc3dvcmRgLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgIHRyYW5zZm9ybVJlcXVlc3Q6ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3RyID0gW107XG4gICAgICAgIHN0ci5wdXNoKGBwaW5Db2RlPSR7JHNjb3BlLnBpbkNvZGV9YCk7XG4gICAgICAgIHN0ci5wdXNoKGBlbWFpbD0keyRzY29wZS5lbWFpbH1gKTtcbiAgICAgICAgc3RyLnB1c2goYHBob25lPSR7ZGlhbENvZGV9JHskc2NvcGUucGhvbmV9YCk7XG4gICAgICAgIHN0ci5wdXNoKGBuZXdQYXNzd29yZD0keyRzY29wZS5uZXdQYXNzd29yZH1gKTtcbiAgICAgICAgcmV0dXJuIHN0ci5qb2luKCcmJyk7XG4gICAgICB9LFxuICAgIH0pLnN1Y2Nlc3MoKHJlcykgPT4ge1xuICAgICAgd2luZG93LmFsZXJ0KCdTdWNjZXNzZnVsbHkgdXBkYXRlZCB5b3VyIHBhc3N3b3JkJyk7XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSAnbG9naW4uaHRtbCc7XG4gICAgfSkuZXJyb3IoKGVycikgPT4ge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPSAoZXJyLmVycm9yKSA/IGVyci5lcnJvciA6IGVycjtcbiAgICAgICRzY29wZS5lcnJvciA9IGBTZXJ2ZXIgZXJyb3I6ICR7ZXJyb3JNc2d9YDtcbiAgICB9KTtcbiAgfTtcbn0pO1xuIl19
