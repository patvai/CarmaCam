'use strict';

$('#phone').intlTelInput();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {
  var backendUrl = 'https://cloudserver.carma-cam.com';

  $scope.submitData = function () {
    if ($scope.phone === '' || $scope.email === '' || $scope.fname === '' || $scope.lname === '' || $scope.password === '' || $scope.zipcode === '') {
      $scope.error = 'Please make sure no fields are blank';
      return;
    }

    // TODO: find a way to notify that country is not selected (sometimes the flag area is gray)
    var countryData = $('#phone').intlTelInput('getSelectedCountryData');
    var dialCode = countryData.dialCode;


    $http({
      method: 'POST',
      url: backendUrl + '/accounts',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      transformRequest: function transformRequest() {
        var str = [];
        str.push('fname=' + $scope.fname);
        str.push('lname=' + $scope.lname);
        str.push('email=' + $scope.email);
        str.push('username=' + $scope.username);
        str.push('phone=' + dialCode + $scope.phone);
        str.push('password=' + $scope.password);
        str.push('licensePlate=' + $scope.license);
        str.push('zipcode=' + $scope.zipcode);
        return str.join('&');
      },

      withCredentials: true
    }).success(function (res) {
      if (res.error) {
        $scope.error = res.error;
        return;
      }

      window.location = 'myAccount.html?_id=' + res.id;
    }).error(function (err) {
      // server response with an error status also goes here
      var errorMsg = err.error ? err.error : err;
      $scope.error = 'Server error: ' + errorMsg;
    });
  };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlZ2lzdGVyLmpzIl0sIm5hbWVzIjpbIiQiLCJpbnRsVGVsSW5wdXQiLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29udHJvbGxlciIsIiRzY29wZSIsIiRodHRwIiwiYmFja2VuZFVybCIsInN1Ym1pdERhdGEiLCJwaG9uZSIsImVtYWlsIiwiZm5hbWUiLCJsbmFtZSIsInBhc3N3b3JkIiwiemlwY29kZSIsImVycm9yIiwiY291bnRyeURhdGEiLCJkaWFsQ29kZSIsIm1ldGhvZCIsInVybCIsImhlYWRlcnMiLCJ0cmFuc2Zvcm1SZXF1ZXN0Iiwic3RyIiwicHVzaCIsInVzZXJuYW1lIiwibGljZW5zZSIsImpvaW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJzdWNjZXNzIiwicmVzIiwid2luZG93IiwibG9jYXRpb24iLCJpZCIsImVyciIsImVycm9yTXNnIl0sIm1hcHBpbmdzIjoiOztBQUFBQSxFQUFFLFFBQUYsRUFBWUMsWUFBWjs7QUFFQSxJQUFNQyxNQUFNQyxRQUFRQyxNQUFSLENBQWUsT0FBZixFQUF3QixFQUF4QixDQUFaO0FBQ0FGLElBQUlHLFVBQUosQ0FBZSxRQUFmLEVBQXlCLFVBQUNDLE1BQUQsRUFBU0MsS0FBVCxFQUFtQjtBQUMxQyxNQUFNQyxhQUFhLG1DQUFuQjs7QUFFQUYsU0FBT0csVUFBUCxHQUFvQixZQUFNO0FBQ3hCLFFBQUlILE9BQU9JLEtBQVAsS0FBaUIsRUFBakIsSUFDQ0osT0FBT0ssS0FBUCxLQUFpQixFQURsQixJQUVDTCxPQUFPTSxLQUFQLEtBQWlCLEVBRmxCLElBR0NOLE9BQU9PLEtBQVAsS0FBaUIsRUFIbEIsSUFJQ1AsT0FBT1EsUUFBUCxLQUFvQixFQUpyQixJQUtDUixPQUFPUyxPQUFQLEtBQW1CLEVBTHhCLEVBSzRCO0FBQzFCVCxhQUFPVSxLQUFQLEdBQWUsc0NBQWY7QUFDQTtBQUNEOztBQUVEO0FBQ0EsUUFBTUMsY0FBY2pCLEVBQUUsUUFBRixFQUFZQyxZQUFaLENBQXlCLHdCQUF6QixDQUFwQjtBQVp3QixRQWFoQmlCLFFBYmdCLEdBYUhELFdBYkcsQ0FhaEJDLFFBYmdCOzs7QUFleEJYLFVBQU07QUFDSlksY0FBUSxNQURKO0FBRUpDLFdBQVFaLFVBQVIsY0FGSTtBQUdKYSxlQUFTO0FBQ1Asd0JBQWdCO0FBRFQsT0FITDtBQU1KQyxzQkFOSSw4QkFNZTtBQUNqQixZQUFNQyxNQUFNLEVBQVo7QUFDQUEsWUFBSUMsSUFBSixZQUFrQmxCLE9BQU9NLEtBQXpCO0FBQ0FXLFlBQUlDLElBQUosWUFBa0JsQixPQUFPTyxLQUF6QjtBQUNBVSxZQUFJQyxJQUFKLFlBQWtCbEIsT0FBT0ssS0FBekI7QUFDQVksWUFBSUMsSUFBSixlQUFxQmxCLE9BQU9tQixRQUE1QjtBQUNBRixZQUFJQyxJQUFKLFlBQWtCTixRQUFsQixHQUE2QlosT0FBT0ksS0FBcEM7QUFDQWEsWUFBSUMsSUFBSixlQUFxQmxCLE9BQU9RLFFBQTVCO0FBQ0FTLFlBQUlDLElBQUosbUJBQXlCbEIsT0FBT29CLE9BQWhDO0FBQ0FILFlBQUlDLElBQUosY0FBb0JsQixPQUFPUyxPQUEzQjtBQUNBLGVBQU9RLElBQUlJLElBQUosQ0FBUyxHQUFULENBQVA7QUFDRCxPQWpCRzs7QUFrQkpDLHVCQUFpQjtBQWxCYixLQUFOLEVBbUJHQyxPQW5CSCxDQW1CVyxVQUFDQyxHQUFELEVBQVM7QUFDbEIsVUFBSUEsSUFBSWQsS0FBUixFQUFlO0FBQ2JWLGVBQU9VLEtBQVAsR0FBZWMsSUFBSWQsS0FBbkI7QUFDQTtBQUNEOztBQUVEZSxhQUFPQyxRQUFQLDJCQUF3Q0YsSUFBSUcsRUFBNUM7QUFDRCxLQTFCRCxFQTBCR2pCLEtBMUJILENBMEJTLFVBQUNrQixHQUFELEVBQVM7QUFDaEI7QUFDQSxVQUFNQyxXQUFZRCxJQUFJbEIsS0FBTCxHQUFja0IsSUFBSWxCLEtBQWxCLEdBQTBCa0IsR0FBM0M7QUFDQTVCLGFBQU9VLEtBQVAsc0JBQWdDbUIsUUFBaEM7QUFDRCxLQTlCRDtBQStCRCxHQTlDRDtBQStDRCxDQWxERCIsImZpbGUiOiJyZWdpc3Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQoJyNwaG9uZScpLmludGxUZWxJbnB1dCgpO1xuXG5jb25zdCBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnbXlBcHAnLCBbXSk7XG5hcHAuY29udHJvbGxlcignbXlDdHJsJywgKCRzY29wZSwgJGh0dHApID0+IHtcbiAgY29uc3QgYmFja2VuZFVybCA9ICdodHRwczovL2Nsb3Vkc2VydmVyLmNhcm1hLWNhbS5jb20nO1xuXG4gICRzY29wZS5zdWJtaXREYXRhID0gKCkgPT4ge1xuICAgIGlmICgkc2NvcGUucGhvbmUgPT09ICcnXG4gICAgICB8fCAkc2NvcGUuZW1haWwgPT09ICcnXG4gICAgICB8fCAkc2NvcGUuZm5hbWUgPT09ICcnXG4gICAgICB8fCAkc2NvcGUubG5hbWUgPT09ICcnXG4gICAgICB8fCAkc2NvcGUucGFzc3dvcmQgPT09ICcnXG4gICAgICB8fCAkc2NvcGUuemlwY29kZSA9PT0gJycpIHtcbiAgICAgICRzY29wZS5lcnJvciA9ICdQbGVhc2UgbWFrZSBzdXJlIG5vIGZpZWxkcyBhcmUgYmxhbmsnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGZpbmQgYSB3YXkgdG8gbm90aWZ5IHRoYXQgY291bnRyeSBpcyBub3Qgc2VsZWN0ZWQgKHNvbWV0aW1lcyB0aGUgZmxhZyBhcmVhIGlzIGdyYXkpXG4gICAgY29uc3QgY291bnRyeURhdGEgPSAkKCcjcGhvbmUnKS5pbnRsVGVsSW5wdXQoJ2dldFNlbGVjdGVkQ291bnRyeURhdGEnKTtcbiAgICBjb25zdCB7IGRpYWxDb2RlIH0gPSBjb3VudHJ5RGF0YTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiBgJHtiYWNrZW5kVXJsfS9hY2NvdW50c2AsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyxcbiAgICAgIH0sXG4gICAgICB0cmFuc2Zvcm1SZXF1ZXN0KCkge1xuICAgICAgICBjb25zdCBzdHIgPSBbXTtcbiAgICAgICAgc3RyLnB1c2goYGZuYW1lPSR7JHNjb3BlLmZuYW1lfWApO1xuICAgICAgICBzdHIucHVzaChgbG5hbWU9JHskc2NvcGUubG5hbWV9YCk7XG4gICAgICAgIHN0ci5wdXNoKGBlbWFpbD0keyRzY29wZS5lbWFpbH1gKTtcbiAgICAgICAgc3RyLnB1c2goYHVzZXJuYW1lPSR7JHNjb3BlLnVzZXJuYW1lfWApO1xuICAgICAgICBzdHIucHVzaChgcGhvbmU9JHtkaWFsQ29kZX0keyRzY29wZS5waG9uZX1gKTtcbiAgICAgICAgc3RyLnB1c2goYHBhc3N3b3JkPSR7JHNjb3BlLnBhc3N3b3JkfWApO1xuICAgICAgICBzdHIucHVzaChgbGljZW5zZVBsYXRlPSR7JHNjb3BlLmxpY2Vuc2V9YCk7XG4gICAgICAgIHN0ci5wdXNoKGB6aXBjb2RlPSR7JHNjb3BlLnppcGNvZGV9YCk7XG4gICAgICAgIHJldHVybiBzdHIuam9pbignJicpO1xuICAgICAgfSxcbiAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICB9KS5zdWNjZXNzKChyZXMpID0+IHtcbiAgICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgICAgJHNjb3BlLmVycm9yID0gcmVzLmVycm9yO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IGBteUFjY291bnQuaHRtbD9faWQ9JHtyZXMuaWR9YDtcbiAgICB9KS5lcnJvcigoZXJyKSA9PiB7XG4gICAgICAvLyBzZXJ2ZXIgcmVzcG9uc2Ugd2l0aCBhbiBlcnJvciBzdGF0dXMgYWxzbyBnb2VzIGhlcmVcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gKGVyci5lcnJvcikgPyBlcnIuZXJyb3IgOiBlcnI7XG4gICAgICAkc2NvcGUuZXJyb3IgPSBgU2VydmVyIGVycm9yOiAke2Vycm9yTXNnfWA7XG4gICAgfSk7XG4gIH07XG59KTtcbiJdfQ==
