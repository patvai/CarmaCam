'use strict';

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {
  var backendUrl = 'https://cloudserver.carma-cam.com';

  $scope.requestPasswordReset = function () {
    $scope.error = '';
    $http({
      method: 'GET',
      // TODO: should validate the email first
      url: backendUrl + '/resetPassword?email=' + $scope.email
    }).success(function (res) {
      if (res.error) {
        $scope.error = res.error;
        window.alert('Could not send you the email for password reset. ' + res.error);
        return;
      }

      window.alert('The email for password reset has been sent to you, please follow the instruction in the mail');
      // window.location = 'index.html';
    }).error(function (err) {
      // server response with an error status also goes here
      var errorMsg = err.error ? err.error : err;
      $scope.error = 'Server error: ' + errorMsg;
    });
  };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvcmdvdFBhc3N3b3JkLmpzIl0sIm5hbWVzIjpbImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb250cm9sbGVyIiwiJHNjb3BlIiwiJGh0dHAiLCJiYWNrZW5kVXJsIiwicmVxdWVzdFBhc3N3b3JkUmVzZXQiLCJlcnJvciIsIm1ldGhvZCIsInVybCIsImVtYWlsIiwic3VjY2VzcyIsInJlcyIsIndpbmRvdyIsImFsZXJ0IiwiZXJyIiwiZXJyb3JNc2ciXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBTUEsTUFBTUMsUUFBUUMsTUFBUixDQUFlLE9BQWYsRUFBd0IsRUFBeEIsQ0FBWjtBQUNBRixJQUFJRyxVQUFKLENBQWUsUUFBZixFQUF5QixVQUFDQyxNQUFELEVBQVNDLEtBQVQsRUFBbUI7QUFDMUMsTUFBTUMsYUFBYSxtQ0FBbkI7O0FBRUFGLFNBQU9HLG9CQUFQLEdBQThCLFlBQU07QUFDbENILFdBQU9JLEtBQVAsR0FBZSxFQUFmO0FBQ0FILFVBQU07QUFDSkksY0FBUSxLQURKO0FBRUo7QUFDQUMsV0FBUUosVUFBUiw2QkFBMENGLE9BQU9PO0FBSDdDLEtBQU4sRUFJR0MsT0FKSCxDQUlXLFVBQUNDLEdBQUQsRUFBUztBQUNsQixVQUFJQSxJQUFJTCxLQUFSLEVBQWU7QUFDYkosZUFBT0ksS0FBUCxHQUFlSyxJQUFJTCxLQUFuQjtBQUNBTSxlQUFPQyxLQUFQLHVEQUFpRUYsSUFBSUwsS0FBckU7QUFDQTtBQUNEOztBQUVETSxhQUFPQyxLQUFQLENBQWEsOEZBQWI7QUFDQTtBQUNELEtBYkQsRUFhR1AsS0FiSCxDQWFTLFVBQUNRLEdBQUQsRUFBUztBQUNoQjtBQUNBLFVBQU1DLFdBQVlELElBQUlSLEtBQUwsR0FBY1EsSUFBSVIsS0FBbEIsR0FBMEJRLEdBQTNDO0FBQ0FaLGFBQU9JLEtBQVAsc0JBQWdDUyxRQUFoQztBQUNELEtBakJEO0FBa0JELEdBcEJEO0FBcUJELENBeEJEIiwiZmlsZSI6ImZvcmdvdFBhc3N3b3JkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgYXBwID0gYW5ndWxhci5tb2R1bGUoJ215QXBwJywgW10pO1xuYXBwLmNvbnRyb2xsZXIoJ215Q3RybCcsICgkc2NvcGUsICRodHRwKSA9PiB7XG4gIGNvbnN0IGJhY2tlbmRVcmwgPSAnaHR0cHM6Ly9jbG91ZHNlcnZlci5jYXJtYS1jYW0uY29tJztcblxuICAkc2NvcGUucmVxdWVzdFBhc3N3b3JkUmVzZXQgPSAoKSA9PiB7XG4gICAgJHNjb3BlLmVycm9yID0gJyc7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIC8vIFRPRE86IHNob3VsZCB2YWxpZGF0ZSB0aGUgZW1haWwgZmlyc3RcbiAgICAgIHVybDogYCR7YmFja2VuZFVybH0vcmVzZXRQYXNzd29yZD9lbWFpbD0keyRzY29wZS5lbWFpbH1gLFxuICAgIH0pLnN1Y2Nlc3MoKHJlcykgPT4ge1xuICAgICAgaWYgKHJlcy5lcnJvcikge1xuICAgICAgICAkc2NvcGUuZXJyb3IgPSByZXMuZXJyb3I7XG4gICAgICAgIHdpbmRvdy5hbGVydChgQ291bGQgbm90IHNlbmQgeW91IHRoZSBlbWFpbCBmb3IgcGFzc3dvcmQgcmVzZXQuICR7cmVzLmVycm9yfWApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5hbGVydCgnVGhlIGVtYWlsIGZvciBwYXNzd29yZCByZXNldCBoYXMgYmVlbiBzZW50IHRvIHlvdSwgcGxlYXNlIGZvbGxvdyB0aGUgaW5zdHJ1Y3Rpb24gaW4gdGhlIG1haWwnKTtcbiAgICAgIC8vIHdpbmRvdy5sb2NhdGlvbiA9ICdpbmRleC5odG1sJztcbiAgICB9KS5lcnJvcigoZXJyKSA9PiB7XG4gICAgICAvLyBzZXJ2ZXIgcmVzcG9uc2Ugd2l0aCBhbiBlcnJvciBzdGF0dXMgYWxzbyBnb2VzIGhlcmVcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gKGVyci5lcnJvcikgPyBlcnIuZXJyb3IgOiBlcnI7XG4gICAgICAkc2NvcGUuZXJyb3IgPSBgU2VydmVyIGVycm9yOiAke2Vycm9yTXNnfWA7XG4gICAgfSk7XG4gIH07XG59KTtcbiJdfQ==
